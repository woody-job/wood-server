import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamIn } from './beam-in.model';
import { WorkshopService } from 'src/workshop/workshop.service';
import { AddBeamInDto } from './dtos/add-beam-in.dto';
import { Op, Sequelize } from 'sequelize';

import * as moment from 'moment';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { UpdateBeamInDto } from './dtos/update-beam-in.dto';
import { WorkshopOutService } from 'src/workshop-out/workshop-out.service';
import { BeamWarehouseService } from 'src/beam-warehouse/beam-warehouse.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';

@Injectable()
export class BeamInService {
  constructor(
    @InjectModel(BeamIn)
    private beamInRepository: typeof BeamIn,
    private workshopService: WorkshopService,
    private beamSizeService: BeamSizeService,
    @Inject(forwardRef(() => WorkshopOutService))
    private workshopOutService: WorkshopOutService,
    private beamWarehouseService: BeamWarehouseService,
    private woodNamingService: WoodNamingService,
  ) {}

  async updateWarehouse({
    woodNamingId,
    beamSizeId,
    amount = 0,
    action = 'add',
    errorMessage,
  }: {
    woodNamingId: number;
    beamSizeId: number;
    amount: number;
    action?: 'add' | 'subtract';
    errorMessage: string;
  }) {
    const existentWarehouseRecord =
      await this.beamWarehouseService.findWarehouseRecordByBeamParams({
        woodNamingId,
        ...(beamSizeId ? { beamSizeId } : {}),
      });

    if (!existentWarehouseRecord) {
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }

    let newAmount = existentWarehouseRecord.amount;

    if (action === 'add') {
      newAmount = existentWarehouseRecord.amount + amount;
    }

    if (action === 'subtract') {
      newAmount = existentWarehouseRecord.amount - amount;
    }

    await this.beamWarehouseService.updateWarehouseRecord({
      beamSizeId,
      amount: newAmount,
      woodNamingId,
    });
  }

  async addBeamToWorkshop(beamInDto: AddBeamInDto) {
    const { beamSizeId, date, amount, workshopId, woodNamingId } = beamInDto;

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    // Если в выбранный день лес с выбранными размерами уже входил,
    // то просто добавляется amount и новый instance не создается
    const existentBeamIn = await this.beamInRepository.findOne({
      where: {
        [Op.and]: Sequelize.where(
          Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
          Op.eq,
          `${year}-${month}-${day}`,
        ),
        beamSizeId,
      },
    });

    if (existentBeamIn) {
      existentBeamIn.amount = existentBeamIn.amount + amount;
      await existentBeamIn.save();

      return existentBeamIn;
    }

    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
    }

    const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

    if (!beamSize) {
      throw new HttpException(
        'Выбранный размер не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const isBeamSizeInWoodNamingBoundaries =
      woodNaming.maxDiameter! >= beamSize.diameter &&
      woodNaming.minDiameter! <= beamSize.diameter;

    if (!isBeamSizeInWoodNamingBoundaries) {
      throw new HttpException(
        `Диаметр ${beamSize.diameter} см не подходит для выбранного обозначения`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Убрать бревна со склада сырья
    await this.updateWarehouse({
      woodNamingId: woodNaming.id,
      action: 'subtract',
      beamSizeId,
      amount,
      errorMessage:
        'На складе нет леса с предоставленными параметрами. Запись не была создана',
    });

    const beamIn = await this.beamInRepository.create({
      amount,
      date,
    });

    await beamIn.$set('beamSize', beamSizeId);
    beamIn.beamSize = beamSize;

    await beamIn.$set('woodNaming', woodNamingId);
    beamIn.woodNaming = woodNaming;

    await beamIn.$set('workshop', workshopId);
    beamIn.workshop = workshop;

    return beamIn;
  }

  async editBeamGoneToWorkshop(beamInId: number, beamInDto: UpdateBeamInDto) {
    const { amount } = beamInDto;

    const beamIn = await this.beamInRepository.findByPk(beamInId);

    if (!beamIn) {
      throw new HttpException(
        'Выбранный вход леса не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const oldBeamInAmount = beamIn.amount;

    // Обновить запись на складе сырья
    let newAmount = oldBeamInAmount;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldBeamInAmount > amount) {
      newAmount = oldBeamInAmount - amount;
      action = 'add';
    }

    if (oldBeamInAmount < amount) {
      newAmount = amount - oldBeamInAmount;
      action = 'subtract';
    }

    await this.updateWarehouse({
      woodNamingId: beamIn.woodNamingId,
      action,
      beamSizeId: beamIn.beamSizeId,
      amount: newAmount,
      errorMessage:
        'На складе нет леса с предоставленными параметрами. Запись не была изменена',
    });

    beamIn.amount = amount;
    await beamIn.save();

    return beamIn;
  }

  async getAllBeamInForWorkshop({
    workshopId,
    startDate,
    endDate,
    sortDirection = 'DESC',
  }: {
    workshopId: number;
    // startDate и endDate должны иметь только год, месяц и день. Часы и минуты
    // должны быть 0
    startDate?: string;
    endDate?: string;
    sortDirection?: string;
  }) {
    const momentStartDate = moment(startDate);
    const momentEndDate = moment(endDate);

    const startYear = momentStartDate.year();
    const startMonth = momentStartDate.month() + 1;
    const startDay = momentStartDate.date();

    const endYear = momentEndDate.year();
    const endMonth = momentEndDate.month() + 1;
    const endDay = momentEndDate.date();

    const beamIns = await this.beamInRepository.findAll({
      include: [BeamSize, WoodNaming],
      attributes: {
        exclude: ['workshopId', 'beamSizeId', 'woodNamingId'],
      },
      where: {
        workshopId,
        ...(startDate && endDate
          ? {
              date: {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
                    Op.gte,
                    `${startYear}-${startMonth}-${startDay}`,
                  ),
                  Sequelize.where(
                    Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
                    Op.lte,
                    `${endYear}-${endMonth}-${endDay}`,
                  ),
                ],
              },
            }
          : {}),
      },
      order: [['date', sortDirection]],
    });

    let totalVolume = 0;

    beamIns.forEach((beamIn) => {
      totalVolume += beamIn.beamSize.volume * beamIn.amount;
    });

    return {
      data: beamIns,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async deleteBeamInFromWorkshop(beamInId: number) {
    const beamIn = await this.beamInRepository.findByPk(beamInId);

    if (!beamIn) {
      throw new HttpException(
        'Выбранный вход леса не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись на складе
    await this.updateWarehouse({
      woodNamingId: beamIn.woodNamingId,
      beamSizeId: beamIn.beamSizeId,
      action: 'add',
      amount: beamIn.amount,
      errorMessage:
        'На складе нет леса с предоставленными параметрами. Запись не была удалена',
    });

    await beamIn.destroy();
  }

  async deleteAllBeamIn() {
    await this.beamInRepository.truncate();
  }
}
