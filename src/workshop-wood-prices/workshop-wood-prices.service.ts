import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkshopWoodPrice } from './workshop-wood-price.model';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { DimensionService } from 'src/dimension/dimension.service';
import { WorkshopService } from 'src/workshop/workshop.service';
import { CreateWorkshopWoodPriceDto } from './dtos/create-workshop-wood-price.dto';
import { UpdateWorkshopWoodPriceDto } from './dtos/update-workshop-wood-price.dto';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';

@Injectable()
export class WorkshopWoodPricesService {
  constructor(
    @InjectModel(WorkshopWoodPrice)
    private workshopWoodPriceRepository: typeof WorkshopWoodPrice,
    private woodClassService: WoodClassService,
    private dimensionService: DimensionService,
    private workshopService: WorkshopService,
  ) {}

  async createWorkshopWoodPrice(
    workshopWoodPriceDto: CreateWorkshopWoodPriceDto,
  ) {
    const { price, workshopId, dimensionId } = workshopWoodPriceDto;

    const existentWorkshopWoodPrice =
      await this.workshopWoodPriceRepository.findOne({
        where: {
          workshopId,
          dimensionId,
        },
      });

    if (existentWorkshopWoodPrice) {
      throw new HttpException(
        'Цена для данного цеха, сечения и сорта уже существует',
        HttpStatus.BAD_REQUEST,
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

    const woodClass = await this.woodClassService.findWoodClassById(
      dimension.woodClassId,
    );

    if (!woodClass) {
      throw new HttpException('Выбранный сорт не найден', HttpStatus.NOT_FOUND);
    }

    const workshopWoodPrice = await this.workshopWoodPriceRepository.create({
      price,
    });

    await workshopWoodPrice.$set('workshop', workshopId);
    await workshopWoodPrice.$set('dimension', dimensionId);
    await workshopWoodPrice.$set('woodClass', dimension.woodClassId); // TODO: Нужно глобально избавиться от пары woodClassId | dimensionId. WoodClass есть внутри Dimension.

    workshopWoodPrice.workshop = workshop;
    workshopWoodPrice.dimension = dimension;
    workshopWoodPrice.woodClass = woodClass;

    return workshopWoodPrice;
  }

  async updateWorkshopWoodPrice(
    workshopWoodPriceId: number,
    workshopWoodPriceDto: UpdateWorkshopWoodPriceDto,
  ) {
    const { price } = workshopWoodPriceDto;

    const workshopWoodPrice =
      await this.workshopWoodPriceRepository.findByPk(workshopWoodPriceId);

    if (!workshopWoodPrice) {
      throw new HttpException(
        'Выбранная цена доски для цеха не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    workshopWoodPrice.price = price;

    await workshopWoodPrice.save();

    return workshopWoodPrice;
  }

  async getAllWorkshopWoodPricesByWorkshopId(
    workshopId: number,
    woodClassId?: number,
  ) {
    const workshop = await this.workshopService.findWorkshopById(workshopId);

    if (!workshop) {
      throw new HttpException('Выбранный цех не найден', HttpStatus.NOT_FOUND);
    }

    let extraQueryWithWoodClass: number | undefined = undefined;

    if (woodClassId !== undefined) {
      const woodClass =
        await this.woodClassService.findWoodClassById(woodClassId);

      if (!woodClass) {
        throw new HttpException(
          'Выбранный сорт не найден',
          HttpStatus.NOT_FOUND,
        );
      }

      extraQueryWithWoodClass = woodClassId;
    }

    const workshopWoodPrices = await this.workshopWoodPriceRepository.findAll({
      where: {
        workshopId,
        ...(extraQueryWithWoodClass ? { woodClassId } : {}),
      },
      include: [Dimension, WoodClass],
      attributes: {
        exclude: ['workshopId', 'dimensionId', 'woodClassId'],
      },
    });

    return workshopWoodPrices;
  }

  async findWorkshopWoodPriceByParams({
    workshopId,
    woodClassId,
    dimensionId,
  }: {
    workshopId: number;
    woodClassId: number;
    dimensionId: number;
  }) {
    const workshopWoodPrice = await this.workshopWoodPriceRepository.findOne({
      where: {
        workshopId,
        woodClassId,
        dimensionId,
      },
    });

    return workshopWoodPrice;
  }

  async deleteWorkshopWoodPrice(workshopWoodPriceId: number) {
    const workshopWoodPrice =
      await this.workshopWoodPriceRepository.findByPk(workshopWoodPriceId);

    if (!workshopWoodPrice) {
      throw new HttpException(
        'Выбранная цена доски в цехе не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await workshopWoodPrice.destroy();
  }
}
