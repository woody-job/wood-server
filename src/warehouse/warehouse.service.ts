import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DimensionService } from 'src/dimension/dimension.service';
import { DryerChamberService } from 'src/dryer-chamber/dryer-chamber.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { Warehouse } from './warehouse.model';
import { CreateWarehouseRecordDto } from './create-warehouse-record.dto';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodType } from 'src/wood-type/wood-type.model';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(Warehouse)
    private warehouseRepository: typeof Warehouse,
    private woodClassService: WoodClassService,
    private woodTypeService: WoodTypeService,
    private dimensionService: DimensionService,
    private woodConditionService: WoodConditionService,
  ) {}

  async createWarehouseRecord(warehouseRecordDto: CreateWarehouseRecordDto) {
    const { amount, woodClassId, woodTypeId, woodConditionId, dimensionId } =
      warehouseRecordDto;

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

    // Если запись склада с предоставленными параметрами доски уже существует,
    // то просто добавляется ее количество
    const existingWarehouseRecordWithProvidedParams =
      await this.warehouseRepository.findOne({
        where: {
          woodClassId,
          woodTypeId,
          woodConditionId,
          dimensionId,
        },
      });

    if (existingWarehouseRecordWithProvidedParams) {
      // Если запись склада с предоставленными параметрами доски уже существует,
      // то просто добавляется ее количество
      existingWarehouseRecordWithProvidedParams.amount =
        existingWarehouseRecordWithProvidedParams.amount + amount;

      await existingWarehouseRecordWithProvidedParams.save();

      return existingWarehouseRecordWithProvidedParams;
    }

    const warehouseRecord = await this.warehouseRepository.create({
      amount,
    });

    await warehouseRecord.$set('woodClass', woodClassId);
    warehouseRecord.woodClass = woodClass;

    await warehouseRecord.$set('woodType', woodTypeId);
    warehouseRecord.woodType = woodType;

    await warehouseRecord.$set('woodCondition', woodConditionId);
    warehouseRecord.woodCondition = woodCondition;

    await warehouseRecord.$set('dimension', dimensionId);
    warehouseRecord.dimension = dimension;

    return warehouseRecord;
  }

  async updateWarehouseRecord(warehouseRecordDto: CreateWarehouseRecordDto) {
    const { amount, woodClassId, woodTypeId, woodConditionId, dimensionId } =
      warehouseRecordDto;

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

    const warehouseRecord = await this.warehouseRepository.findOne({
      where: {
        woodClassId,
        woodTypeId,
        woodConditionId,
        dimensionId,
      },
    });

    if (!warehouseRecord) {
      throw new HttpException(
        'Выбранная запись склада не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    warehouseRecord.amount = amount;

    await warehouseRecord.save();

    return warehouseRecord;
  }

  async getAllWarehouseRecordsByWoodCondition(woodConditionId: number) {
    const warehouseRecords = await this.warehouseRepository.findAll({
      include: [WoodClass, WoodType, WoodCondition, Dimension],
      attributes: {
        exclude: [
          'woodConditionId',
          'woodClassId',
          'woodTypeId',
          'dimensionId',
        ],
      },
      where: {
        woodConditionId,
      },
    });

    return warehouseRecords;
  }

  async getAllWoodInDryers() {}

  async deleteWarehouseRecord(warehouseRecordId: number) {
    const warehouseRecord =
      await this.warehouseRepository.findByPk(warehouseRecordId);

    if (!warehouseRecord) {
      throw new HttpException(
        'Выбранная запись склада не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await warehouseRecord.destroy();
  }
}
