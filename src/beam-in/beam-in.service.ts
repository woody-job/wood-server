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

import * as moment from 'moment-timezone';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { UpdateBeamInDto } from './dtos/update-beam-in.dto';
import { WorkshopOutService } from 'src/workshop-out/workshop-out.service';
import { BeamWarehouseService } from 'src/beam-warehouse/beam-warehouse.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { BeamWarehouseErrorsType } from 'src/types';

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
    woodNaming,
    volume,
    action = 'add',
    errorMessages,
  }: {
    woodNaming: WoodNaming;
    volume: number;
    action?: 'add' | 'subtract';
    errorMessages: BeamWarehouseErrorsType;
  }) {
    const existentWarehouseRecord =
      await this.beamWarehouseService.findWarehouseRecordByBeamParams({
        woodNamingId: woodNaming.id,
      });

    if (!existentWarehouseRecord) {
      throw new HttpException(
        errorMessages.noSuchRecord({
          woodNaming: woodNaming.name.toLowerCase(),
        }),
        HttpStatus.BAD_REQUEST,
      );
    }

    let newVolume = Number(existentWarehouseRecord.volume);

    if (action === 'add') {
      newVolume = Number(existentWarehouseRecord.volume) + volume;
    }

    if (action === 'subtract') {
      newVolume = Number(existentWarehouseRecord.volume) - volume;

      if (existentWarehouseRecord.volume < newVolume) {
        throw new HttpException(
          errorMessages.notEnoughVolume({
            warehouseVolume: existentWarehouseRecord.volume,
            newRecordVolume: volume,
            woodNaming: woodNaming.name.toLocaleLowerCase(),
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.beamWarehouseService.updateWarehouseRecord({
      volume: newVolume,
      woodNamingId: woodNaming.id,
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
      include: [WoodNaming, BeamSize],
    });

    if (existentBeamIn) {
      const beamInVolume = Number(
        (amount * existentBeamIn.beamSize.volume).toFixed(4),
      );

      // Убрать бревна со склада сырья
      await this.updateWarehouse({
        woodNaming: existentBeamIn.woodNaming,
        action: 'subtract',
        volume: beamInVolume,
        errorMessages: {
          noSuchRecord: ({ woodNaming }) =>
            `На складе нет леса "${woodNaming}". Запись о входе в цех не была создана`,
          notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
            `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Создать запись о входе в цех ${newRecordVolume} м3 леса невозможно.`,
        },
      });

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

    const beamInVolume = Number((amount * beamSize.volume).toFixed(4));

    // Убрать бревна со склада сырья
    await this.updateWarehouse({
      woodNaming: woodNaming,
      action: 'subtract',
      volume: beamInVolume,
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись о входе в цех не была создана`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Создать запись о входе в цех ${newRecordVolume} м3 леса невозможно.`,
      },
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

    const beamIn = await this.beamInRepository.findByPk(beamInId, {
      include: [BeamSize, WoodNaming],
    });

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

    const newBeamInVolume = Number(
      (newAmount * beamIn.beamSize.volume).toFixed(4),
    );

    await this.updateWarehouse({
      woodNaming: beamIn.woodNaming,
      action,
      volume: newBeamInVolume,
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись о входе в цех не была изменена`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Изменить запись входа в цех на ${newRecordVolume} м3 невозможно.`,
      },
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
    const beamIn = await this.beamInRepository.findByPk(beamInId, {
      include: [BeamSize, WoodNaming],
    });

    if (!beamIn) {
      throw new HttpException(
        'Выбранный вход леса не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const beamInVolume = Number(
      (beamIn.amount * beamIn.beamSize.volume).toFixed(4),
    );

    // Изменить запись на складе
    await this.updateWarehouse({
      woodNaming: beamIn.woodNaming,
      volume: beamInVolume,
      action: 'add',
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись о входе в цех не была удалена`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Удалить запись о входе в цех ${newRecordVolume} м3 леса невозможно.`,
      },
    });

    await beamIn.destroy();
  }

  async deleteAllBeamIn() {
    await this.beamInRepository.truncate();
  }
}
