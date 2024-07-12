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
import * as moment from 'moment';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { BeamSize } from 'src/beam-size/beam-size.model';

@Injectable()
export class BeamShipmentService {
  constructor(
    @InjectModel(BeamShipment)
    private beamShipmentRepository: typeof BeamShipment,
    private buyerService: BuyerService,
    private woodNamingService: WoodNamingService,
    private woodTypeService: WoodTypeService,
    private beamSizeService: BeamSizeService,
  ) {}

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

      return;
    }

    let foundBeamSize = null;

    if (beamSizeId) {
      const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

      if (!beamSize) {
        // Размер леса не найден

        return;
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

      return;
    }

    // Объем считается по-разному, в зависимости от того, создается ли запись баланса или пиловочника
    const totalRecordVolume = !beamSizeId
      ? volume
      : foundBeamSize.volume * amount;

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

    return beamShipment;
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

    const createdBeamShipments = await Promise.all(
      beamShipmentDtos.map(async (beamShipmentDto) => {
        return await this.createBeamShipment({
          beamShipmentDto,
          buyer,
          woodType,
        });
      }),
    );

    return createdBeamShipments;
  }

  async editBeamShipment(
    beamShipmentId: number,
    beamShipmentDto: UpdateBeamShipmentDto,
  ) {
    const beamShipment = await this.beamShipmentRepository.findByPk(
      beamShipmentId,
      { include: [BeamSize] },
    );

    if (!beamShipment) {
      throw new HttpException(
        'Выбранныя отгрузка сырья не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const { amount, volume } = beamShipmentDto;

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
    const beamShipment =
      await this.beamShipmentRepository.findByPk(beamShipmentId);

    if (!beamShipment) {
      throw new HttpException(
        'Выбранная отгрузка не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await beamShipment.destroy();
  }

  async deleteAllBeamShipment() {
    await this.beamShipmentRepository.truncate({ cascade: true });
  }
}
