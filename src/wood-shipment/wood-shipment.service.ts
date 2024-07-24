import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment-timezone';
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
import { BuyerService } from 'src/buyer/buyer.service';
import { PersonInChargeService } from 'src/person-in-charge/person-in-charge.service';
import { Buyer } from 'src/buyer/buyer.model';
import { PersonInCharge } from 'src/person-in-charge/person-in-charge.model';
import { WoodWarehouseErrorsType } from 'src/types';

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
    private buyerService: BuyerService,
    private personInChargeService: PersonInChargeService,
  ) {}

  private async updateWarehouseRecord({
    amount,
    woodCondition,
    woodClass,
    woodType,
    dimension,
    action = 'add',
    errorMessages,
  }: {
    amount: number;
    woodClass: WoodClass;
    woodType: WoodType;
    dimension: Dimension;
    woodCondition: WoodCondition;
    action?: 'add' | 'subtract';
    errorMessages: WoodWarehouseErrorsType;
  }) {
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: woodCondition.id,
        woodClassId: woodClass.id,
        woodTypeId: woodType.id,
        dimensionId: dimension.id,
      });

    if (!existentWarehouseRecord) {
      return errorMessages?.noSuchRecord({
        woodClass: woodClass.name.toLowerCase(),
        woodType: woodType.name.toLowerCase(),
        woodCondition: woodCondition.name.toLowerCase(),
        dimension: `${dimension.width}x${dimension.thickness}x${dimension.length}`,
      });
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

  async createWoodShipment({
    woodShipmentDto,
    woodCondition,
    buyer,
    personInCharge,
  }: {
    woodShipmentDto: CreateWoodShipmentDto;
    woodCondition: WoodCondition;
    buyer?: Buyer;
    personInCharge?: PersonInCharge;
  }) {
    const {
      date,
      amount,
      woodClassId,
      woodTypeId,
      woodConditionId,
      dimensionId,
      dimensionForSaleId,
      buyerId,
      personInChargeId,
      car,
    } = woodShipmentDto;

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      return 'Выбранное сечение не найдено. Запись об отгрузке не была создана';
    }

    const dimensionForSale = dimensionForSaleId
      ? await this.dimensionService.findDimensionById(dimensionForSaleId)
      : null;

    if (dimensionForSaleId && !dimensionForSale) {
      return 'Выбранное сечение для продажи не найдено. Запись об отгрузке не была создана';
    }

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      return 'Выбранный сорт не найден. Запись об отгрузке не была создана';
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      return 'Выбранная порода не найдена. Запись об отгрузке не была создана';
    }

    // Убрать доску со склада
    const warehouseError = await this.updateWarehouseRecord({
      amount,
      woodClass,
      woodType,
      woodCondition,
      dimension,
      action: 'subtract',
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись об отгрузке не была создана`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Создать запись об отгрузке на ${newRecordAmount} шт невозможно.`,
      },
    });

    if (warehouseError) {
      return warehouseError;
    }

    const woodShipment = await this.woodShipmentRepository.create({
      amount,
      car: car ? car : null,
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

    if (dimensionForSale) {
      await woodShipment.$set('dimensionForSale', dimensionForSaleId);
      woodShipment.dimensionForSale = dimensionForSale;
    }

    if (buyer) {
      await woodShipment.$set('buyer', buyerId);
      woodShipment.buyer = buyer;
    }

    if (personInCharge) {
      await woodShipment.$set('personInCharge', personInChargeId);
      woodShipment.personInCharge = personInCharge;
    }
  }

  async createWoodShipments(woodShipmentDtos: CreateWoodShipmentDto[]) {
    if (woodShipmentDtos.length === 0) {
      return [];
    }

    const { woodConditionId, buyerId, personInChargeId } = woodShipmentDtos[0];

    const woodCondition =
      await this.woodConditionService.findWoodConditionById(woodConditionId);

    if (!woodCondition) {
      throw new HttpException(
        'Выбранное состояние доски не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const buyer = buyerId
      ? await this.buyerService.findBuyerById(buyerId)
      : null;

    if (buyerId && !buyer) {
      throw new HttpException(
        'Выбранный покупатель не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const personInCharge = personInChargeId
      ? await this.personInChargeService.findPersonInChargeById(
          personInChargeId,
        )
      : null;

    if (personInChargeId && !personInCharge) {
      throw new HttpException(
        'Выбранный ответственный не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const errors = (
      await Promise.all(
        woodShipmentDtos.map(async (woodShipmentDto) => {
          return await this.createWoodShipment({
            woodShipmentDto,
            buyer,
            personInCharge,
            woodCondition,
          });
        }),
      )
    ).filter((error) => error !== undefined && error !== null);

    if (errors.length !== 0) {
      return errors;
    }

    return [];
  }

  async editWoodShipment(
    woodShipmentId: number,
    woodShipmentDto: UpdateWoodShipmentDto,
  ) {
    const { amount, woodClassId, dimensionId } = woodShipmentDto;

    const woodShipment = await this.woodShipmentRepository.findByPk(
      woodShipmentId,
      {
        include: [
          WoodClass,
          WoodType,
          {
            model: Dimension,
            as: 'dimension',
          },
          {
            model: Dimension,
            as: 'dimensionForSale',
          },
          WoodCondition,
        ],
      },
    );

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

    // Изменить запись на складе
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

    const warehouseError = await this.updateWarehouseRecord({
      amount: newAmount,
      woodCondition: woodShipment.woodCondition,
      woodClass: woodShipment.woodClass,
      woodType: woodShipment.woodType,
      dimension: woodShipment.dimension,
      action: action,
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись об отгрузке не была изменена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Изменить запись об отгрузке на ${newRecordAmount} шт невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

    if (dimension.id !== woodShipment.dimensionId) {
      await woodShipment.$set('dimension', dimensionId);
      woodShipment.dimension = dimension;
    }

    if (woodClass.id !== woodShipment.woodClassId) {
      await woodShipment.$set('woodClass', woodClassId);
      woodShipment.woodClass = woodClass;
    }

    await woodShipment.save();

    return woodShipment;
  }

  async getAllWoodShipmentsByWoodCondition({
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

    const woodShipments = await this.woodShipmentRepository.findAll({
      include: [
        WoodClass,
        WoodType,
        WoodCondition,
        {
          model: Dimension,
          as: 'dimension',
        },
        {
          model: Dimension,
          as: 'dimensionForSale',
        },
        Buyer,
        PersonInCharge,
      ],
      attributes: {
        exclude: [
          'woodConditionId',
          'woodClassId',
          'woodTypeId',
          'dimensionId',
          'dimension_id',
          'dimensionForSaleId',
          'dimension_for_sale_id',
          'buyerId',
          'personInChargeId',
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

    woodShipments.forEach((woodShipment) => {
      totalVolume += woodShipment.dimension.volume * woodShipment.amount;
    });

    return {
      data: woodShipments,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async deleteWoodShipment(woodShipmentId: number) {
    const woodShipment = await this.woodShipmentRepository.findByPk(
      woodShipmentId,
      {
        include: [
          WoodClass,
          WoodType,
          {
            model: Dimension,
            as: 'dimension',
          },
          {
            model: Dimension,
            as: 'dimensionForSale',
          },
          WoodCondition,
        ],
      },
    );

    if (!woodShipment) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись на складе (сырая доска)
    const warehouseError = await this.updateWarehouseRecord({
      amount: woodShipment.amount,
      woodCondition: woodShipment.woodCondition,
      woodClass: woodShipment.woodClass,
      woodType: woodShipment.woodType,
      dimension: woodShipment.dimension,
      action: 'add',
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись об отгрузке не была удалена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Удалить запись об отгрузке на ${newRecordAmount} шт невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

    await woodShipment.destroy();
  }

  async findWoodShipmentRecordByWoodParams({
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

    return existentWoodShipment;
  }

  async getWoodShipmentStatsByWoodConditionForDay({
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

    const { data: woodShipments } =
      await this.getAllWoodShipmentsByWoodCondition({
        woodConditionId,
        startDate: date,
        endDate: date,
      });

    const tableData = []; // dimension, woodClass, amount, id (woodShipmentId)
    let totalVolume = 0;

    if (!woodShipments || !woodShipments.length) {
      return {
        tableData: [],
        totalVolume: 0,
      };
    }

    woodShipments.forEach((woodShipment) => {
      const dimensionString = `${woodShipment.dimension.width}x${woodShipment.dimension.thickness}x${woodShipment.dimension.length}`;
      const dimensionForSaleString = woodShipment.dimensionForSale
        ? `${woodShipment.dimensionForSale.width}x${woodShipment.dimensionForSale.thickness}x${woodShipment.dimensionForSale.length}`
        : null;
      const woodClassName = woodShipment.woodClass.name;

      const tableRow = {
        id: woodShipment.id,
        dimension: dimensionString,
        dimensionForSale: dimensionForSaleString,
        woodClass: woodClassName,
        amount: woodShipment.amount,
        car: woodShipment.car,
        buyer: woodShipment.buyer ? woodShipment.buyer.name : null,
        personInCharge: woodShipment.personInCharge
          ? `${woodShipment.personInCharge.initials} ${woodShipment.personInCharge.secondName}`
          : null,
        volume: Number(
          (woodShipment.dimension.volume * woodShipment.amount).toFixed(2),
        ),
      };

      tableData.push(tableRow);

      totalVolume += woodShipment.dimension.volume * woodShipment.amount;
    });

    return {
      tableData,
      totalVolume: Number(totalVolume.toFixed(4)),
    };
  }

  async deleteAllWoodShipment() {
    await this.woodShipmentRepository.truncate();
  }
}
