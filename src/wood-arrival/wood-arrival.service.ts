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
import * as moment from 'moment-timezone';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { SupplierService } from 'src/supplier/supplier.service';
import { Supplier } from 'src/supplier/supplier.model';
import { WoodWarehouseErrorsType } from 'src/types';

@Injectable()
export class WoodArrivalService {
  constructor(
    @InjectModel(WoodArrival)
    private woodArrivalRepository: typeof WoodArrival,
    private woodClassService: WoodClassService,
    private woodTypeService: WoodTypeService,
    private dimensionService: DimensionService,
    private woodConditionService: WoodConditionService,
    private warehouseService: WarehouseService,
    private supplierService: SupplierService,
  ) {}

  private async updateWarehouseRecord({
    amount,
    woodClass,
    woodType,
    dimension,
    woodCondition,
    action = 'add',
    errorMessages,
  }: {
    amount: number;
    woodClass: WoodClass;
    woodType: WoodType;
    dimension: Dimension;
    woodCondition: WoodCondition;
    action?: 'add' | 'subtract';
    errorMessages?: WoodWarehouseErrorsType | undefined;
  }) {
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: woodCondition.id,
        woodClassId: woodClass.id,
        woodTypeId: woodType.id,
        dimensionId: dimension.id,
      });

    if (!existentWarehouseRecord) {
      await this.warehouseService.createWarehouseRecord({
        amount: amount,
        woodConditionId: woodCondition.id,
        woodClassId: woodClass.id,
        woodTypeId: woodType.id,
        dimensionId: dimension.id,
      });

      return;
    }

    let newAmount = existentWarehouseRecord.amount;

    if (action === 'add') {
      newAmount = existentWarehouseRecord.amount + amount;
    }

    if (action === 'subtract') {
      newAmount = existentWarehouseRecord.amount - amount;

      if (newAmount < 0) {
        return errorMessages?.notEnoughAmount({
          warehouseAmount: existentWarehouseRecord.amount,
          newRecordAmount: amount,
          woodClass: woodClass.name.toLowerCase(),
          woodType: woodType.name.toLowerCase(),
          woodCondition: woodCondition.name.toLowerCase(),
          dimension: `${dimension.width}x${dimension.thickness}x${dimension.length}`,
        });
      }
    }

    await this.warehouseService.updateWarehouseRecord({
      amount: newAmount,
      woodConditionId: woodCondition.id,
      woodClassId: woodClass.id,
      woodTypeId: woodType.id,
      dimensionId: dimension.id,
    });
  }

  async createWoodArrival({
    woodArrivalDto,
    woodCondition,
    supplier,
  }: {
    woodArrivalDto: CreateWoodArrivalDto;
    woodCondition: WoodCondition;
    supplier?: Supplier;
  }) {
    const {
      date,
      amount,
      woodClassId,
      woodTypeId,
      woodConditionId,
      dimensionId,
      supplierId,
      car,
    } = woodArrivalDto;

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      return 'Выбранное сечение не найдено. Запись о поступлении не была создана';
    }

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      return 'Выбранный сорт не найден. Запись о поступлении не была создана';
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      return 'Выбранная порода не найдена. Запись о поступлении не была создана';
    }

    // Внести доски на склад
    await this.updateWarehouseRecord({
      amount,
      woodClass,
      woodType,
      dimension,
      woodCondition,
    });

    const woodArrival = await this.woodArrivalRepository.create({
      amount,
      car: car ? car : null,
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

    if (supplier) {
      await woodArrival.$set('supplier', supplierId);
      woodArrival.supplier = supplier;
    }
  }

  async createWoodArrivals(woodArrivalDtos: CreateWoodArrivalDto[]) {
    if (woodArrivalDtos.length === 0) {
      return [];
    }

    const { woodConditionId, supplierId } = woodArrivalDtos[0];

    const woodCondition =
      await this.woodConditionService.findWoodConditionById(woodConditionId);

    if (!woodCondition) {
      throw new HttpException(
        'Выбранное состояние доски не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const supplier = supplierId
      ? await this.supplierService.findSupplierById(supplierId)
      : null;

    if (supplierId && !supplier) {
      throw new HttpException(
        'Выбранный поставщик не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const errors = [];

    for (const woodArrivalDto of woodArrivalDtos) {
      const error = await this.createWoodArrival({
        woodArrivalDto,
        supplier,
        woodCondition,
      });

      if (error) {
        errors.push(error);
      }
    }

    if (errors.length !== 0) {
      return errors;
    }

    return [];
  }

  async editWoodArrival(
    woodArrivalId: number,
    woodArrivalDto: UpdateWoodArrivalDto,
  ) {
    const { amount, woodClassId, dimensionId } = woodArrivalDto;

    const woodArrival = await this.woodArrivalRepository.findByPk(
      woodArrivalId,
      { include: [WoodClass, WoodType, Dimension, WoodCondition] },
    );

    if (!woodArrival) {
      throw new HttpException(
        'Выбранное поступление не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const oldWoodArrivalAmount = woodArrival.amount;

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

    // Изменить запись на складе
    let newAmount = oldWoodArrivalAmount;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldWoodArrivalAmount > woodArrival.amount) {
      newAmount = oldWoodArrivalAmount - woodArrival.amount;
      action = 'subtract';
    }

    if (oldWoodArrivalAmount < woodArrival.amount) {
      newAmount = woodArrival.amount - oldWoodArrivalAmount;
      action = 'add';
    }

    const warehouseError = await this.updateWarehouseRecord({
      amount: newAmount,
      woodCondition: woodArrival.woodCondition,
      woodClass: woodArrival.woodClass,
      woodType: woodArrival.woodType,
      dimension: woodArrival.dimension,
      action: action,
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись о поступлении не была изменена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Изменить запись о поступлении на ${newRecordAmount} шт невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

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
    woodConditionId?: number;
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

    const woodArrivals = await this.woodArrivalRepository.findAll({
      include: [WoodClass, WoodType, WoodCondition, Dimension, Supplier],
      attributes: {
        exclude: [
          'woodConditionId',
          'woodClassId',
          'woodTypeId',
          'dimensionId',
          'supplierId',
        ],
      },
      where: {
        ...(woodConditionId ? { woodConditionId } : {}),
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

    let totalVolume = 0;

    woodArrivals.forEach((woodArrival) => {
      totalVolume += woodArrival.dimension.volume * woodArrival.amount;
    });

    return {
      data: woodArrivals,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async deleteWoodArrival(woodArrivalId: number) {
    const woodArrival = await this.woodArrivalRepository.findByPk(
      woodArrivalId,
      { include: [WoodClass, WoodType, Dimension, WoodCondition] },
    );

    if (!woodArrival) {
      throw new HttpException(
        'Выбранное поступление не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись на складе
    const warehouseError = await this.updateWarehouseRecord({
      amount: woodArrival.amount,
      woodClass: woodArrival.woodClass,
      woodType: woodArrival.woodType,
      dimension: woodArrival.dimension,
      woodCondition: woodArrival.woodCondition,
      action: 'subtract',
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись о поступлении не была удалена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Удалить запись о поступлении на ${newRecordAmount} шт невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

    await woodArrival.destroy();
  }

  async findWoodArrivalByWoodParams({
    date,
    woodConditionId,
    woodClassId,
    woodTypeId,
    dimensionId,
    supplierId,
    car,
  }: {
    date: string;
    woodConditionId: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
    supplierId?: number;
    car?: string;
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
        ...(supplierId ? { supplierId } : {}),
        ...(car ? { car } : {}),
      },
    });

    return woodArrival;
  }

  async getWoodArrivalStatsByWoodConditionForDay({
    woodConditionId,
    date,
  }: {
    woodConditionId: number;
    date: string;
  }) {
    if (!date) {
      throw new HttpException(
        'Query параметр date обязателен для запроса',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { data: woodArrivals } = await this.getAllWoodArrivalsByWoodCondition(
      {
        woodConditionId,
        startDate: date,
        endDate: date,
      },
    );

    const tableData = []; // dimension, woodClass, amount, id (woodArrivalId)
    let totalVolume = 0;

    if (!woodArrivals || !woodArrivals.length) {
      return {
        tableData: [],
        totalVolume: 0,
      };
    }

    woodArrivals.forEach((woodArrival) => {
      const dimensionString = `${woodArrival.dimension.width}x${woodArrival.dimension.thickness}x${woodArrival.dimension.length}`;
      const woodClassName = woodArrival.woodClass.name;

      const tableRow = {
        id: woodArrival.id,
        dimension: dimensionString,
        woodClass: woodClassName,
        amount: woodArrival.amount,
        car: woodArrival.car,
        supplier: woodArrival.supplier ? woodArrival.supplier.name : null,
        volume: Number(
          (woodArrival.dimension.volume * woodArrival.amount).toFixed(2),
        ),
      };

      tableData.push(tableRow);

      totalVolume += woodArrival.dimension.volume * woodArrival.amount;
    });

    return {
      tableData,
      totalVolume: Number(totalVolume.toFixed(4)),
    };
  }

  async deleteAllWoodArrival() {
    await this.woodArrivalRepository.truncate();
  }
}
