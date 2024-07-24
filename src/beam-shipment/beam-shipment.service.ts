import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamShipment } from './beam-shipment.model';
import { BuyerService } from 'src/buyer/buyer.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { CreateBeamShipmentDto } from './dtos/create-beam-shipment.dto';
import { UpdateBeamShipmentDto } from './dtos/update-beam-shipment.dto';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { Buyer } from 'src/buyer/buyer.model';
import { WoodType } from 'src/wood-type/wood-type.model';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment-timezone';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamWarehouseService } from 'src/beam-warehouse/beam-warehouse.service';
import { BeamWarehouseErrorsType } from 'src/types';

@Injectable()
export class BeamShipmentService {
  constructor(
    @InjectModel(BeamShipment)
    private beamShipmentRepository: typeof BeamShipment,
    private buyerService: BuyerService,
    private woodNamingService: WoodNamingService,
    private woodTypeService: WoodTypeService,
    private beamSizeService: BeamSizeService,
    private beamWarehouseService: BeamWarehouseService,
  ) {}

  async updateWarehouse({
    woodNaming,
    volume,
    action = 'add',
    errorMessages,
  }: {
    woodNaming: WoodNaming;
    volume: number;
    action?: 'add' | 'subtract';
    errorMessages: BeamWarehouseErrorsType;
  }) {
    const existentWarehouseRecord =
      await this.beamWarehouseService.findWarehouseRecordByBeamParams({
        woodNamingId: woodNaming.id,
      });

    if (!existentWarehouseRecord) {
      return errorMessages.noSuchRecord({
        woodNaming: woodNaming.name.toLowerCase(),
      });
    }

    let newVolume = Number(existentWarehouseRecord.volume);

    if (action === 'add') {
      newVolume = Number(existentWarehouseRecord.volume) + volume;
    }

    if (action === 'subtract') {
      newVolume = Number(existentWarehouseRecord.volume) - volume;

      if (newVolume < 0) {
        return errorMessages.notEnoughVolume({
          warehouseVolume: existentWarehouseRecord.volume,
          newRecordVolume: Number(volume).toFixed(4),
          woodNaming: woodNaming.name.toLocaleLowerCase(),
        });
      }
    }

    await this.beamWarehouseService.updateWarehouseRecord({
      volume: newVolume,
      woodNamingId: woodNaming.id,
    });
  }

  async createBeamShipment({
    beamShipmentDto,
    buyer,
    woodType,
  }: {
    beamShipmentDto: CreateBeamShipmentDto;
    buyer: Buyer | null;
    woodType: WoodType | null;
  }) {
    const { date, buyerId, woodTypeId, volume, length, beamSizeId, amount } =
      beamShipmentDto;

    if (!volume && !beamSizeId && !amount) {
      // Хотя бы один вариант (volume - для баланса, beamSizeId & amount - для пиловочника) должен присутствовать
      return `Для записи отгрузки не были предоставлены объем или диаметр с количеством. Запись не была создана`;
    }

    let foundBeamSize = null;

    if (beamSizeId) {
      const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

      if (!beamSize) {
        // Размер леса не найден
        return `Выбранный размер леса не найден. Запись об отгрузке не была создана`;
      }

      foundBeamSize = beamSize;
    }

    const correspondingWoodNaming =
      await this.woodNamingService.findWoodNamingByBeamParams({
        length: length,
        woodTypeId,
        // 14см - максимальный диаметр баланса
        diameter: foundBeamSize ? foundBeamSize.diameter : 14,
      });

    if (!correspondingWoodNaming) {
      // Условное обозначение с выбранными параметрами не найдено
      return `Для выбранного диаметра (${foundBeamSize.diameter} см), 
      породы (${woodType.name.toLowerCase()}) и длины (${length} м) нет условного обозначения. Запись об отгрузке не была создана.`;
    }

    // Объем считается по-разному, в зависимости от того, создается ли запись баланса или пиловочника
    const totalRecordVolume = !beamSizeId
      ? volume
      : foundBeamSize.volume * amount;

    // Убрать бревна со склада сырья
    const warehouseError = await this.updateWarehouse({
      woodNaming: correspondingWoodNaming,
      action: 'subtract',
      volume: totalRecordVolume,
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись об отгрузке не была создана`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Создать запись об отгрузке ${newRecordVolume} м3 леса невозможно.`,
      },
    });

    if (warehouseError) {
      return warehouseError;
    }

    const beamShipment = await this.beamShipmentRepository.create({
      date,
      ...(amount ? { amount } : {}),
      volume: Number(totalRecordVolume.toFixed(4)),
    });

    if (beamSizeId) {
      await beamShipment.$set('beamSize', beamSizeId);
      beamShipment.beamSize = foundBeamSize;
    }

    if (buyerId) {
      await beamShipment.$set('buyer', buyerId);
      beamShipment.buyer = buyer;
    }

    await beamShipment.$set('woodType', woodTypeId);
    beamShipment.woodType = woodType;

    await beamShipment.$set('woodNaming', correspondingWoodNaming.id);
    beamShipment.woodNaming = correspondingWoodNaming;
  }

  async createBeamShipments(beamShipmentDtos: CreateBeamShipmentDto[]) {
    if (beamShipmentDtos.length === 0) {
      return [];
    }

    const { buyerId, woodTypeId } = {
      buyerId: beamShipmentDtos[0].buyerId,
      woodTypeId: beamShipmentDtos[0].woodTypeId,
    };

    const buyer = buyerId
      ? await this.buyerService.findBuyerById(buyerId)
      : null;

    if (buyerId && !buyer) {
      throw new HttpException(
        'Выбранный покупатель не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранное сечение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    // Проверка на наличие условного обозначения с необходимым диапазоном диаметров
    const errors = (
      await Promise.all(
        beamShipmentDtos.map(async (beamShipmentDto) => {
          return await this.createBeamShipment({
            beamShipmentDto,
            buyer,
            woodType,
          });
        }),
      )
    ).filter((error) => error !== undefined && error !== null);

    if (errors.length !== 0) {
      return errors;
    }

    return [];
  }

  async editBeamShipment(
    beamShipmentId: number,
    beamShipmentDto: UpdateBeamShipmentDto,
  ) {
    const beamShipment = await this.beamShipmentRepository.findByPk(
      beamShipmentId,
      { include: [BeamSize, WoodNaming] },
    );

    if (!beamShipment) {
      throw new HttpException(
        'Выбранныя отгрузка сырья не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const { amount, volume } = beamShipmentDto;

    const oldBeamShipmentVolume = beamShipment.volume;

    if (!amount && !volume) {
      throw new HttpException(
        'Один из параметров (количество или объем) должен присутствовать в теле',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (amount) {
      beamShipment.amount = amount;
      beamShipment.volume = Number(
        (amount * beamShipment.beamSize.volume).toFixed(4),
      );
    }

    if (volume) {
      beamShipment.volume = volume;
    }

    // Обновить запись на складе сырья
    let newVolume = oldBeamShipmentVolume;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldBeamShipmentVolume > beamShipment.volume) {
      newVolume = oldBeamShipmentVolume - beamShipment.volume;
      action = 'add';
    }

    if (oldBeamShipmentVolume < beamShipment.volume) {
      newVolume = beamShipment.volume - oldBeamShipmentVolume;
      action = 'subtract';
    }

    const warehouseError = await this.updateWarehouse({
      woodNaming: beamShipment.woodNaming,
      action,
      volume: newVolume,
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись об отгрузке не была изменена`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Изменить запись об отгрузке на ${newRecordVolume} м3 невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

    await beamShipment.save();

    return beamShipment;
  }

  async getAllBeamShipments({
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

    const now = momentStartDate.clone();
    const days = [];

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

    const beamShipments = await this.beamShipmentRepository.findAll({
      include: [Buyer, WoodNaming, WoodType, BeamSize],
      attributes: {
        exclude: ['buyerId', 'woodNamingId', 'woodTypeId', 'beamSizeId'],
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

    let totalVolume = 0;

    beamShipments.forEach((beamShipment) => {
      totalVolume += beamShipment.volume;
    });

    return {
      data: beamShipments,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async getBeamShipmentStatsForDay({ date }: { date: string }) {
    if (!date) {
      throw new HttpException(
        'Query параметр date обязателен для запроса',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.getAllBeamShipments({ startDate: date, endDate: date });
  }

  async deleteBeamShipment(beamShipmentId: number) {
    const beamShipment = await this.beamShipmentRepository.findByPk(
      beamShipmentId,
      { include: [BeamSize, WoodNaming] },
    );

    if (!beamShipment) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Изменить запись на складе
    const warehouseError = await this.updateWarehouse({
      woodNaming: beamShipment.woodNaming,
      action: 'add',
      volume: beamShipment.volume,
      errorMessages: {
        noSuchRecord: ({ woodNaming }) =>
          `На складе нет леса "${woodNaming}". Запись об отгрузке не была удалена`,
        notEnoughVolume: ({ warehouseVolume, newRecordVolume, woodNaming }) =>
          `На складе есть только ${warehouseVolume} м3 выбранного леса "${woodNaming}". 
            Удалить запись об отгрузке ${newRecordVolume} м3 леса невозможно.`,
      },
    });

    if (warehouseError) {
      throw new HttpException(warehouseError, HttpStatus.BAD_REQUEST);
    }

    await beamShipment.destroy();
  }

  async deleteAllBeamShipment() {
    await this.beamShipmentRepository.truncate({ cascade: true });
  }
}
