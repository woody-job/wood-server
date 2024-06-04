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

@Injectable()
export class BeamInService {
  constructor(
    @InjectModel(BeamIn)
    private beamInRepository: typeof BeamIn,
    private workshopService: WorkshopService,
    private beamSizeService: BeamSizeService,
    @Inject(forwardRef(() => WorkshopOutService))
    private workshopOutService: WorkshopOutService,
  ) {}

  async addBeamToWorkshop(beamInDto: AddBeamInDto) {
    const { beamSizeId, date, amount, workshopId } = beamInDto;

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

  async editBeamGoneToWorkshop(beamInId: number, beamInDto: UpdateBeamInDto) {
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
      include: [BeamSize],
      attributes: {
        exclude: ['workshopId', 'beamSizeId'],
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

  async getWorkshopsStatsByTimespan({
    workshopId,
    startDate,
    endDate,
  }: {
    workshopId: number;
    startDate: string;
    endDate: string;
  }) {
    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
    }

    // TODO: Для всех query параметров с датой нужна валидация
    if (!startDate || !endDate) {
      throw new HttpException(
        'Необходимо указать query параметры startDate & endDate',
        HttpStatus.BAD_REQUEST,
      );
    }

    const momentStartDate = moment(startDate);
    const now = momentStartDate.clone();
    const days = [];

    while (now.isSameOrBefore(endDate)) {
      days.push(now.toISOString());
      now.add(1, 'days');
    }

    if (days.length > 31) {
      throw new HttpException(
        'Количество запрашиваемых дней ограничено до 31',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { data: beamIns } = await this.getAllBeamInForWorkshop({
      workshopId,
      startDate,
      endDate,
      sortDirection: 'ASC',
    });

    const output = [];

    beamIns.forEach((beamIn) => {
      const volume = Number(
        (beamIn.beamSize.volume * beamIn.amount).toFixed(2),
      );

      const beamInDate = moment(beamIn.date);
      const beamInYear = beamInDate.year();
      const beamInMonth = beamInDate.month() + 1;
      const beamInDay = beamInDate.date();

      const outputWithSameDate = output.find((outputItem) => {
        const outputItemDate = moment(outputItem.x);
        const outputItemYear = outputItemDate.year();
        const outputItemMonth = outputItemDate.month() + 1;
        const outputItemDay = outputItemDate.date();

        return (
          beamInYear === outputItemYear &&
          beamInMonth === outputItemMonth &&
          beamInDay === outputItemDay
        );
      });

      if (outputWithSameDate) {
        outputWithSameDate.y += volume;

        return;
      }

      output.push({
        x: beamIn.date,
        y: volume,
      });
    });

    if (workshop.id === 2) {
      console.log(`\n THIS IS TRUE \n`);

      const { data: workshopOuts } =
        await this.workshopOutService.getAllWoodOutForWorkshopForMultipleDays({
          workshopId,
          startDate,
          endDate,
        });

      console.log(`\n THIS IS TRUE TOO ${workshopOuts} \n`);

      workshopOuts.forEach((workshopOut) => {
        const volume = Number(
          (workshopOut.dimension.volume * 2 * workshopOut.amount).toFixed(2), // Все условие со вторым цехов нужно для этого момента. Объем входа для второго цеха = выход * 2
        );

        const beamInDate = moment(workshopOut.date);
        const beamInYear = beamInDate.year();
        const beamInMonth = beamInDate.month() + 1;
        const beamInDay = beamInDate.date();

        const outputWithSameDate = output.find((outputItem) => {
          const outputItemDate = moment(outputItem.x);
          const outputItemYear = outputItemDate.year();
          const outputItemMonth = outputItemDate.month() + 1;
          const outputItemDay = outputItemDate.date();

          return (
            beamInYear === outputItemYear &&
            beamInMonth === outputItemMonth &&
            beamInDay === outputItemDay
          );
        });

        if (outputWithSameDate) {
          outputWithSameDate.y += volume;

          return;
        }

        output.push({
          x: workshopOut.date,
          y: volume,
        });
      });
    }

    return output;
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

  async deleteAllBeamIn() {
    await this.beamInRepository.truncate();
  }
}
