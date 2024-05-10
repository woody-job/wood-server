import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/sequelize';
import { Dimension } from 'src/dimension/dimension.model';
import { DimensionService } from 'src/dimension/dimension.service';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { CreateWoodShipmentDto } from './dtos/create-wood-shipment.dto';
import { UpdateWoodShipmentDto } from './dtos/update-wood-shipment.dto';
import { WoodShipment } from './wood-shipment.model';
import { WarehouseService } from 'src/warehouse/warehouse.service';

@Injectable()
export class WoodShipmentService {
  constructor(
    @InjectModel(WoodShipment)
    private woodShipmentRepository: typeof WoodShipment,
    private woodClassService: WoodClassService,
    private woodTypeService: WoodTypeService,
    private dimensionService: DimensionService,
    private woodConditionService: WoodConditionService,
    private warehouseService: WarehouseService,
  ) {}

  private async updateWarehouseRecord({
    amount,
    woodConditionId,
    woodClassId,
    woodTypeId,
    dimensionId,
    action = 'add',
  }: {
    amount: number;
    woodConditionId: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
    action?: 'add' | 'subtract';
  }) {
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: woodConditionId,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    // Такого кейса быть не должно, просто return на всякий случай
    if (!existentWarehouseRecord) {
      return;
    }

    let newAmount = existentWarehouseRecord.amount;

    if (action === 'add') {
      newAmount = existentWarehouseRecord.amount + amount;
    }

    if (action === 'subtract') {
      newAmount = existentWarehouseRecord.amount - amount;
    }

    await this.warehouseService.updateWarehouseRecord({
      amount: newAmount,
      woodConditionId: woodConditionId,
      woodClassId: woodClassId,
      woodTypeId: woodTypeId,
      dimensionId: dimensionId,
    });
  }

  async createWoodShipment(woodShipmentDto: CreateWoodShipmentDto) {
    const {
      date,
      amount,
      woodClassId,
      woodTypeId,
      woodConditionId,
      dimensionId,
    } = woodShipmentDto;

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

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    const existentWoodShipment = await this.woodShipmentRepository.findOne({
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

    // Если отгрузка в выбранный день с выбранными параметрами доски уже существует,
    // новая запись не создается. Просто меняется ее количество.
    if (existentWoodShipment) {
      existentWoodShipment.amount = existentWoodShipment.amount + amount;

      await existentWoodShipment.save();

      return existentWoodShipment;
    }

    const woodShipment = await this.woodShipmentRepository.create({
      amount,
      date,
    });

    await woodShipment.$set('woodClass', woodClassId);
    woodShipment.woodClass = woodClass;

    await woodShipment.$set('woodType', woodTypeId);
    woodShipment.woodType = woodType;

    await woodShipment.$set('woodCondition', woodConditionId);
    woodShipment.woodCondition = woodCondition;

    await woodShipment.$set('dimension', dimensionId);
    woodShipment.dimension = dimension;

    // Убрать доску со склада
    await this.updateWarehouseRecord({
      amount,
      woodClassId,
      woodTypeId,
      woodConditionId,
      dimensionId,
      action: 'subtract',
    });

    return woodShipment;
  }

  async editWoodShipment(
    woodShipmentId: number,
    woodShipmentDto: UpdateWoodShipmentDto,
  ) {
    const { amount, woodClassId, dimensionId } = woodShipmentDto;

    const woodShipment =
      await this.woodShipmentRepository.findByPk(woodShipmentId);

    if (!woodShipment) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const oldWoodShipmentAmount = woodShipment.amount;

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

    woodShipment.amount = amount;

    if (dimension.id !== woodShipment.dimensionId) {
      await woodShipment.$set('dimension', dimensionId);
      woodShipment.dimension = dimension;
    }

    if (woodClass.id !== woodShipment.woodClassId) {
      await woodShipment.$set('woodClass', woodClassId);
      woodShipment.woodClass = woodClass;
    }

    await woodShipment.save();

    let newAmount = oldWoodShipmentAmount;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldWoodShipmentAmount > woodShipment.amount) {
      newAmount = oldWoodShipmentAmount - woodShipment.amount;
      action = 'add';
    }

    if (oldWoodShipmentAmount < woodShipment.amount) {
      newAmount = woodShipment.amount - oldWoodShipmentAmount;
      action = 'subtract';
    }

    // Изменить запись на складе (сырая доска)
    await this.updateWarehouseRecord({
      amount: newAmount,
      woodConditionId: woodShipment.woodConditionId,
      woodClassId: woodShipment.woodClassId,
      woodTypeId: woodShipment.woodTypeId,
      dimensionId: woodShipment.dimensionId,
      action: action,
    });

    return woodShipment;
  }

  async getAllWoodShipmentsByWoodCondition({
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

    const workshopOuts = await this.woodShipmentRepository.findAll({
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

  async deleteWoodShipment(woodShipmentId: number) {
    const woodShipment =
      await this.woodShipmentRepository.findByPk(woodShipmentId);

    if (!woodShipment) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await woodShipment.destroy();

    // Изменить запись на складе (сырая доска)
    await this.updateWarehouseRecord({
      amount: woodShipment.amount,
      woodConditionId: woodShipment.woodConditionId,
      woodClassId: woodShipment.woodClassId,
      woodTypeId: woodShipment.woodTypeId,
      dimensionId: woodShipment.dimensionId,
      action: 'add',
    });
  }
}
