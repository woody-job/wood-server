import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamIn } from './beam-in.model';
import { WorkshopService } from 'src/workshop/workshop.service';
import { AddBeamInDto } from './dtos/add-beam-in.dto';
import { Op, Sequelize } from 'sequelize';

import * as moment from 'moment';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { BeamSize } from 'src/beam-size/beam-size.model';

@Injectable()
export class BeamInService {
  constructor(
    @InjectModel(BeamIn)
    private beamInRepository: typeof BeamIn,
    private workshopService: WorkshopService,
    private beamSizeService: BeamSizeService,
  ) {}

  async addBeamToWorkshop(beamInDto: AddBeamInDto) {
    const { beamSizeId, date, amount, workshopId } = beamInDto;

    // В dto date - optional
    if (!date) {
      throw new HttpException('Дата не предоставлена', HttpStatus.BAD_REQUEST);
    }

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
          '=',
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

    // В dto workshopId - optional
    if (!workshopId) {
      throw new HttpException('Цех не предоставлен', HttpStatus.BAD_REQUEST);
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

    const beamIn = await this.beamInRepository.create({
      amount,
      date,
    });

    await beamIn.$set('beamSize', beamSizeId);
    beamIn.beamSize = beamSize;

    await beamIn.$set('workshop', workshopId);
    beamIn.workshop = workshop;

    return beamIn;
  }

  async editBeamGoneToWorkshop(beamInId: number, beamInDto: AddBeamInDto) {
    const { beamSizeId, amount } = beamInDto;

    const beamIn = await this.beamInRepository.findByPk(beamInId);

    if (!beamIn) {
      throw new HttpException(
        'Выбранный вход леса не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

    if (!beamSize) {
      throw new HttpException(
        'Выбранный размер не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    if (beamIn.beamSizeId !== beamSizeId) {
      await beamIn.$set('beamSize', beamSizeId);
      beamIn.beamSize = beamSize;
    }

    beamIn.amount = beamIn.amount + amount;

    return beamIn;
  }

  async getAllBeamInForWorkshop({
    workshopId,
    startDate,
    endDate,
  }: {
    workshopId: number;
    // startDate и endDate должны иметь только год, месяц и день. Часы и минуты
    // должны быть 0
    startDate?: string;
    endDate?: string;
  }) {
    const momentStartDate = moment(startDate);
    const momentEndDate = moment(endDate);

    momentStartDate.set('hour', 0);
    momentStartDate.set('minute', 0);
    momentStartDate.set('second', 0);
    momentStartDate.set('millisecond', 0);

    momentEndDate.set('hour', 0);
    momentEndDate.set('minute', 0);
    momentEndDate.set('second', 0);
    momentEndDate.set('millisecond', 0);

    momentEndDate.set('day', momentEndDate.date() + 1);

    const beamIns = await this.beamInRepository.findAll({
      include: [BeamSize],
      attributes: {
        exclude: ['workshopId', 'beamSizeId'],
      },
      where: {
        workshopId,
        ...(startDate && endDate
          ? {
              date: {
                [Op.and]: {
                  [Op.gte]: momentStartDate.toISOString(),
                  [Op.lt]: momentEndDate.toISOString(),
                },
              },
            }
          : {}),
      },
    });

    return beamIns;
  }

  async deleteBeamInFromWorkshop(beamInId: number) {
    const beamIn = await this.beamInRepository.findByPk(beamInId);

    if (!beamIn) {
      throw new HttpException(
        'Выбранный вход леса не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    await beamIn.destroy();
  }
}
