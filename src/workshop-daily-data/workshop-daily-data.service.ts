import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkshopDailyData } from './workshop-daily-data.model';
import { WorkshopService } from 'src/workshop/workshop.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { CreateWorkshopDailyDataDto } from './dtos/create-workshop-daily-data.dto';
import { Op, Sequelize } from 'sequelize';

import * as moment from 'moment';
import { DimensionService } from 'src/dimension/dimension.service';
import { WorkshopOutService } from 'src/workshop-out/workshop-out.service';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

@Injectable()
export class WorkshopDailyDataService {
  constructor(
    @InjectModel(WorkshopDailyData)
    private workshopDailyDataRepository: typeof WorkshopDailyData,
    private workshopService: WorkshopService,
    private woodNamingService: WoodNamingService,
    private dimensionService: DimensionService,
    private workshopOutService: WorkshopOutService,
  ) {}

  async setWorkshopDailyData(workshopDailyDataDto: CreateWorkshopDailyDataDto) {
    const { date, woodNamingId, workshopId, dimensionId } =
      workshopDailyDataDto;

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
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

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    // Лес и сечения дня можно менять у любого дня
    const existentWorkshopDailyData =
      await this.workshopDailyDataRepository.findOne({
        where: {
          [Op.and]: Sequelize.where(
            Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
            Op.eq,
            `${year}-${month}-${day}`,
          ),
          workshopId,
        },
      });

    if (existentWorkshopDailyData) {
      await existentWorkshopDailyData.$set('woodNaming', woodNamingId);
      existentWorkshopDailyData.woodNaming = woodNaming;

      await existentWorkshopDailyData.$set('dimension', dimensionId);
      existentWorkshopDailyData.dimension = dimension;

      return existentWorkshopDailyData;
    }

    const workshopDailyData = await this.workshopDailyDataRepository.create({
      date,
    });

    await workshopDailyData.$set('woodNaming', woodNamingId);
    workshopDailyData.woodNaming = woodNaming;

    await workshopDailyData.$set('workshop', workshopId);
    workshopDailyData.workshop = workshop;

    await workshopDailyData.$set('dimension', dimensionId);
    workshopDailyData.dimension = dimension;

    return workshopDailyData;
  }

  async getAllWorkshopDailyData() {
    const workshopDailyDatas = await this.workshopDailyDataRepository.findAll();

    return workshopDailyDatas;
  }

  async deleteWorkshopDailyData(workshopDailyDataId: number) {
    const workshopDailyData =
      await this.workshopDailyDataRepository.findByPk(workshopDailyDataId);

    if (!workshopDailyData) {
      throw new HttpException(
        'Выбранная запись о работе цеха не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await workshopDailyData.destroy();
  }

  async getDailyStatsForWorkshop(workshopId: number, date: string) {
    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
    }

    const momentDate = moment(date);

    const year = momentDate.year();
    const month = momentDate.month() + 1;
    const day = momentDate.date();

    const workshopDailyData = await this.workshopDailyDataRepository.findOne({
      include: [Dimension, WoodNaming],
      attributes: {
        exclude: ['dimensionId', 'woodNamingId'],
      },
      where: {
        [Op.and]: Sequelize.where(
          Sequelize.fn('date_trunc', 'day', Sequelize.col('date')),
          Op.eq,
          `${year}-${month}-${day}`,
        ),
        workshopId,
      },
    });

    const { data: workshopOutsForDate } =
      await this.workshopOutService.getAllWoodOutForWorkshopForADay({
        workshopId,
        date,
      });

    const workshopWoodPrices = workshop.workshopWoodPrices;

    const output = {
      // Выручка
      totalWoodPrice: 0,
      // Сырье
      priceOfRawMaterials: 0,
      // Распиловка
      sawingPrice: 0,
      // Итог
      profit: 0,
      // Итог на м3
      profitPerUnit: 0,
      // Сечение дня
      dimensionOfTheDay:
        workshopDailyData && workshopDailyData.dimension
          ? `${workshopDailyData.dimension.width}x${workshopDailyData.dimension.thickness}x${workshopDailyData.dimension.length}`
          : null,
      // Лес дня (условное обозначение)
      woodNamingOfTheDay:
        workshopDailyData && workshopDailyData.woodNaming
          ? workshopDailyData.woodNaming.name
          : null,
    };

    let totalVolume = 0;

    workshopOutsForDate.forEach((workshopOut) => {
      const volume = workshopOut.dimension.volume * workshopOut.amount;

      const currentWoodPrice = workshopWoodPrices.find(
        (workshopWoodPrice) =>
          workshopWoodPrice.dimensionId === workshopOut.dimension.id &&
          workshopWoodPrice.woodClassId === workshopOut.woodClass.id,
      );

      if (!currentWoodPrice) {
        return;
      }

      output.totalWoodPrice += currentWoodPrice.price * volume;
      output.priceOfRawMaterials += workshop.priceOfRawMaterials * volume;
      output.sawingPrice += workshop.sawingPrice * volume;

      totalVolume += volume;
    });

    output.profit =
      output.totalWoodPrice - output.priceOfRawMaterials - output.sawingPrice;
    output.profitPerUnit = output.profit / totalVolume;

    return {
      totalWoodPrice: Number(output.totalWoodPrice.toFixed(2)),
      priceOfRawMaterials: Number(output.priceOfRawMaterials.toFixed(2)),
      sawingPrice: Number(output.sawingPrice.toFixed(2)),
      profit: Number(output.profit.toFixed(2)),
      profitPerUnit: output.profitPerUnit
        ? Number(output.profitPerUnit.toFixed(2))
        : 0,
      dimensionOfTheDay: output.dimensionOfTheDay,
      woodNamingOfTheDay: output.woodNamingOfTheDay,
    };
  }
}
