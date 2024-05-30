import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DimensionService } from 'src/dimension/dimension.service';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { WoodConditionService } from 'src/wood-condition/wood-condition.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { Warehouse } from './warehouse.model';
import { CreateWarehouseRecordDto } from './dtos/create-warehouse-record.dto';
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

    // Если новое количество <= 0, то запись на складе удаляется.
    if (amount <= 0) {
      await this.deleteWarehouseRecord(warehouseRecord.id);

      return;
    }

    warehouseRecord.amount = amount;

    await warehouseRecord.save();

    return warehouseRecord;
  }

  async getAllWarehouseRecordsByWoodCondition(woodConditionId: number) {
    const woodCondition =
      await this.woodConditionService.findWoodConditionById(woodConditionId);

    if (!woodCondition) {
      throw new HttpException(
        'Выбранное состояние доски не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

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

    const woodTypes = await this.woodTypeService.getAllWoodTypes();
    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let totalVolume = 0;

    const outputSunburstData = woodTypes.map((woodType) => {
      const warehouseRecordsByWoodType = warehouseRecords.filter(
        (warehouseRecord) => warehouseRecord.woodType.id === woodType.id,
      );

      return {
        name: woodType.name,
        children: woodClasses.map((woodClass) => {
          const warehouseRecordsByWoodClass = warehouseRecordsByWoodType.filter(
            (warehouseRecord) => warehouseRecord.woodClass.id === woodClass.id,
          );

          return {
            name: woodClass.name,
            children: warehouseRecordsByWoodClass.map((warehouseRecord) => {
              const dimensionString = `${warehouseRecord.dimension.width}x${warehouseRecord.dimension.thickness}x${warehouseRecord.dimension.length}`;
              const volume = Number(
                (
                  warehouseRecord.dimension.volume * warehouseRecord.amount
                ).toFixed(4),
              );

              totalVolume += volume;

              return {
                name: dimensionString,
                size: volume,
              };
            }),
          };
        }),
      };
    });

    return {
      sunburstData: outputSunburstData,
      totalVolume: Number(totalVolume.toFixed(2)),
      oldOutput: warehouseRecords,
    };
  }

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

  async findWarehouseRecordByWoodParams({
    woodConditionId,
    woodClassId,
    woodTypeId,
    dimensionId,
  }: {
    woodConditionId: number;
    woodClassId: number;
    woodTypeId: number;
    dimensionId: number;
  }) {
    const warehouseRecord = await this.warehouseRepository.findOne({
      where: {
        woodConditionId,
        woodClassId,
        woodTypeId,
        dimensionId,
      },
    });

    return warehouseRecord;
  }

  async getOverralWarehouseStats() {
    const woodConditions =
      await this.woodConditionService.getAllWoodConditions();
    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let output = [];

    await Promise.all(
      woodConditions.map(async (woodCondition) => {
        let resultWoodConditionVolume = 0;

        const woodByWoodConditionInWarehouse =
          await this.warehouseRepository.findAll({
            where: { woodConditionId: woodCondition.id },
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
          const woodByWoodClassInWarehouse =
            woodByWoodConditionInWarehouse.filter(
              (warehouseRecord) => warehouseRecord.woodClassId === woodClass.id,
            );

          const totalVolume = woodByWoodClassInWarehouse.reduce(
            (total, warehouseRecord) =>
              total + warehouseRecord.dimension.volume * warehouseRecord.amount,
            0,
          );

          resultWoodConditionVolume += totalVolume;

          innerOutput[woodClass.name] = Number(totalVolume.toFixed(4));
        });

        output.push({
          woodConditionId: woodCondition.id,
          woodConditionName: woodCondition.name,
          sorts: innerOutput,
          totalVolume: Number(resultWoodConditionVolume.toFixed(4)),
        });
      }),
    );

    output = output.sort((a, b) => {
      if (a.woodConditionId > b.woodConditionId) {
        return 1;
      }

      if (a.woodConditionId < b.woodConditionId) {
        return -1;
      }

      return 0;
    });

    return output;
  }
}
