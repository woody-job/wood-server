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
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { SupplierService } from 'src/supplier/supplier.service';
import { Supplier } from 'src/supplier/supplier.model';

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
    woodClassId,
    woodTypeId,
    dimensionId,
    woodConditionId,
    action = 'add',
    isCreate = false,
  }: {
    amount: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
    woodConditionId: number;
    action?: 'add' | 'subtract';
    isCreate?: boolean;
  }) {
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: woodConditionId,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    if (!existentWarehouseRecord) {
      await this.warehouseService.createWarehouseRecord({
        amount: amount,
        woodConditionId: woodConditionId,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });
    } else {
      let newAmount = existentWarehouseRecord.amount;

      if (isCreate) {
        newAmount = existentWarehouseRecord.amount + amount;
      } else {
        if (action === 'add') {
          newAmount = existentWarehouseRecord.amount + amount;
        }

        if (action === 'subtract') {
          newAmount = existentWarehouseRecord.amount - amount;
        }
      }

      await this.warehouseService.updateWarehouseRecord({
        amount: newAmount,
        woodConditionId: woodConditionId,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });
    }
  }

  async createWoodArrival(
    woodArrivalDto: CreateWoodArrivalDto,
    params?: { avoidDirectWarehouseChange: boolean },
  ) {
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

    const { avoidDirectWarehouseChange = false } = params ?? {};

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

    const supplier = supplierId
      ? await this.supplierService.findSupplierById(supplierId)
      : null;

    if (supplierId && !supplier) {
      throw new HttpException(
        'Выбранный покупатель не найден',
        HttpStatus.NOT_FOUND,
      );
    }

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

    // Внести доски на склад
    if (!avoidDirectWarehouseChange) {
      await this.updateWarehouseRecord({
        amount: woodArrival.amount,
        woodClassId: woodArrival.woodClassId,
        woodTypeId: woodArrival.woodTypeId,
        dimensionId: woodArrival.dimensionId,
        woodConditionId: woodArrival.woodConditionId,
        isCreate: true,
      });
    }

    return woodArrival;
  }

  async editWoodArrival(
    woodArrivalId: number,
    woodArrivalDto: UpdateWoodArrivalDto,
    params?: { avoidDirectWarehouseChange: boolean },
  ) {
    const { amount, woodClassId, dimensionId } = woodArrivalDto;
    const { avoidDirectWarehouseChange = false } = params ?? {};

    const woodArrival =
      await this.woodArrivalRepository.findByPk(woodArrivalId);

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

    if (dimension.id !== woodArrival.dimensionId) {
      await woodArrival.$set('dimension', dimensionId);
      woodArrival.dimension = dimension;
    }

    if (woodClass.id !== woodArrival.woodClassId) {
      await woodArrival.$set('woodClass', woodClassId);
      woodArrival.woodClass = woodClass;
    }

    await woodArrival.save();

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

    // Изменить запись на складе
    if (!avoidDirectWarehouseChange) {
      await this.updateWarehouseRecord({
        amount: newAmount,
        woodConditionId: woodArrival.woodConditionId,
        woodClassId: woodArrival.woodClassId,
        woodTypeId: woodArrival.woodTypeId,
        dimensionId: woodArrival.dimensionId,
        action: action,
      });
    }

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
      order: [['id', 'DESC']],
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
    const woodArrival =
      await this.woodArrivalRepository.findByPk(woodArrivalId);

    if (!woodArrival) {
      throw new HttpException(
        'Выбранное поступление не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    await woodArrival.destroy();

    // Изменить запись на складе
    await this.updateWarehouseRecord({
      amount: woodArrival.amount,
      woodClassId: woodArrival.woodClassId,
      woodTypeId: woodArrival.woodTypeId,
      dimensionId: woodArrival.dimensionId,
      woodConditionId: woodArrival.woodConditionId,
      action: 'subtract',
    });
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
