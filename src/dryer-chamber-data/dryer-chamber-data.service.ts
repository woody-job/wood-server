import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

@Injectable()
export class DryerChamberDataService {
  constructor(
    @InjectModel(DryerChamberData)
    private dryerChamberDataRepository: typeof DryerChamberData,
    private dimensionService: DimensionService,
    private woodClassService: WoodClassService,
    private dryerChamberService: DryerChamberService,
    private woodTypeService: WoodTypeService,
    private woodArrivalService: WoodArrivalService,
    private woodConditionService: WoodConditionService,
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

    return dryerChamberDatas;
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

    await dryerChamberData.$set('dimension', woodClassId);
    dryerChamberData.dimension = dimension;

    await dryerChamberData.$set('dryerChamber', dryerChamberId);
    dryerChamberData.dryerChamber = dryerChamber;

    // TODO: Убрать со склада сырую доску

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

    // Добавить запись в поступления (сухая доска)
    const dryWoodCondition = await this.woodConditionService.findWoodConditionByName('Сухая')

    if (!dryWoodCondition) {
      throw new HttpException(
        "Состояния доски 'Сухая' нет в базе",
        HttpStatus.NOT_FOUND
      )
    }

    const existentWoodArrival =
      await this.woodArrivalService.findWoodArrivalByWoodParams({
        date: dryerChamberData..date,
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
      });

      if (!existentWoodArrival) {
        await this.woodArrivalService.createWoodArrival({
          date: dryerChamberData..date,
        woodConditionId: dryWoodCondition.id,
        woodClassId: dryerChamberData.woodClassId,
        woodTypeId: dryerChamberData.woodTypeId,
        dimensionId: dryerChamberData.dimensionId,
          amount: dryerChamberData.amount,
        });
  
        return;
      }
  
      await this.woodArrivalService.editWoodArrival(existentWoodArrival.id, {
        // Если в текущий день уже есть поступления сырой доски с такими параметрами,
        // то новая запись в поступлениях не создается, просто увеличивается его число
        amount: existentWoodArrival.amount + dryerChamberData.amount,
        woodClassId: dryerChamberData.woodClassId,
        dimensionId: dryerChamberData.dimensionId,
      });

    // TODO: Внести на склад сухую доску

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
}
