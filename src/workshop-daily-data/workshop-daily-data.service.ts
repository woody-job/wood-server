import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkshopDailyData } from './workshop-daily-data.model';
import { WorkshopService } from 'src/workshop/workshop.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { CreateWorkshopDailyDataDto } from './dtos/create-workshop-daily-data.dto';
import { Op, Sequelize } from 'sequelize';

import * as moment from 'moment';
import { DimensionService } from 'src/dimension/dimension.service';

@Injectable()
export class WorkshopDailyDataService {
  constructor(
    @InjectModel(WorkshopDailyData)
    private workshopDailyDataRepository: typeof WorkshopDailyData,
    private workshopService: WorkshopService,
    private woodNamingService: WoodNamingService,
    private dimensionService: DimensionService,
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
}
