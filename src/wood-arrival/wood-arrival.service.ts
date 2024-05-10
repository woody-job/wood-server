import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DimensionService } from 'src/dimension/dimension.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { WoodArrival } from './wood-arrival.model';
import { CreateWoodArrivalDto } from './dtos/create-wood-arrival.dto';
import { UpdateWoodArrivalDto } from './dtos/update-wood-arrival.dto';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';

@Injectable()
export class WoodArrivalService {
  constructor(
    @InjectModel(WoodArrival)
    private woodArrivalRepository: typeof WoodArrival,
    private woodClassService: WoodClassService,
    private woodTypeService: WoodTypeService,
    private dimensionService: DimensionService,
    private woodConditionService: WoodConditionService,
  ) {}

  async createWoodArrival(woodArrivalDto: CreateWoodArrivalDto) {
    const {
      date,
      amount,
      woodClassId,
      woodTypeId,
      woodConditionId,
      dimensionId,
    } = woodArrivalDto;

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      throw new HttpException(
        'Выбранное сечение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      throw new HttpException('Выбранный сорт не найден', HttpStatus.NOT_FOUND);
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранная порода не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodCondition =
      await this.woodConditionService.findWoodConditionById(woodConditionId);

    if (!woodCondition) {
      throw new HttpException(
        'Выбранное состояние доски не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const existentWoodArrival = await this.findWoodArrivalByWoodParams({
      date,
      woodConditionId,
      woodClassId,
      woodTypeId,
      dimensionId,
    });

    // Если поступление в выбранный день с выбранными параметрами доски уже существует,
    // новая запись не создается. Просто меняется ее количество.
    if (existentWoodArrival) {
      existentWoodArrival.amount = existentWoodArrival.amount + amount;

      await existentWoodArrival.save();

      return existentWoodArrival;
    }

    const woodArrival = await this.woodArrivalRepository.create({
      amount,
      date,
    });

    await woodArrival.$set('woodClass', woodClassId);
    woodArrival.woodClass = woodClass;

    await woodArrival.$set('woodType', woodTypeId);
    woodArrival.woodType = woodType;

    await woodArrival.$set('woodCondition', woodConditionId);
    woodArrival.woodCondition = woodCondition;

    await woodArrival.$set('dimension', dimensionId);
    woodArrival.dimension = dimension;

    return woodArrival;
  }

  async editWoodArrival(
    woodArrivalId: number,
    woodArrivalDto: UpdateWoodArrivalDto,
  ) {
    const { amount, woodClassId, dimensionId } = woodArrivalDto;

    const woodArrival =
      await this.woodArrivalRepository.findByPk(woodArrivalId);

    if (!woodArrival) {
      throw new HttpException(
        'Выбранное поступление не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      throw new HttpException(
        'Выбранное сечение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      throw new HttpException('Выбранный сорт не найден', HttpStatus.NOT_FOUND);
    }

    woodArrival.amount = amount;

    if (dimension.id !== woodArrival.dimensionId) {
      await woodArrival.$set('dimension', dimensionId);
      woodArrival.dimension = dimension;
    }

    if (woodClass.id !== woodArrival.woodClassId) {
      await woodArrival.$set('woodClass', woodClassId);
      woodArrival.woodClass = woodClass;
    }

    await woodArrival.save();

    return woodArrival;
  }

  async getAllWoodArrivalsByWoodCondition({
    woodConditionId,
    startDate,
    endDate,
  }: {
    woodConditionId: number;
    startDate?: string;
    endDate?: string;
  }) {
    const momentStartDate = moment(startDate);
    const momentEndDate = moment(endDate);

    const startYear = momentStartDate.year();
    const startMonth = momentStartDate.month() + 1;
    const startDay = momentStartDate.date();

    const endYear = momentEndDate.year();
    const endMonth = momentEndDate.month() + 1;
    const endDay = momentEndDate.date();

    const workshopOuts = await this.woodArrivalRepository.findAll({
      include: [WoodClass, WoodType, WoodCondition, Dimension],
      attributes: {
        exclude: [
          'woodConditionId',
          'woodClassId',
          'woodTypeId',
          'dimensionId',
        ],
      },
      where: {
        woodConditionId,
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
      order: [['date', 'DESC']],
    });

    return workshopOuts;
  }

  async deleteWoodArrival(woodArrivalId: number) {
    const woodArrival =
      await this.woodArrivalRepository.findByPk(woodArrivalId);

    if (!woodArrival) {
      throw new HttpException(
        'Выбранное поступление не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    await woodArrival.destroy();
  }

  async findWoodArrivalByWoodParams({
    date,
    woodConditionId,
    woodClassId,
    woodTypeId,
    dimensionId,
  }: {
    date: string;
    woodConditionId: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
  }) {
    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    const woodArrival = await this.woodArrivalRepository.findOne({
      where: {
        [Op.and]: Sequelize.where(
          Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
          Op.eq,
          `${year}-${month}-${day}`,
        ),
        woodConditionId,
        woodClassId,
        woodTypeId,
        dimensionId,
      },
    });

    return woodArrival;
  }
}
