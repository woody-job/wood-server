import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkshopOut } from './workshop-out.model';
import { WorkshopWoodPricesService } from 'src/workshop-wood-prices/workshop-wood-prices.service';
import { WorkshopService } from 'src/workshop/workshop.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { DimensionService } from 'src/dimension/dimension.service';
import { CreateWorkshopOutDto } from './dtos/create-workshop-out.dto';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment-timezone';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { UpdateWorkshopOutDto } from './dtos/update-workshop-out.dto';
import { WoodArrivalService } from 'src/wood-arrival/wood-arrival.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { BeamInService } from 'src/beam-in/beam-in.service';
import { WorkshopDailyDataService } from 'src/workshop-daily-data/workshop-daily-data.service';
import { WoodWarehouseErrorsType } from 'src/types';

@Injectable()
export class WorkshopOutService {
  constructor(
    @InjectModel(WorkshopOut)
    private workshopOutRepository: typeof WorkshopOut,
    private workshopWoodPriceService: WorkshopWoodPricesService,
    private workshopService: WorkshopService,
    private woodClassService: WoodClassService,
    private woodTypeService: WoodTypeService,
    private dimensionService: DimensionService,
    private woodArrivalService: WoodArrivalService,
    private woodConditionService: WoodConditionService,
    private warehouseService: WarehouseService,

    @Inject(forwardRef(() => BeamInService))
    private beamInService: BeamInService,

    @Inject(forwardRef(() => WorkshopDailyDataService))
    private workshopDailyDataService: WorkshopDailyDataService,
  ) {}

  private async updateWarehouseRecord({
    amount,
    woodClass,
    woodType,
    dimension,
    action = 'add',
    isCreate = false,
    errorMessages,
  }: {
    amount: number;
    woodClass: WoodClass;
    woodType: WoodType;
    dimension: Dimension;
    action?: 'add' | 'subtract';
    isCreate?: boolean;
    errorMessages?: WoodWarehouseErrorsType | undefined;
  }) {
    // Внести на склад сырую доску
    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      throw new HttpException(
        "Состояния доски 'Сырая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
    }

    if (isCreate) {
      await this.warehouseService.createWarehouseRecord({
        amount: amount,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClass.id,
        woodTypeId: woodType.id,
        dimensionId: dimension.id,
      });

      return;
    }

    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClass.id,
        woodTypeId: woodType.id,
        dimensionId: dimension.id,
      });

    if (!existentWarehouseRecord) {
      throw new HttpException(
        errorMessages?.noSuchRecord({
          woodClass: woodClass.name.toLowerCase(),
          woodType: woodType.name.toLowerCase(),
          woodCondition: wetWoodCondition.name.toLowerCase(),
          dimension: `${dimension.width}x${dimension.thickness}x${dimension.length}`,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }

    let newAmount = existentWarehouseRecord.amount;

    if (action === 'add') {
      newAmount = existentWarehouseRecord.amount + amount;
    }

    if (action === 'subtract') {
      newAmount = existentWarehouseRecord.amount - amount;

      if (newAmount < 0) {
        throw new HttpException(
          errorMessages?.notEnoughAmount({
            warehouseAmount: existentWarehouseRecord.amount,
            newRecordAmount: amount,
            woodClass: woodClass.name.toLowerCase(),
            woodType: woodType.name.toLowerCase(),
            woodCondition: wetWoodCondition.name.toLowerCase(),
            dimension: `${dimension.width}x${dimension.thickness}x${dimension.length}`,
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.warehouseService.updateWarehouseRecord({
      amount: newAmount,
      woodConditionId: wetWoodCondition.id,
      woodClassId: woodClass.id,
      woodTypeId: woodType.id,
      dimensionId: dimension.id,
    });
  }

  async addWoodOutputToWorkshop(workshopOutDto: CreateWorkshopOutDto) {
    const { date, amount, workshopId, woodClassId, woodTypeId, dimensionId } =
      workshopOutDto;

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    // Если выбранная доска уже выходила из цеха,
    // то просто добавляется amount и новый instance не создается
    const existentWorkshopOut = await this.workshopOutRepository.findOne({
      where: {
        [Op.and]: Sequelize.where(
          Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
          Op.eq,
          `${year}-${month}-${day}`,
        ),
        workshopId,
        woodClassId,
        woodTypeId,
        dimensionId,
      },
      include: [WoodClass, WoodType, Dimension],
    });

    if (existentWorkshopOut) {
      existentWorkshopOut.amount = existentWorkshopOut.amount + amount;
      await existentWorkshopOut.save();

      // Добавить доски на склад
      await this.updateWarehouseRecord({
        amount: amount,
        woodClass: existentWorkshopOut.woodClass,
        woodType: existentWorkshopOut.woodType,
        dimension: existentWorkshopOut.dimension,
      });

      return existentWorkshopOut;
    }

    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
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

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранная порода не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Цену доски пользователь не передает, она получается из базы данных по другим внесенным
    // в дто параметрам
    const workshopWoodPrice =
      await this.workshopWoodPriceService.findWorkshopWoodPriceByParams({
        workshopId,
        woodClassId,
        dimensionId,
      });

    if (!workshopWoodPrice) {
      throw new HttpException(
        'В текущем цехе нет цены для выбранного сечения и сорта. Добавление невозможно.',
        HttpStatus.NOT_FOUND,
      );
    }

    const workshopOut = await this.workshopOutRepository.create({
      date,
      amount,
    });

    await workshopOut.$set('workshopWoodPrice', workshopWoodPrice.id);
    workshopOut.workshopWoodPrice = workshopWoodPrice;

    await workshopOut.$set('workshop', workshopId);
    workshopOut.workshop = workshop;

    await workshopOut.$set('woodClass', woodClassId);
    workshopOut.woodClass = woodClass;

    await workshopOut.$set('woodType', woodTypeId);
    workshopOut.woodType = woodType;

    await workshopOut.$set('dimension', dimensionId);
    workshopOut.dimension = dimension;

    // Добавить доски на склад
    await this.updateWarehouseRecord({
      amount: workshopOut.amount,
      woodClass,
      woodType,
      dimension,
      isCreate: true,
    });

    return workshopOut;
  }

  async editWoodFromWorkshop(
    workshopOutId: number,
    workshopOutDto: UpdateWorkshopOutDto,
  ) {
    const { amount, woodClassId, woodTypeId, dimensionId } = workshopOutDto;

    const workshopOut = await this.workshopOutRepository.findByPk(
      workshopOutId,
      { include: [WoodClass, WoodType, Dimension] },
    );

    if (!workshopOut) {
      throw new HttpException(
        'Выбранный выход цеха не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const oldWorkshopOutAmount = workshopOut.amount;

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      throw new HttpException('Выбранный сорт не найден', HttpStatus.NOT_FOUND);
    }

    if (workshopOut.woodClassId !== woodClassId) {
      await workshopOut.$set('woodClass', woodClassId);
      workshopOut.woodClass = woodClass;
    }

    const dimension =
      await this.dimensionService.findDimensionById(dimensionId);

    if (!dimension) {
      throw new HttpException(
        'Выбранное сечение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    if (workshopOut.dimensionId !== dimensionId) {
      await workshopOut.$set('dimension', dimensionId);
      workshopOut.dimension = dimension;
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранное сечение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    workshopOut.amount = amount;

    // Изменить запись на складе (сырая доска)
    let newAmount = oldWorkshopOutAmount;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldWorkshopOutAmount > workshopOut.amount) {
      newAmount = oldWorkshopOutAmount - workshopOut.amount;
      action = 'subtract';
    }

    if (oldWorkshopOutAmount < workshopOut.amount) {
      newAmount = workshopOut.amount - oldWorkshopOutAmount;
      action = 'add';
    }

    await this.updateWarehouseRecord({
      amount: newAmount,
      woodClass: workshopOut.woodClass,
      woodType: workshopOut.woodType,
      dimension: workshopOut.dimension,
      action: action,
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись о выходе из цеха не была изменена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Изменить запись о выходе из цеха на ${newRecordAmount} шт невозможно.`,
      },
    });

    // Цену доски пользователь не передает, она получается из базы данных по другим внесенным
    // в дто параметрам
    const workshopWoodPrice =
      await this.workshopWoodPriceService.findWorkshopWoodPriceByParams({
        workshopId: workshopOut.workshopId,
        woodClassId,
        dimensionId,
      });

    if (!workshopWoodPrice) {
      throw new HttpException(
        'В текущем цехе нет цены для выбранного сечения и сорта. Добавление невозможно.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (workshopOut.woodTypeId !== woodTypeId) {
      await workshopOut.$set('woodType', woodTypeId);
      workshopOut.woodType = woodType;
    }

    await workshopOut.save();

    return workshopOut;
  }

  async getAllWoodOutForWorkshopForADay({
    workshopId,
    date,
  }: {
    workshopId: number;
    date: string;
  }) {
    if (!date) {
      throw new HttpException(
        'Query параметр date обязателен для запроса',
        HttpStatus.BAD_REQUEST,
      );
    }

    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
    }

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    const workshopOuts = await this.workshopOutRepository.findAll({
      include: [WoodClass, WoodType, Dimension],
      attributes: {
        exclude: ['workshopId', 'woodClassId', 'woodTypeId', 'dimensionId'],
      },
      where: {
        workshopId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
            Op.eq,
            `${year}-${month}-${day}`,
          ),
        ],
      },
      order: [['date', 'DESC']],
    });

    let totalWorkshopOutVolume = 0;

    workshopOuts.forEach((workshopOut) => {
      totalWorkshopOutVolume +=
        workshopOut.dimension.volume * workshopOut.amount;
    });

    return {
      data: workshopOuts,
      totalWorkshopOutVolume: Number(totalWorkshopOutVolume.toFixed(2)),
    };
  }

  async getAllWoodOutForWorkshopForMultipleDays({
    workshopId,
    startDate,
    endDate,
  }: {
    workshopId: number;
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

    const startYear = momentStartDate.year();
    const startMonth = momentStartDate.month() + 1;
    const startDay = momentStartDate.date();

    const endYear = momentEndDate.year();
    const endMonth = momentEndDate.month() + 1;
    const endDay = momentEndDate.date();

    const workshopOuts = await this.workshopOutRepository.findAll({
      include: [WoodClass, WoodType, Dimension],
      attributes: {
        exclude: ['workshopId', 'woodClassId', 'woodTypeId', 'dimensionId'],
      },
      where: {
        workshopId,
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
      // order: [['date', 'DESC']],
    });

    let totalWorkshopOutVolume = 0;

    workshopOuts.forEach((workshopOut) => {
      totalWorkshopOutVolume +=
        workshopOut.dimension.volume * workshopOut.amount;
    });

    return {
      data: workshopOuts,
      totalWorkshopOutVolume: Number(totalWorkshopOutVolume.toFixed(2)),
    };
  }

  async deleteWorkshopOutFromWorkshop(workshopOutId: number) {
    const workshopOut = await this.workshopOutRepository.findByPk(
      workshopOutId,
      { include: [WoodClass, WoodType, Dimension] },
    );

    if (!workshopOut) {
      throw new HttpException(
        'Выбранный выход цеха не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись о поступлениях (сырая доска)
    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      throw new HttpException(
        "Состояния доски 'сырая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись на складе (сырая доска)
    await this.updateWarehouseRecord({
      amount: workshopOut.amount,
      woodClass: workshopOut.woodClass,
      woodType: workshopOut.woodType,
      dimension: workshopOut.dimension,
      action: 'subtract',
      errorMessages: {
        noSuchRecord: ({ woodType, woodClass, dimension, woodCondition }) =>
          `На складе нет доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
           Запись о выходе из цеха не была удалена`,
        notEnoughAmount: ({
          woodCondition,
          warehouseAmount,
          newRecordAmount,
          woodType,
          woodClass,
          dimension,
        }) =>
          `На складе есть только ${warehouseAmount} шт выбранной доски с параметрами "${woodCondition}", "${woodType}", "сорт ${woodClass}", "${dimension}". 
            Удалить запись о выходе из цеха на ${newRecordAmount} шт невозможно.`,
      },
    });

    await workshopOut.destroy();
  }

  async findWorkshopOutById(workshopOutId: number) {
    const workshopOut =
      await this.workshopOutRepository.findByPk(workshopOutId);

    return workshopOut;
  }

  async getWorkshopOutReportForMultipleDays({
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

    const days = [];

    // TODO: Для всех query параметров с датой нужна валидация
    if (!startDate || !endDate) {
      throw new HttpException(
        'Необходимо указать query параметры startDate & endDate',
        HttpStatus.BAD_REQUEST,
      );
    }

    const momentStartDate = moment(startDate);

    while (momentStartDate.isSameOrBefore(endDate)) {
      days.push(momentStartDate.toISOString());
      momentStartDate.add(1, 'days');
    }

    if (days.length > 31) {
      throw new HttpException(
        'Количество запрашиваемых дней ограничено до 31',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let output = [];

    await Promise.all(
      days.map(async (dayDate) => {
        const { data: workshopOutData, totalWorkshopOutVolume } =
          await this.getAllWoodOutForWorkshopForADay({
            workshopId,
            date: dayDate,
          });

        const { totalVolume: totalBeamInVolume } =
          await this.beamInService.getAllBeamInForWorkshop({
            workshopId,
            startDate: dayDate,
            endDate: dayDate,
          });

        const {
          totalWoodPrice,
          priceOfRawMaterials,
          sawingPrice,
          profit,
          profitPerUnit,
          dimensionOfTheDay,
          woodNamingOfTheDay,
        } = await this.workshopDailyDataService.getDailyStatsForWorkshop(
          workshopId,
          dayDate,
        );

        const outputItem: Record<string, any> = {};
        const totalWorkshopOutPercentage = Number(
          ((totalWorkshopOutVolume / totalBeamInVolume) * 100).toFixed(2),
        );

        const totalWorkshopOutPercentageForSecondWorkshop = Number(
          (
            (totalWorkshopOutVolume / (totalWorkshopOutVolume * 2)) *
            100
          ).toFixed(2),
        );

        outputItem.id = moment(dayDate).date() + moment(dayDate).month();
        outputItem.date = dayDate;
        outputItem.woodNaming = woodNamingOfTheDay;
        outputItem.dimension = dimensionOfTheDay;

        // Важное условие для второго цеха
        outputItem.totalBeamInVolume = Number(
          (workshop.id === 2
            ? totalWorkshopOutVolume * 2
            : totalBeamInVolume
          ).toFixed(2),
        );
        outputItem.totalWorkshopOutPercentage =
          workshop.id === 2
            ? totalWorkshopOutPercentageForSecondWorkshop
            : totalWorkshopOutPercentage;
        outputItem.totalWoodPrice = totalWoodPrice;
        outputItem.priceOfRawMaterials = priceOfRawMaterials;
        outputItem.sawingPrice = sawingPrice;
        outputItem.profit = profit;
        outputItem.profitPerUnit = profitPerUnit;

        woodClasses.forEach((woodClass) => {
          const workshopOutDataByWoodClass = workshopOutData.filter(
            (workshopOutDataItem) =>
              workshopOutDataItem.woodClassId !== woodClass.id,
          );

          const currentWoodClassVolume = workshopOutDataByWoodClass.reduce(
            (total, workshopRecord) => {
              if (workshopRecord.woodClass.id === woodClass.id) {
                return (
                  total +
                  workshopRecord.dimension.volume * workshopRecord.amount
                );
              }

              return total;
            },
            0,
          );

          const localTotalBeamInVolume =
            workshop.id === 2 ? totalWorkshopOutVolume * 2 : totalBeamInVolume;

          const percentageForCurrentWoodClassFromTotalVolume =
            (currentWoodClassVolume / localTotalBeamInVolume) * 100;

          let woodClassKey = '';

          switch (woodClass.name) {
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
            currentWoodClassVolume.toFixed(4),
          );
          outputItem[`${woodClassKey}Percentage`] = Number(
            percentageForCurrentWoodClassFromTotalVolume.toFixed(2),
          );
        });

        output.push(outputItem);
      }),
    );

    output = output.sort((a, b) => {
      const momentFirstDate = moment(a.date);
      const momentSecondDate = moment(b.date);

      const difference = momentFirstDate.diff(momentSecondDate, 'days');

      if (difference > 1) {
        return 1;
      }

      if (difference < 0) {
        return -1;
      }

      return 0;
    });

    return output;
  }

  async deleteAllWorkshopOut() {
    await this.workshopOutRepository.truncate();
  }
}
