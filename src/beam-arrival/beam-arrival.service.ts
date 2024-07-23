import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamArrival } from './beam-arrival.model';
import { SupplierService } from 'src/supplier/supplier.service';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { CreateBeamArrivalDto } from './dtos/create-beam-arrival.dto';
import { UpdateBeamArrivalDto } from './dtos/update-beam-arrival.dto';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { Supplier } from 'src/supplier/supplier.model';
import { WoodType } from 'src/wood-type/wood-type.model';

import { Op, Sequelize } from 'sequelize';
import * as moment from 'moment-timezone';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamWarehouseService } from 'src/beam-warehouse/beam-warehouse.service';

@Injectable()
export class BeamArrivalService {
  constructor(
    @InjectModel(BeamArrival)
    private beamArrivalRepository: typeof BeamArrival,
    private supplierService: SupplierService,
    private woodNamingService: WoodNamingService,
    private woodTypeService: WoodTypeService,
    private beamSizeService: BeamSizeService,
    private beamWarehouseService: BeamWarehouseService,
  ) {}

  async updateWarehouse({
    woodNamingId,
    volume,
    action = 'add',
    isCreate = false,
  }: {
    woodNamingId: number;
    volume: number;
    action?: 'add' | 'subtract';
    isCreate?: boolean;
  }) {
    if (isCreate) {
      await this.beamWarehouseService.createWarehouseRecord({
        volume,
        woodNamingId,
      });

      return;
    }

    const existentWarehouseRecord =
      await this.beamWarehouseService.findWarehouseRecordByBeamParams({
        woodNamingId,
      });

    if (!existentWarehouseRecord) {
      // TODO: Здесь нужна проверка и оповещение пользователя
      return;
    }

    let newVolume = Number(existentWarehouseRecord.volume);

    if (isCreate) {
      newVolume = Number(existentWarehouseRecord.volume) + volume;
    } else {
      if (action === 'add') {
        newVolume = Number(existentWarehouseRecord.volume) + volume;
      }

      if (action === 'subtract') {
        newVolume = Number(existentWarehouseRecord.volume) - volume;
      }
    }

    await this.beamWarehouseService.updateWarehouseRecord({
      volume: newVolume,
      woodNamingId,
    });
  }

  async createBeamArrival({
    beamArrivalDto,
    supplier,
    woodType,
  }: {
    beamArrivalDto: CreateBeamArrivalDto;
    supplier: Supplier | null;
    woodType: WoodType | null;
  }) {
    const {
      date,
      supplierId,
      deliveryMethod,
      woodTypeId,
      volume,
      length,
      beamSizeId,
      amount,
    } = beamArrivalDto;

    if (!volume && !beamSizeId && !amount) {
      // Хотя бы один вариант (volume - для баланса, beamSizeId & amount - для пиловочника) должен присутствовать
      return `Для записи поступления не были предоставлены объем или диаметр с количеством. Запись не была создана`;
    }

    let foundBeamSize = null;

    if (beamSizeId) {
      const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

      if (!beamSize) {
        // Размер леса не найден
        return `Выбранный размер леса не найден. Запись о поступлении не была создана`;
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
      породы (${woodType.name.toLowerCase()}) и длины (${length} м) нет условного обозначения. 
      Запись о поступлении не была создана.`;
    }

    // Объем считается по-разному, в зависимости от того, создается ли запись баланса или пиловочника
    const totalRecordVolume = !beamSizeId
      ? volume
      : foundBeamSize.volume * amount;

    const beamArrival = await this.beamArrivalRepository.create({
      date,
      ...(amount ? { amount } : {}),
      ...(deliveryMethod ? { deliveryMethod } : {}),
      volume: Number(totalRecordVolume.toFixed(4)),
    });

    if (beamSizeId) {
      await beamArrival.$set('beamSize', beamSizeId);
      beamArrival.beamSize = foundBeamSize;
    }

    if (supplierId) {
      await beamArrival.$set('supplier', supplierId);
      beamArrival.supplier = supplier;
    }

    await beamArrival.$set('woodType', woodTypeId);
    beamArrival.woodType = woodType;

    await beamArrival.$set('woodNaming', correspondingWoodNaming.id);
    beamArrival.woodNaming = correspondingWoodNaming;

    // Пополнить запись на складе сырья
    await this.updateWarehouse({
      woodNamingId: correspondingWoodNaming.id,
      isCreate: true,
      volume: totalRecordVolume,
    });
  }

  async createBeamArrivals(beamArrivalDtos: CreateBeamArrivalDto[]) {
    if (beamArrivalDtos.length === 0) {
      return [];
    }

    const { supplierId, woodTypeId } = {
      supplierId: beamArrivalDtos[0].supplierId,
      woodTypeId: beamArrivalDtos[0].woodTypeId,
    };

    const supplier = supplierId
      ? await this.supplierService.findSupplierById(supplierId)
      : null;

    if (supplierId && !supplier) {
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

    const errors = (
      await Promise.all(
        beamArrivalDtos.map(async (beamArrivalDto) => {
          return await this.createBeamArrival({
            beamArrivalDto,
            supplier,
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

  async editBeamArrival(
    beamArrivalId: number,
    beamArrivalDto: UpdateBeamArrivalDto,
  ) {
    const beamArrival = await this.beamArrivalRepository.findByPk(
      beamArrivalId,
      { include: [BeamSize] },
    );

    if (!beamArrival) {
      throw new HttpException(
        'Выбранныя отгрузка сырья не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const { amount, volume } = beamArrivalDto;

    const oldBeamArrivalVolume = beamArrival.volume;

    if (!amount && !volume) {
      throw new HttpException(
        'Один из параметров (количество или объем) должен присутствовать в теле',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (amount) {
      beamArrival.amount = amount;
      beamArrival.volume = Number(
        (amount * beamArrival.beamSize.volume).toFixed(4),
      );
    }

    if (volume) {
      beamArrival.volume = volume;
    }

    await beamArrival.save();

    // Обновить запись на складе сырья
    let newVolume = oldBeamArrivalVolume;
    let action: 'add' | 'subtract' = 'subtract';

    if (oldBeamArrivalVolume > beamArrival.volume) {
      newVolume = oldBeamArrivalVolume - beamArrival.volume;
      action = 'subtract';
    }

    if (oldBeamArrivalVolume < beamArrival.volume) {
      newVolume = beamArrival.volume - oldBeamArrivalVolume;
      action = 'add';
    }

    await this.updateWarehouse({
      woodNamingId: beamArrival.woodNamingId,
      action,
      volume: newVolume,
    });

    return beamArrival;
  }

  async getAllBeamArrivals({
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

    const beamArrivals = await this.beamArrivalRepository.findAll({
      include: [Supplier, WoodNaming, WoodType, BeamSize],
      attributes: {
        exclude: ['supplierId', 'woodNamingId', 'woodTypeId', 'beamSizeId'],
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

    beamArrivals.forEach((beamArrival) => {
      totalVolume += beamArrival.volume;
    });

    return {
      data: beamArrivals,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  async getBeamArrivalStatsForDay({ date }: { date: string }) {
    if (!date) {
      throw new HttpException(
        'Query параметр date обязателен для запроса',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.getAllBeamArrivals({ startDate: date, endDate: date });
  }

  async deleteBeamArrival(beamArrivalId: number) {
    const beamArrival = await this.beamArrivalRepository.findByPk(
      beamArrivalId,
      { include: [BeamSize] },
    );

    if (!beamArrival) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await beamArrival.destroy();

    // Изменить запись на складе
    await this.updateWarehouse({
      woodNamingId: beamArrival.woodNamingId,
      action: 'subtract',
      volume: beamArrival.volume,
    });
  }

  async deleteAllBeamArrival() {
    await this.beamArrivalRepository.truncate({ cascade: true });
  }
}
