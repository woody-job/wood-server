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
import * as moment from 'moment';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { UpdateWorkshopOutDto } from './dtos/update-workshop-out.dto';
import { WoodArrivalService } from 'src/wood-arrival/wood-arrival.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { BeamInService } from 'src/beam-in/beam-in.service';
import { WorkshopDailyDataService } from 'src/workshop-daily-data/workshop-daily-data.service';

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
    private beanInService: BeamInService,
    @Inject(forwardRef(() => WorkshopDailyDataService))
    private workshopDailyDataService: WorkshopDailyDataService,
  ) {}

  private async updateWarehouseRecord({
    amount,
    woodClassId,
    woodTypeId,
    dimensionId,
    action = 'add',
    isCreate = false,
    isUpdate = false,
  }: {
    amount: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
    action?: 'add' | 'subtract';
    isCreate?: boolean;
    isUpdate?: boolean;
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

    if (!isUpdate) {
      await this.warehouseService.createWarehouseRecord({
        amount: amount,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

      return;
    }

    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    if (!existentWarehouseRecord) {
      await this.warehouseService.createWarehouseRecord({
        amount: amount,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });
    } else {
      let newAmount = existentWarehouseRecord.amount;

      if (isCreate) {
        newAmount = amount;
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
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });
    }
  }

  private async updateWoodArrivalForCreate({
    date,
    amount,
    woodClassId,
    woodTypeId,
    dimensionId,
  }: {
    date: string;
    amount: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
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

    // Внести на склад сырую доску
    await this.updateWarehouseRecord({
      amount,
      woodClassId,
      woodTypeId,
      dimensionId,
      isCreate: true,
    });

    // Добавить запись в поступления (сырая доска)
    const existentWoodArrival =
      await this.woodArrivalService.findWoodArrivalByWoodParams({
        date: date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    if (!existentWoodArrival) {
      await this.woodArrivalService.createWoodArrival(
        {
          date: date,
          woodConditionId: wetWoodCondition.id,
          woodClassId: woodClassId,
          woodTypeId: woodTypeId,
          dimensionId: dimensionId,
          amount: amount,
        },
        { avoidDirectWarehouseChange: true },
      );
    } else {
      let newAmount = existentWoodArrival.amount;

      if (existentWoodArrival.amount < amount) {
        newAmount =
          existentWoodArrival.amount + (amount - existentWoodArrival.amount);
      }

      if (amount > existentWoodArrival.amount) {
        newAmount = amount;
      }

      await this.woodArrivalService.createWoodArrival(
        {
          date: date,
          woodConditionId: wetWoodCondition.id,
          woodClassId: woodClassId,
          woodTypeId: woodTypeId,
          dimensionId: dimensionId,
          amount: amount,
        },
        { avoidDirectWarehouseChange: true },
      );
    }
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
    });

    if (existentWorkshopOut) {
      existentWorkshopOut.amount = existentWorkshopOut.amount + amount;
      await existentWorkshopOut.save();

      await this.updateWoodArrivalForCreate({
        date: existentWorkshopOut.date,
        amount: amount,
        woodClassId: existentWorkshopOut.woodClassId,
        woodTypeId: existentWorkshopOut.woodTypeId,
        dimensionId: existentWorkshopOut.dimensionId,
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

    await this.updateWoodArrivalForCreate({
      date: workshopOut.date,
      amount: workshopOut.amount,
      woodClassId: workshopOut.woodClassId,
      woodTypeId: workshopOut.woodTypeId,
      dimensionId: workshopOut.dimensionId,
    });

    return workshopOut;
  }

  async editWoodFromWorkshop(
    workshopOutId: number,
    workshopOutDto: UpdateWorkshopOutDto,
  ) {
    const { amount, woodClassId, woodTypeId, dimensionId } = workshopOutDto;

    const workshopOut =
      await this.workshopOutRepository.findByPk(workshopOutId);

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

    workshopOut.amount = amount;
    await workshopOut.save();

    // Изменить запись о поступлениях (сырая доска)
    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      throw new HttpException(
        "Состояния доски 'сырая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
    }

    const existentWoodArrival =
      await this.woodArrivalService.findWoodArrivalByWoodParams({
        date: workshopOut.date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: workshopOut.woodClassId,
        woodTypeId: workshopOut.woodTypeId,
        dimensionId: workshopOut.dimensionId,
      });

    if (!existentWoodArrival) {
      // Такого кейса в принципе быть не должно, но, все-таки, если по какой-то причине
      // выход из цеха, который мы редактируем, есть, а записи о поступлениях нет, то
      // создается новая запись в поступлениях
      await this.woodArrivalService.createWoodArrival(
        {
          date: workshopOut.date,
          woodConditionId: wetWoodCondition.id,
          woodClassId: workshopOut.woodClassId,
          woodTypeId: workshopOut.woodTypeId,
          dimensionId: workshopOut.dimensionId,
          amount: workshopOut.amount,
        },
        { avoidDirectWarehouseChange: true },
      );
    } else {
      let newAmount = existentWoodArrival.amount;

      if (oldWorkshopOutAmount > workshopOut.amount) {
        newAmount =
          existentWoodArrival.amount -
          (oldWorkshopOutAmount - workshopOut.amount);

        // Проверка на дурачка | на случай, если количество в записи поступлений собирается стать отрицательной
        if (newAmount < 0) {
          throw new HttpException(
            `В записи поступлений, привязанной к текущему выходу из цеха, 
            только ${existentWoodArrival.amount} доски(досок). 
            Нельзя изменить количество выхода на ${workshopOut.amount}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (oldWorkshopOutAmount < workshopOut.amount) {
        newAmount =
          existentWoodArrival.amount +
          (workshopOut.amount - oldWorkshopOutAmount);
      }

      await this.woodArrivalService.editWoodArrival(
        existentWoodArrival.id,
        {
          // Если в текущий день уже есть поступления сырой доски с такими параметрами,
          // то новая запись в поступлениях не создается, просто меняется его число
          amount: newAmount,
          woodClassId: workshopOut.woodClassId,
          dimensionId: workshopOut.dimensionId,
        },
        { avoidDirectWarehouseChange: true },
      );
    }

    let newAmount = oldWorkshopOutAmount;
    let action: 'add' | 'subtract' = 'add';

    if (oldWorkshopOutAmount > workshopOut.amount) {
      newAmount = oldWorkshopOutAmount - workshopOut.amount;
      action = 'subtract';
    }

    if (oldWorkshopOutAmount < workshopOut.amount) {
      newAmount = workshopOut.amount - oldWorkshopOutAmount;
    }

    // Изменить запись на складе (сырая доска)
    await this.updateWarehouseRecord({
      amount: newAmount,
      woodClassId: workshopOut.woodClassId,
      woodTypeId: workshopOut.woodTypeId,
      dimensionId: workshopOut.dimensionId,
      action: action,
      isUpdate: true,
    });

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

    const { totalVolume: totalBeamInVolume } =
      await this.beanInService.getAllBeamInForWorkshop({
        workshopId,
        startDate: date,
        endDate: date,
      });

    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let totalWorkshopOutVolume = 0;

    const outputSunburstData = woodClasses.map((woodClass) => {
      const workshopOutsByWoodClass = workshopOuts.filter(
        (workshopOut) => workshopOut.woodClass.id === woodClass.id,
      );

      const woodClassVolume = workshopOutsByWoodClass.reduce(
        (total, workshopOut) => {
          return total + workshopOut.dimension.volume * workshopOut.amount;
        },
        0,
      );

      return {
        name: woodClass.name,
        size: Number(woodClassVolume.toFixed(2)),
      };
    });

    workshopOuts.forEach((workshopOut) => {
      totalWorkshopOutVolume +=
        workshopOut.dimension.volume * workshopOut.amount;
    });

    const trashVolume = totalBeamInVolume - totalWorkshopOutVolume;

    return {
      data: workshopOuts,
      sunburstData: [
        {
          name: 'Выход',
          children: outputSunburstData,
        },
        {
          name: 'Мусор',
          size: trashVolume > 0 ? Number(trashVolume.toFixed(2)) : 0,
        },
      ],
      totalWorkshopOutVolume,
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

    return workshopOuts;
  }

  async deleteWorkshopOutFromWorkshop(workshopOutId: number) {
    const workshopOut =
      await this.workshopOutRepository.findByPk(workshopOutId);

    if (!workshopOut) {
      throw new HttpException(
        'Выбранный выход цеха не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    await workshopOut.destroy();

    // Изменить запись о поступлениях (сырая доска)
    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      throw new HttpException(
        "Состояния доски 'сырая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
    }

    const existentWoodArrival =
      await this.woodArrivalService.findWoodArrivalByWoodParams({
        date: workshopOut.date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: workshopOut.woodClassId,
        woodTypeId: workshopOut.woodTypeId,
        dimensionId: workshopOut.dimensionId,
      });

    if (!existentWoodArrival) {
      // Такого кейса в принципе быть не должно

      return;
    }

    let newAmount = existentWoodArrival.amount - workshopOut.amount;

    if (newAmount < 0) {
      throw new HttpException(
        `В записи поступлений, привязанной к текущему выходу из цеха, 
          есть только ${existentWoodArrival.amount} доски(досок). 
          Нельзя изменить количество выхода на ${workshopOut.amount}. 
          Выход из цеха был удален`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newAmount === 0) {
      // Если новое количество доски в поступлении становится равным нулю, то запись
      // удаляется
      await this.woodArrivalService.deleteWoodArrival(existentWoodArrival.id);

      return;
    }

    await this.woodArrivalService.editWoodArrival(existentWoodArrival.id, {
      // Если в текущий день уже есть поступления сырой доски с такими параметрами,
      // то новая запись в поступлениях не создается, просто меняется его число
      amount: newAmount,
      woodClassId: workshopOut.woodClassId,
      dimensionId: workshopOut.dimensionId,
    });

    // Изменить запись на складе (сырая доска)
    await this.updateWarehouseRecord({
      amount: workshopOut.amount,
      woodClassId: workshopOut.woodClassId,
      woodTypeId: workshopOut.woodTypeId,
      dimensionId: workshopOut.dimensionId,
      action: 'subtract',
    });
  }

  async findWorkshopOutById(workshopOutId: number) {
    const workshopOut =
      await this.workshopOutRepository.findByPk(workshopOutId);

    return workshopOut;
  }

  async getOverallWorkshopsStats() {
    const currentDate = moment();
    const weekStart = currentDate.clone().startOf('isoWeek');

    const days: string[] = Array.from(Array(6).keys()).map((dayNumber) => {
      return moment(weekStart).add(dayNumber, 'days').toISOString();
    });

    const workshops = await this.workshopService.getAllWorkshops();
    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let output = [];

    await Promise.all(
      workshops.map(async (workshop) => {
        const workshopOutput = [];

        await Promise.all(
          days.map(async (dayDate) => {
            const { data: workshopData } =
              await this.getAllWoodOutForWorkshopForADay({
                workshopId: workshop.id,
                date: dayDate,
              });

            const dayOutput = {
              date: dayDate,
              woods: [],
            };

            woodClasses.forEach((woodClass) => {
              const workshopDataByWoodClass = workshopData.filter(
                (workshopDataItem) =>
                  workshopDataItem.woodClassId !== woodClass.id,
              );

              const totalVolume = workshopDataByWoodClass.reduce(
                (total, workshopRecord) =>
                  total +
                  workshopRecord.dimension.volume * workshopRecord.amount,
                0,
              );

              const currentWoodClassVolume = workshopDataByWoodClass.reduce(
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

              const percentageForCurrentWoodClassFromTotalVolume =
                (currentWoodClassVolume / totalVolume) * 100;

              dayOutput.woods.push({
                name: woodClass.name,
                percentage: Number(
                  percentageForCurrentWoodClassFromTotalVolume.toFixed(2),
                ),
              });
            });

            workshopOutput.push(dayOutput);
          }),
        );

        output.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
          woods: workshopOutput.sort((a, b) => {
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
          }),
        });
      }),
    );

    output = await Promise.all(
      output.map(async (workshopOutput) => {
        let lastWorkingDay = moment().subtract(1, 'days');

        // Если последний день - воскресенье, то берем субботу - последний рабочий день недели
        if (lastWorkingDay.day() === 7) {
          lastWorkingDay = moment().subtract(2, 'days');
        }

        const beamInForLastWorkingDay =
          await this.beanInService.getAllBeamInForWorkshop({
            workshopId: workshopOutput.workshopId,
            startDate: lastWorkingDay.toISOString(),
            endDate: lastWorkingDay.toISOString(),
          });

        const totalBeamInVolume = beamInForLastWorkingDay.totalVolume;

        const dailyStatsForLastWorkingDay =
          await this.workshopDailyDataService.getDailyStatsForWorkshop(
            workshopOutput.workshopId,
            lastWorkingDay.toISOString(),
          );

        const profitPerUnit = dailyStatsForLastWorkingDay.profitPerUnit;

        return {
          ...workshopOutput,
          lastWorkingDayStats: {
            date: lastWorkingDay.toISOString(),
            totalBeamInVolume,
            profitPerUnit,
          },
        };
      }),
    );

    return output.sort((a, b) => {
      if (a.workshopId > b.workshopId) {
        return 1;
      }

      if (a.workshopId < b.workshopId) {
        return -1;
      }

      return 0;
    });
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

    const days = [];

    // TODO: Для всех query параметров с датой нужна валидация
    if (!startDate || !endDate) {
      throw new HttpException(
        'Необходимо указать query параметры startDate & endDate',
        HttpStatus.BAD_REQUEST,
      );
    }

    const momentStartDate = moment(startDate);
    const now = momentStartDate.clone();

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

    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let workshopOutput = [];

    // TODO: Не нужно мапить дни. Надо сделать как в одноименном методе в beam-in.service. И не забыть отсортировать и сгруппировать по дате, как
    // в getProfitStatsByTimespan в этом файле
    // Поискать где еще этот дурацкий map по датам проходится.
    await Promise.all(
      days.map(async (dayDate) => {
        const { data: workshopData } =
          await this.getAllWoodOutForWorkshopForADay({
            workshopId: workshop.id,
            date: dayDate,
          });

        const dayOutput = {
          date: dayDate,
          woods: [],
        };

        woodClasses.forEach((woodClass) => {
          const workshopDataByWoodClass = workshopData.filter(
            (workshopDataItem) => workshopDataItem.woodClassId !== woodClass.id,
          );

          const totalVolume = workshopDataByWoodClass.reduce(
            (total, workshopRecord) =>
              total + workshopRecord.dimension.volume * workshopRecord.amount,
            0,
          );

          const currentWoodClassVolume = workshopDataByWoodClass.reduce(
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

          const percentageForCurrentWoodClassFromTotalVolume =
            (currentWoodClassVolume / totalVolume) * 100;

          dayOutput.woods.push({
            name: woodClass.name,
            percentage: Number(
              percentageForCurrentWoodClassFromTotalVolume.toFixed(2),
            ),
          });
        });

        workshopOutput.push(dayOutput);
      }),
    );

    workshopOutput = workshopOutput.sort((a, b) => {
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

    return workshopOutput;
  }

  async getProducedWoodStats({
    startDate,
    endDate,
  }: {
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

    const woodClasses = await this.woodClassService.getAllWoodClasses();

    const workshopOuts = await this.workshopOutRepository.findAll({
      include: [WoodClass, WoodType, Dimension],
      attributes: {
        exclude: ['workshopId', 'woodClassId', 'woodTypeId', 'dimensionId'],
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

    const sunburstData = [];
    let totalVolume = 0;

    if (!workshopOuts || !workshopOuts.length) {
      return {
        sunburstData: [],
        totalVolume: 0,
      };
    }

    woodClasses.forEach((woodClass) => {
      const workshopOutsByWoodClass = workshopOuts.filter(
        (woodArrival) => woodArrival.woodClass.id === woodClass.id,
      );

      const woodClassName = woodClass.name;

      const sunburstItem = {
        name: woodClassName,
        children: [],
      };

      workshopOutsByWoodClass.forEach((workshopOut) => {
        const dimensionString = `${workshopOut.dimension.width}x${workshopOut.dimension.thickness}x${workshopOut.dimension.length}`;
        const volume = Number(
          (workshopOut.dimension.volume * workshopOut.amount).toFixed(4),
        );

        const sunburstDataWithSameParams = sunburstItem.children.find(
          (item) => item.name === dimensionString,
        );

        if (sunburstDataWithSameParams) {
          sunburstDataWithSameParams.size =
            sunburstDataWithSameParams.size + volume;

          sunburstDataWithSameParams.size = Number(
            sunburstDataWithSameParams.size.toFixed(4),
          );
        } else {
          const dataByDimensions = {
            name: dimensionString,
            size: volume,
          };

          sunburstItem.children.push(dataByDimensions);
        }

        totalVolume += workshopOut.dimension.volume * workshopOut.amount;
      });

      sunburstData.push(sunburstItem);
    });

    return {
      sunburstData,
      totalVolume: Number(totalVolume.toFixed(4)),
    };
  }

  async getProfitStatsByTimespan({
    workshopId,
    startDate,
    endDate,
    isPerUnitSearch,
  }: {
    workshopId: number;
    startDate: string;
    endDate: string;
    isPerUnitSearch: boolean;
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
    const now = momentStartDate.clone();

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

    const workshopOuts = await this.getAllWoodOutForWorkshopForMultipleDays({
      workshopId,
      startDate,
      endDate,
    });

    const workshopWoodPrices = workshop.workshopWoodPrices;

    let output = [];

    workshopOuts.forEach((workshopOut) => {
      const volume = workshopOut.dimension.volume * workshopOut.amount;

      const currentWoodPrice = workshopWoodPrices.find(
        (workshopWoodPrice) =>
          workshopWoodPrice.dimensionId === workshopOut.dimension.id &&
          workshopWoodPrice.woodClassId === workshopOut.woodClass.id,
      );

      if (!currentWoodPrice) {
        return;
      }

      const totalWoodPrice = currentWoodPrice.price * volume;
      const priceOfRawMaterials = workshop.priceOfRawMaterials * volume;
      const sawingPrice = workshop.sawingPrice * volume;

      const profit = Number(
        (totalWoodPrice - priceOfRawMaterials - sawingPrice).toFixed(2),
      );

      const existentOutItem = output.find((item) => {
        const momentItemDate = moment(item.x);
        const momentWorkshopOutDate = moment(workshopOut.date);

        const itemYear = momentItemDate.year();
        const itemMonth = momentItemDate.month() + 1;
        const itemDay = momentItemDate.date();

        const workshopOutYear = momentWorkshopOutDate.year();
        const workshopOutMonth = momentWorkshopOutDate.month() + 1;
        const workshopOutDay = momentWorkshopOutDate.date();

        return (
          itemYear === workshopOutYear &&
          itemMonth === workshopOutMonth &&
          itemDay === workshopOutDay
        );
      });

      if (!existentOutItem) {
        output.push({
          x: workshopOut.date,
          y: profit,
          volume,
          totalWoodPrice,
          priceOfRawMaterials,
          sawingPrice,
          amount: workshopOut.amount,
        });

        return;
      }

      existentOutItem.y += profit;
      existentOutItem.totalWoodPrice += totalWoodPrice;
      existentOutItem.priceOfRawMaterials += priceOfRawMaterials;
      existentOutItem.sawingPrice += sawingPrice;
      existentOutItem.amount += workshopOut.amount;
    });

    output = output
      .sort((a, b) => {
        const momentFirstDate = moment(a.x);
        const momentSecondDate = moment(b.x);

        const difference = momentFirstDate.diff(momentSecondDate, 'days');

        if (difference > 1) {
          return 1;
        }

        if (difference < 0) {
          return -1;
        }

        return 0;
      })
      .map((item) => {
        let profit = item.y;

        if (isPerUnitSearch) {
          profit = Number((item.y / item.volume).toFixed(2));
        }

        return {
          x: item.x,
          y: profit,
        };
      });

    return output;
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
    const now = momentStartDate.clone();

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
          await this.beanInService.getAllBeamInForWorkshop({
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

        outputItem.id = moment(dayDate).date() + moment(dayDate).month();
        outputItem.date = dayDate;
        outputItem.woodNaming = woodNamingOfTheDay;
        outputItem.dimension = dimensionOfTheDay;

        // Важное условие для второго цеха
        outputItem.totalBeamInVolume =
          workshop.name === 'Цех 2'
            ? totalWorkshopOutVolume * 2
            : totalBeamInVolume;
        outputItem.totalWorkshopOutPercentage = totalWorkshopOutPercentage;

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

          const percentageForCurrentWoodClassFromTotalVolume =
            (currentWoodClassVolume / totalBeamInVolume) * 100;

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
}
