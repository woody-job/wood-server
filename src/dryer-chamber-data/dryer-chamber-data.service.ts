import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DryerChamberData } from './dryer-chamber-data.model';
import { DimensionService } from 'src/dimension/dimension.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { DryerChamberService } from 'src/dryer-chamber/dryer-chamber.service';
import { CreateDryerChamberDataDto } from './dtos/create-dryer-chamber-data.dto';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodArrivalService } from 'src/wood-arrival/wood-arrival.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { WoodShipmentService } from 'src/wood-shipment/wood-shipment.service';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment-timezone';
import { DryerChamber } from 'src/dryer-chamber/dryer-chamber.model';

@Injectable()
export class DryerChamberDataService {
  constructor(
    @InjectModel(DryerChamberData)
    private dryerChamberDataRepository: typeof DryerChamberData,
    private dimensionService: DimensionService,
    private woodClassService: WoodClassService,
    @Inject(forwardRef(() => DryerChamberService))
    private dryerChamberService: DryerChamberService,
    private woodTypeService: WoodTypeService,
    private woodArrivalService: WoodArrivalService,
    private woodConditionService: WoodConditionService,
    private warehouseService: WarehouseService,
    private woodShipmentService: WoodShipmentService,
  ) {}

  async getDryingWoodByDryerChamberId(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll({
      include: [Dimension, WoodClass, WoodType],
      attributes: {
        exclude: [
          'dryerChamberId',
          'isDrying',
          'isTakenOut',
          'dimensionId',
          'woodClassId',
          'woodTypeId',
        ],
      },
      where: {
        dryerChamberId,
        isDrying: true,
      },
    });

    let totalVolume = 0;

    dryerChamberDatas.forEach((dryerChamberData) => {
      totalVolume +=
        dryerChamberData.dimension.volume * dryerChamberData.amount;
    });

    return {
      data: dryerChamberDatas,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async getAllDryingWood() {
    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll({
      include: [Dimension, WoodClass, WoodType],
      attributes: {
        exclude: [
          'dryerChamberId',
          'isDrying',
          'isTakenOut',
          'dimensionId',
          'woodClassId',
          'woodTypeId',
        ],
      },
      where: { isDrying: true },
    });

    let totalVolume = 0;
    let outputData = [];

    dryerChamberDatas.forEach((dryerChamberData) => {
      const chamberDataDimension = dryerChamberData.dimension;
      const chamberDataWoodType = dryerChamberData.woodType;

      const existentOutputData = outputData.find(
        (output) =>
          output.dimension.width === chamberDataDimension.width &&
          output.dimension.thickness === chamberDataDimension.thickness &&
          output.dimension.length === chamberDataDimension.length &&
          output.woodType.id === chamberDataWoodType.id,
      );

      const outputItem = existentOutputData
        ? existentOutputData
        : {
            id: 0,
            dimension: chamberDataDimension,
            woodType: chamberDataWoodType,
            amount: 0,
            firstClassVolume: 0,
            secondClassVolume: 0,
            marketClassVolume: 0,
            brownClassVolume: 0,
            totalVolume: 0,
          };

      let woodClassKey = '';

      switch (dryerChamberData.woodClass.name) {
        case 'Первый':
          woodClassKey = 'firstClass';
          break;
        case 'Второй':
          woodClassKey = 'secondClass';
          break;
        case 'Рыночный':
          woodClassKey = 'marketClass';
          break;
        case 'Браун':
          woodClassKey = 'brownClass';
          break;
        default:
          break;
      }

      outputItem[`${woodClassKey}Volume`] = Number(
        (
          outputItem[`${woodClassKey}Volume`] +
          dryerChamberData.dimension.volume * dryerChamberData.amount
        ).toFixed(4),
      );
      outputItem.amount += dryerChamberData.amount;

      outputItem.totalVolume = Number(
        (
          outputItem.firstClassVolume +
          outputItem.secondClassVolume +
          outputItem.marketClassVolume +
          outputItem.brownClassVolume
        ).toFixed(2),
      );

      outputItem.id = Number(
        `${outputItem.dimension.id}${outputItem.woodType.id}`,
      );

      if (!existentOutputData) {
        outputData.push(outputItem);
      }
    });

    totalVolume = outputData.reduce((total, current) => {
      return total + current.totalVolume;
    }, 0);

    return {
      totalVolume: Number(totalVolume.toFixed(2)),
      data: outputData,
    };
  }

  async getAllRecords({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) {
    if (!startDate || !endDate) {
      throw new HttpException(
        'Query параметры startDate & endDate обязателен для запроса',
        HttpStatus.BAD_REQUEST,
      );
    }

    const momentStartDate = moment(startDate);
    const momentEndDate = moment(endDate);

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

    const startYear = momentStartDate.year();
    const startMonth = momentStartDate.month() + 1;
    const startDay = momentStartDate.date();

    const endYear = momentEndDate.year();
    const endMonth = momentEndDate.month() + 1;
    const endDay = momentEndDate.date();

    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll({
      include: [WoodClass, WoodType, Dimension, DryerChamber],
      attributes: {
        exclude: ['dryerChamberId', 'woodClassId', 'woodTypeId', 'dimensionId'],
      },
      where: {
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

    dryerChamberDatas.forEach((dryerChamberData) => {
      totalVolume +=
        dryerChamberData.dimension.volume * dryerChamberData.amount;
    });

    return {
      data: dryerChamberDatas,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async createDryerChamberDataRecord({
    dryerChamberId,
    dryerChamberDataDto,
    chamberIterationCountWhenBringingIn,
  }: {
    dryerChamberId: number;
    dryerChamberDataDto: CreateDryerChamberDataDto;
    chamberIterationCountWhenBringingIn: number;
  }) {
    const { dimensionId, woodClassId, woodTypeId, date, amount } =
      dryerChamberDataDto;

    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    // Убрать со склада сырую доску
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    await this.warehouseService.updateWarehouseRecord({
      amount: existentWarehouseRecord.amount - amount,
      woodConditionId: wetWoodCondition.id,
      woodClassId: woodClassId,
      woodTypeId: woodTypeId,
      dimensionId: dimensionId,
    });

    const dryerChamberData = await this.dryerChamberDataRepository.create({
      date,
      amount,
      isDrying: true,
      isTakenOut: false,
      chamberIterationCountWhenBringingIn,
    });

    await dryerChamberData.$set('woodClass', woodClassId);
    dryerChamberData.woodClass = woodClass;

    await dryerChamberData.$set('woodType', woodTypeId);
    dryerChamberData.woodType = woodType;

    await dryerChamberData.$set('dimension', dimensionId);
    dryerChamberData.dimension = dimension;

    await dryerChamberData.$set('dryerChamber', dryerChamberId);
    dryerChamberData.dryerChamber = dryerChamber;
  }

  async checkForErrorsBeforeCreate({
    dryerChamberId,
    dryerChamberDataDto,
  }: {
    dryerChamberId: number;
    dryerChamberDataDto: CreateDryerChamberDataDto;
  }) {
    const { dimensionId, woodClassId, woodTypeId, date, amount } =
      dryerChamberDataDto;

    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      return 'Выбранная сушильная камера не найдена';
    }

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      return 'Выбранное сечение не найдено';
    }

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      return 'Выбранный сорт не найден';
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      return 'Выбранная порода не найдена';
    }

    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      return "Состояния доски 'Сырая' нет в базе";
    }

    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    if (!existentWarehouseRecord) {
      return `На складе нет доски с параметрами "${wetWoodCondition.name.toLowerCase()}", "${woodType.name.toLowerCase()}", "сорт ${woodClass.name.toLowerCase()}", 
            "${dimension.width}x${dimension.thickness}x${dimension.length}". 
            Доска не была занесена в сушилку.`;
    }

    if (existentWarehouseRecord.amount < amount) {
      return `На складе есть только ${existentWarehouseRecord.amount} шт выбранной доски с параметрами 
          "${wetWoodCondition.name.toLowerCase()}", "${woodType.name.toLowerCase()}", "сорт ${woodClass.name.toLowerCase()}", 
          "${dimension.width}x${dimension.thickness}x${dimension.length}". 
          Невозможно внести ${amount} шт досок в сушилку.`;
    }

    return null;
  }

  async bringWoodInChamber(
    dryerChamberId: number,
    dryerChamberDataDtos: CreateDryerChamberDataDto[],
  ) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Если в выбранной сушильной камере уже сушится доска, то
    // система отказывает в создании новой записи данных о сушильной камере
    const existentDryerChamberData =
      await this.dryerChamberDataRepository.findOne({
        where: {
          dryerChamberId,
          isDrying: true,
        },
      });

    if (existentDryerChamberData) {
      throw new HttpException(
        'В сушильной камере уже есть доски.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newIterationCount = dryerChamber.chamberIterationCount + 1;

    const errorsCheck = (
      await Promise.all(
        dryerChamberDataDtos.map(async (dryerChamberDataDto) => {
          return await this.checkForErrorsBeforeCreate({
            dryerChamberId,
            dryerChamberDataDto,
          });
        }),
      )
    ).filter((error) => error !== undefined && error !== null);

    if (errorsCheck.length !== 0) {
      return errorsCheck;
    }

    await Promise.all(
      dryerChamberDataDtos.map(async (dryerChamberDataDto) => {
        return await this.createDryerChamberDataRecord({
          dryerChamberId,
          dryerChamberDataDto,
          chamberIterationCountWhenBringingIn: newIterationCount,
        });
      }),
    );

    // Цикл сушильной камеры обновляется при
    // занесении доски.
    dryerChamber.chamberIterationCount = newIterationCount;

    await dryerChamber.save();

    return [];
  }

  async removeSingleWoodPackFromChamber(dryerChamberData: DryerChamberData) {
    dryerChamberData.isDrying = false;
    dryerChamberData.isTakenOut = true;

    await dryerChamberData.save();

    // Внести на склад сухую доску
    const dryWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сухая');

    if (!dryWoodCondition) {
      return "Состояния доски 'Сухая' нет в базе";
    }

    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });

    if (!existentWarehouseRecord) {
      await this.warehouseService.createWarehouseRecord({
        amount: dryerChamberData.amount,
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });

      return;
    }

    await this.warehouseService.updateWarehouseRecord({
      amount: existentWarehouseRecord.amount + dryerChamberData.amount,
      woodConditionId: dryWoodCondition.id,
      woodClassId: dryerChamberData.woodClassId,
      woodTypeId: dryerChamberData.woodTypeId,
      dimensionId: dryerChamberData.dimensionId,
    });

    return dryerChamberData;
  }

  async removeWoodFromChamber(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll({
      where: {
        dryerChamberId,
        isDrying: true,
      },
    });

    if (!dryerChamberDatas) {
      throw new HttpException(
        'Для данной сушильной камеры нет записи о внесенной доске. Невозможно убрать.',
        HttpStatus.NOT_FOUND,
      );
    }

    const errors = (
      await Promise.all(
        dryerChamberDatas.map(async (dryerChamberData) => {
          return await this.removeSingleWoodPackFromChamber(dryerChamberData);
        }),
      )
    ).filter((error) => error !== undefined && error !== null);

    if (errors.length !== 0) {
      return errors;
    }

    return [];
  }

  async eraseRecord(dryerChamberDataId: number) {
    const dryerChamberData =
      await this.dryerChamberDataRepository.findByPk(dryerChamberDataId);

    if (!dryerChamberData) {
      throw new HttpException(
        'Запись сушильной камеры не найдена.',
        HttpStatus.NOT_FOUND,
      );
    }

    await dryerChamberData.destroy();
  }

  async getOverallDryersStats() {
    const dryers = await this.dryerChamberService.getAllDryerChambers();
    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let output = [];

    await Promise.all(
      dryers.map(async (dryerChamber) => {
        let resultDryerVolume = 0;

        const woodByDryerChamber =
          await this.dryerChamberDataRepository.findAll({
            where: { dryerChamberId: dryerChamber.id, isDrying: true },
            include: [
              {
                model: Dimension,
                as: 'dimension',
                attributes: ['volume'],
              },
            ],
          });

        const innerOutput = {};

        woodClasses.forEach(async (woodClass) => {
          const woodByWoodClassInDryerChamber = woodByDryerChamber.filter(
            (warehouseRecord) => warehouseRecord.woodClassId === woodClass.id,
          );

          const totalVolume = woodByWoodClassInDryerChamber.reduce(
            (total, warehouseRecord) =>
              total + warehouseRecord.dimension.volume * warehouseRecord.amount,
            0,
          );

          resultDryerVolume += totalVolume;

          innerOutput[woodClass.name] = Number(totalVolume.toFixed(4));
        });

        output.push({
          dryerId: dryerChamber.id,
          dryerName: dryerChamber.name,
          sorts: innerOutput,
          totalVolume: Number(resultDryerVolume.toFixed(4)),
        });
      }),
    );

    output = output.sort((a, b) => {
      if (a.dryerId > b.dryerId) {
        return 1;
      }

      if (a.dryerId < b.dryerId) {
        return -1;
      }

      return 0;
    });

    return output;
  }

  async getAllChamberData(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const dryerChamberData = await this.dryerChamberDataRepository.findAll({
      where: { dryerChamberId },
    });

    return dryerChamberData;
  }

  async deleteAllDryerChamberData() {
    await this.dryerChamberDataRepository.truncate();
  }
}
