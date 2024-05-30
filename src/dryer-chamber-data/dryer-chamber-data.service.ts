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

    const dryerChamberDatas = await this.dryerChamberDataRepository.findOne({
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

    return dryerChamberDatas;
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

    const woodTypes = await this.woodTypeService.getAllWoodTypes();
    const woodClasses = await this.woodClassService.getAllWoodClasses();

    let totalVolume = 0;

    const outputSunburstData = woodTypes.map((woodType) => {
      const dryerChamberDatasByWoodType = dryerChamberDatas.filter(
        (warehouseRecord) => warehouseRecord.woodType.id === woodType.id,
      );

      return {
        name: woodType.name,
        children: woodClasses.map((woodClass) => {
          const dryerChamberDatasByWoodClass =
            dryerChamberDatasByWoodType.filter(
              (warehouseRecord) =>
                warehouseRecord.woodClass.id === woodClass.id,
            );

          const dimensionOutput = {
            name: woodClass.name,
            children: [],
          };

          dryerChamberDatasByWoodClass.forEach((warehouseRecord) => {
            const dimensionString = `${warehouseRecord.dimension.width}x${warehouseRecord.dimension.thickness}x${warehouseRecord.dimension.length}`;
            const volume = Number(
              (
                warehouseRecord.dimension.volume * warehouseRecord.amount
              ).toFixed(4),
            );

            totalVolume += volume;

            const existentWoodClassOutputChild = dimensionOutput.children.find(
              (child) => child.name === dimensionString,
            );

            if (existentWoodClassOutputChild) {
              existentWoodClassOutputChild.size = Number(
                (existentWoodClassOutputChild.size + volume).toFixed(2),
              );
            } else {
              dimensionOutput.children.push({
                name: dimensionString,
                size: volume,
              });
            }
          });

          return dimensionOutput;
        }),
      };
    });

    return {
      sunburstData: outputSunburstData,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async getAllRecords() {
    const dryerChamberDatas = await this.dryerChamberDataRepository.findAll();

    return dryerChamberDatas;
  }

  async bringWoodInChamber(
    dryerChamberId: number,
    dryerChamberDataDto: CreateDryerChamberDataDto,
  ) {
    const { dimensionId, woodClassId, woodTypeId, date, amount } =
      dryerChamberDataDto;

    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
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

    const dryerChamberData = await this.dryerChamberDataRepository.create({
      date,
      amount,
      isDrying: true,
      isTakenOut: false,
    });

    // Цикл сушильной камеры обновляется при
    // занесении доски.
    dryerChamber.chamberIterationCount = dryerChamber.chamberIterationCount + 1;

    await dryerChamber.save();

    await dryerChamberData.$set('woodClass', woodClassId);
    dryerChamberData.woodClass = woodClass;

    await dryerChamberData.$set('woodType', woodTypeId);
    dryerChamberData.woodType = woodType;

    await dryerChamberData.$set('dimension', dimensionId);
    dryerChamberData.dimension = dimension;

    await dryerChamberData.$set('dryerChamber', dryerChamberId);
    dryerChamberData.dryerChamber = dryerChamber;

    const wetWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сырая');

    if (!wetWoodCondition) {
      throw new HttpException(
        "Состояния доски 'Сырая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
    }

    // Внести запись об отгрузках сырой доски
    await this.woodShipmentService.createWoodShipment(
      {
        date,
        woodConditionId: wetWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
        amount: amount,
      },
      { avoidDirectWarehouseChange: true },
    );

    // Убрать со склада сырую доску
    const existentWarehouseRecord =
      await this.warehouseService.findWarehouseRecordByWoodParams({
        woodConditionId: wetWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });

    // Если записи на складе нет (чего быть не должно), то мы просто ничего не делаем со складом
    if (existentWarehouseRecord) {
      await this.warehouseService.updateWarehouseRecord({
        amount: existentWarehouseRecord.amount - dryerChamberData.amount,
        woodConditionId: wetWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });
    }

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

    const dryerChamberData = await this.dryerChamberDataRepository.findOne({
      where: {
        dryerChamberId,
        isDrying: true,
      },
    });

    if (!dryerChamberData) {
      throw new HttpException(
        'Для данной сушильной камеры нет записи о внесенной доске. Невозможно убрать.',
        HttpStatus.NOT_FOUND,
      );
    }

    dryerChamberData.isDrying = false;
    dryerChamberData.isTakenOut = true;

    await dryerChamberData.save();

    // Внести на склад сухую доску
    const dryWoodCondition =
      await this.woodConditionService.findWoodConditionByName('Сухая');

    if (!dryWoodCondition) {
      throw new HttpException(
        "Состояния доски 'Сухая' нет в базе",
        HttpStatus.NOT_FOUND,
      );
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
    } else {
      await this.warehouseService.updateWarehouseRecord({
        amount: existentWarehouseRecord.amount + dryerChamberData.amount,
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });
    }

    // Добавить запись в поступления (сухая доска)
    const existentWoodArrival =
      await this.woodArrivalService.findWoodArrivalByWoodParams({
        date: dryerChamberData.date,
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });

    if (!existentWoodArrival) {
      await this.woodArrivalService.createWoodArrival(
        {
          date: dryerChamberData.date,
          woodConditionId: dryWoodCondition.id,
          woodClassId: dryerChamberData.woodClassId,
          woodTypeId: dryerChamberData.woodTypeId,
          dimensionId: dryerChamberData.dimensionId,
          amount: dryerChamberData.amount,
        },
        { avoidDirectWarehouseChange: true },
      );
    } else {
      await this.woodArrivalService.editWoodArrival(
        existentWoodArrival.id,
        {
          // Если в текущий день уже есть поступления сырой доски с такими параметрами,
          // то новая запись в поступлениях не создается, просто увеличивается его число
          amount: existentWoodArrival.amount + dryerChamberData.amount,
          woodClassId: dryerChamberData.woodClassId,
          dimensionId: dryerChamberData.dimensionId,
        },
        { avoidDirectWarehouseChange: true },
      );
    }

    return dryerChamberData;
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

  async getChamberData(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberService.findDryerChamberById(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Выбранная сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const dryerChamberData =
      await this.getDryingWoodByDryerChamberId(dryerChamberId);

    if (!dryerChamberData) {
      return {
        data: [],
        total: 0,
      };
    }

    const dimensionString = dryerChamberData
      ? `${dryerChamberData.dimension.width}x${dryerChamberData.dimension.thickness}x${dryerChamberData.dimension.length}`
      : '';
    const dimensionVolume = dryerChamberData
      ? Number(
          (dryerChamberData.dimension.volume * dryerChamberData.amount).toFixed(
            4,
          ),
        )
      : 0;

    const woodClass = await this.woodClassService.findWoodClassById(
      dryerChamberData.woodClass.id,
    );

    const data = {
      name: woodClass.name,
      children: [
        {
          name: dimensionString,
          size: dimensionVolume,
        },
      ],
    };

    return {
      data: dryerChamberData && woodClass ? [data] : [],
      total: dimensionVolume,
    };
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
}
