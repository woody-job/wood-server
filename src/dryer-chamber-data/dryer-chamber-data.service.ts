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
import { RemoveWoodFromChamberDto } from './dtos/remove-wood-from-chamber.dto';

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
    let totalAmount = 0;

    dryerChamberDatas.forEach((dryerChamberData) => {
      totalVolume +=
        dryerChamberData.dimension.volume * dryerChamberData.amount;
      totalAmount += dryerChamberData.amount;
    });

    return {
      data: dryerChamberDatas,
      totalVolume: Number(totalVolume.toFixed(4)),
      totalAmount: Number(totalAmount.toFixed(4)),
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
    let totalAmount = 0;
    let outputData = [];

    dryerChamberDatas.forEach((dryerChamberData) => {
      const chamberDataDimension = dryerChamberData.dimension;
      const chamberDataWoodType = dryerChamberData.woodType;

      const outputItem = {
        id: 0,
        dimension: chamberDataDimension,
        woodType: chamberDataWoodType,
        amount: 0,
        firstClassVolume: 0,
        firstClassAmount: 0,
        secondClassVolume: 0,
        secondClassAmount: 0,
        marketClassVolume: 0,
        marketClassAmount: 0,
        thirdClassVolume: 0,
        thirdClassAmount: 0,
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
        case 'Третий':
          woodClassKey = 'thirdClass';
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
      outputItem[`${woodClassKey}Amount`] = Number(
        (outputItem[`${woodClassKey}Amount`] + dryerChamberData.amount).toFixed(
          4,
        ),
      );

      outputItem.amount += dryerChamberData.amount;

      outputItem.totalVolume = Number(
        (
          outputItem.firstClassVolume +
          outputItem.secondClassVolume +
          outputItem.marketClassVolume +
          outputItem.thirdClassVolume
        ).toFixed(4),
      );

      outputItem.id = Number(
        `${outputItem.dimension.id}${outputItem.woodType.id}`,
      );

      outputData.push(outputItem);
    });

    totalVolume = outputData.reduce((total, current) => {
      return total + current.totalVolume;
    }, 0);

    totalAmount = outputData.reduce((total, current) => {
      return total + current.amount;
    }, 0);

    return {
      totalVolume: Number(totalVolume.toFixed(4)),
      totalAmount: Number(totalAmount.toFixed(4)),
      data: outputData,
    };
  }

  async getAllDryedRecords({
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
        isTakenOut: true,
        isDrying: false,
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
    let totalAmount = 0;

    dryerChamberDatas.forEach((dryerChamberData) => {
      totalVolume +=
        dryerChamberData.dimension.volume * dryerChamberData.amount;
      totalAmount += dryerChamberData.amount;
    });

    return {
      data: dryerChamberDatas,
      totalVolume: Number(totalVolume.toFixed(4)),
      totalAmount: Number(totalAmount.toFixed(4)),
    };
  }

  async createDryerChamberDataRecord({
    dryerChamberId,
    dryerChamberDataDto,
    avoidWarehouseModification = false,
  }: {
    dryerChamberId: number;
    avoidWarehouseModification?: boolean;
    dryerChamberDataDto: CreateDryerChamberDataDto;
    isDrying?: boolean;
    isTakenOut?: boolean;
  }) {
    const {
      dimensionId,
      woodClassId,
      woodTypeId,
      date,
      amount,
      chamberIterationCount,
    } = dryerChamberDataDto;

    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!avoidWarehouseModification) {
      // Убрать со склада сырую доску
      const existentWarehouseRecord =
        await this.warehouseService.findWarehouseRecordByWoodParams({
          woodConditionId: wetWoodCondition.id,
          woodClassId: woodClassId,
          woodTypeId: woodTypeId,
          dimensionId: dimensionId,
        });

      if (!existentWarehouseRecord) {
        // Как отгрузка для сырой доски
        await this.warehouseService.createWarehouseRecord({
          amount: -amount,
          woodConditionId: wetWoodCondition.id,
          woodClassId: woodClass.id,
          woodTypeId: woodType.id,
          dimensionId: dimension.id,
        });
      } else {
        await this.warehouseService.updateWarehouseRecord({
          amount: existentWarehouseRecord.amount - amount,
          woodConditionId: wetWoodCondition.id,
          woodClassId: woodClassId,
          woodTypeId: woodTypeId,
          dimensionId: dimensionId,
        });
      }
    }

    const dryerChamberData = await this.dryerChamberDataRepository.create({
      date,
      amount,
      isDrying: true,
      isTakenOut: false,
      chamberIterationCountWhenBringingIn: chamberIterationCount,
    });

    await dryerChamberData.$set('woodClass', woodClassId);
    dryerChamberData.woodClass = woodClass;

    await dryerChamberData.$set('woodType', woodTypeId);
    dryerChamberData.woodType = woodType;

    await dryerChamberData.$set('dimension', dimensionId);
    dryerChamberData.dimension = dimension;

    await dryerChamberData.$set('dryerChamber', dryerChamberId);
    dryerChamberData.dryerChamber = dryerChamber;

    return dryerChamberData;
  }

  async checkForErrorsBeforeCreate({
    dryerChamberId,
    dryerChamberDataDto,
  }: {
    dryerChamberId: number;
    dryerChamberDataDto: CreateDryerChamberDataDto;
  }) {
    const { dimensionId, woodClassId, woodTypeId } = dryerChamberDataDto;

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

    const woodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!woodCondition) {
      return "Состояния доски 'Сырая' нет в базе";
    }

    return dryerChamberDataDto;
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

    const errors = [];
    const filteredDtos = [];

    for (const dryerChamberDataDto of dryerChamberDataDtos) {
      const checking = await this.checkForErrorsBeforeCreate({
        dryerChamberId,
        dryerChamberDataDto,
      });

      if (typeof checking === 'string') {
        errors.push(checking);
      }

      if (typeof checking !== 'string' && checking.amount) {
        filteredDtos.push(checking);
      }
    }

    if (errors.length !== 0) {
      return errors;
    }

    for (const dryerChamberDataDto of filteredDtos) {
      await this.createDryerChamberDataRecord({
        dryerChamberId,
        dryerChamberDataDto,
      });
    }

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

      return dryerChamberData;
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

  async removeWoodFromChamber(
    dryerChamberId: number,
    removeWoodFromChamberDtos: RemoveWoodFromChamberDto[],
  ) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const dryerChamberDatasCheck =
      await this.dryerChamberDataRepository.findAll({
        where: {
          dryerChamberId,
          isDrying: true,
        },
      });

    if (!dryerChamberDatasCheck) {
      throw new HttpException(
        'Для данной сушильной камеры нет записи о внесенной доске. Невозможно убрать.',
        HttpStatus.NOT_FOUND,
      );
    }

    // В dto могут приходить существующие записи (у них есть id).
    // У них при необходимости можно изменить количество и сорт
    // Также может прийти новая запись - без id. Она также будет записана
    // как dryerChamberDataRecord
    for (const removeDto of removeWoodFromChamberDtos) {
      const correspondingChamberRecord = dryerChamberDatasCheck.find(
        (data) => data.id === removeDto.dryerChamberDataRecordId,
      );

      if (!correspondingChamberRecord) {
        const newDryerChamberData = await this.createDryerChamberDataRecord({
          dryerChamberId,
          avoidWarehouseModification: true,
          dryerChamberDataDto: {
            woodClassId: removeDto.woodClassId,
            amount: removeDto.amount,
            dimensionId: removeDto.dimensionId,
            woodTypeId: removeDto.woodTypeId,
            chamberIterationCount: removeDto.chamberIterationCount,
            date: removeDto.date,
          },
        });

        await this.removeSingleWoodPackFromChamber(newDryerChamberData);
      } else {
        correspondingChamberRecord.woodClassId = removeDto.woodClassId;
        correspondingChamberRecord.amount = removeDto.amount;

        await correspondingChamberRecord.save();
      }
    }

    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll({
      where: {
        dryerChamberId,
        isDrying: true,
      },
    });
    const errors = [];

    for (const dryerChamberData of dryerChamberDatas) {
      try {
        await this.removeSingleWoodPackFromChamber(dryerChamberData);
      } catch (error) {
        await this.removeSingleWoodPackFromChamber(dryerChamberData);

        errors.push(error);
      }
    }

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
        let resultDryerAmount = 0;

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
            (total, dryerChamberRecord) =>
              total +
              dryerChamberRecord.dimension.volume * dryerChamberRecord.amount,
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
