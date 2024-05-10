import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
  ) {}

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
    // Добавить запись в поступления (сырая доска)
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
        date: date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
      });

    if (!existentWoodArrival) {
      await this.woodArrivalService.createWoodArrival({
        date: date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: woodClassId,
        woodTypeId: woodTypeId,
        dimensionId: dimensionId,
        amount: amount,
      });

      return;
    }

    await this.woodArrivalService.editWoodArrival(existentWoodArrival.id, {
      // Если в текущий день уже есть поступления сырой доски с такими параметрами,
      // то новая запись в поступлениях не создается, просто увеличивается его число
      amount: existentWoodArrival.amount + amount,
      woodClassId: woodClassId,
      dimensionId: dimensionId,
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
    });

    if (existentWorkshopOut) {
      existentWorkshopOut.amount = existentWorkshopOut.amount + amount;
      await existentWorkshopOut.save();

      await this.updateWoodArrivalForCreate({
        date: existentWorkshopOut.date,
        amount: existentWorkshopOut.amount,
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
      await this.woodArrivalService.createWoodArrival({
        date: workshopOut.date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: workshopOut.woodClassId,
        woodTypeId: workshopOut.woodTypeId,
        dimensionId: workshopOut.dimensionId,
        amount: workshopOut.amount,
      });
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

      await this.woodArrivalService.editWoodArrival(existentWoodArrival.id, {
        // Если в текущий день уже есть поступления сырой доски с такими параметрами,
        // то новая запись в поступлениях не создается, просто меняется его число
        amount: newAmount,
        woodClassId: workshopOut.woodClassId,
        dimensionId: workshopOut.dimensionId,
      });
    }

    return workshopOut;
  }

  async getAllWoodOutForWorkshop({
    workshopId,
    startDate,
    endDate,
  }: {
    workshopId: number;
    // startDate и endDate должны иметь только год, месяц и день. Часы и минуты
    // должны быть 0
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

    const workshopOuts = await this.workshopOutRepository.findAll({
      include: [WoodClass, WoodType, Dimension],
      attributes: {
        exclude: ['workshopId', 'woodClassId', 'woodTypeId', 'dimensionId'],
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
      order: [['date', 'DESC']],
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
  }

  async findWorkshopOutById(workshopOutId: number) {
    const workshopOut =
      await this.workshopOutRepository.findByPk(workshopOutId);

    return workshopOut;
  }
}
