import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamWarehouse } from './beam-warehouse.model';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { BeamSizeService } from 'src/beam-size/beam-size.service';
import { CreateBeamWarehouseRecordDto } from './dtos/create-beam-warehouse-record.dto';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { BeamSize } from 'src/beam-size/beam-size.model';

@Injectable()
export class BeamWarehouseService {
  constructor(
    @InjectModel(BeamWarehouse)
    private beamWarehouseRepository: typeof BeamWarehouse,
    private woodNamingService: WoodNamingService,
    private beamSizeService: BeamSizeService,
    private woodTypeService: WoodTypeService,
  ) {}

  async createWarehouseRecord(
    warehouseRecordDto: CreateBeamWarehouseRecordDto,
  ) {
    const { woodNamingId, beamSizeId, amount, volume } = warehouseRecordDto;

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

    if (beamSizeId && !beamSize) {
      throw new HttpException(
        'Выбранный размер леса (диаметр) не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    // Если запись склада с предоставленными параметрами бревна уже существует,
    // то просто увеличивается ее количество или объем (пиловочник/баланс)
    const existingWarehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        woodNamingId,
        ...(beamSizeId ? { beamSizeId } : {}),
      },
    });

    if (existingWarehouseRecord) {
      // Если запись склада с предоставленными параметрами доски уже существует,
      // то просто увеличивается ее количество или объем (пиловочник/баланс)
      if (beamSize) {
        existingWarehouseRecord.amount =
          existingWarehouseRecord.amount + amount;
      } else {
        existingWarehouseRecord.volume = Number(
          (Number(existingWarehouseRecord.volume) + volume).toFixed(4),
        );
      }

      await existingWarehouseRecord.save();

      return existingWarehouseRecord;
    }

    const warehouseRecord = await this.beamWarehouseRepository.create({
      ...(amount ? { amount } : {}),
      ...(volume ? { volume } : {}),
    });

    await warehouseRecord.$set('woodNaming', woodNamingId);
    warehouseRecord.woodNaming = woodNaming;

    if (beamSize) {
      await warehouseRecord.$set('beamSize', beamSizeId);
      warehouseRecord.beamSize = beamSize;
    }

    return warehouseRecord;
  }

  async updateWarehouseRecord(
    warehouseRecordDto: CreateBeamWarehouseRecordDto,
  ) {
    const { woodNamingId, beamSizeId, amount, volume } = warehouseRecordDto;

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const beamSize = await this.beamSizeService.findBeamSizeById(beamSizeId);

    if (beamSizeId && !beamSize) {
      throw new HttpException(
        'Выбранный размер леса (диаметр) не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    const warehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        woodNamingId,
        ...(beamSizeId ? { beamSizeId } : {}),
      },
    });

    if (!warehouseRecord) {
      throw new HttpException(
        'Выбранная запись склада не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Если новое количество <= 0, то запись на складе удаляется.
    if (amount <= 0 || volume <= 0) {
      await this.deleteWarehouseRecord(warehouseRecord.id);

      return;
    }

    if (beamSize) {
      warehouseRecord.amount = amount;
    } else {
      warehouseRecord.volume = volume;
    }

    await warehouseRecord.save();

    return warehouseRecord;
  }

  async findWarehouseRecordByBeamParams({
    beamSizeId,
    woodNamingId,
  }: {
    beamSizeId?: number;
    woodNamingId: number;
  }) {
    const warehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        ...(beamSizeId ? { beamSizeId } : {}),
        woodNamingId,
      },
      include: [WoodNaming, BeamSize],
      attributes: {
        exclude: ['woodNamingId', 'beamSizeId'],
      },
    });

    return warehouseRecord;
  }

  async getAllWarehouseRecords() {
    const warehouseRecords = await this.beamWarehouseRepository.findAll({
      include: [WoodNaming, BeamSize],
      attributes: {
        exclude: ['woodNamingId', 'beamSizeId'],
      },
      order: [['id', 'DESC']],
    });

    let totalVolume = 0;

    const output = warehouseRecords.map(
      ({ id, woodNaming, beamSize, amount, volume }) => {
        const recordVolume = beamSize
          ? Number((beamSize.volume * amount).toFixed(4))
          : volume;

        totalVolume += Number(recordVolume);

        return {
          id,
          woodNaming,
          beamSize,
          amount,
          volume: recordVolume,
        };
      },
    );

    return {
      data: output,
      totalVolume: Number(totalVolume.toFixed(4)),
    };
  }

  async getOverralWarehouseStats() {
    const woodTypes = await this.woodTypeService.getAllWoodTypes();

    let output = [];

    await Promise.all(
      woodTypes.map(async (woodType) => {
        const warehouseRecordsByWoodType =
          await this.beamWarehouseRepository.findAll({
            include: [
              { model: WoodNaming, where: { woodTypeId: woodType.id } },
              { model: BeamSize },
            ],
            attributes: {
              exclude: ['woodNamingId', 'beamSizeId'],
            },
          });

        const totalVolume = warehouseRecordsByWoodType.reduce(
          (total, warehouseRecord) => {
            const volume = warehouseRecord.beamSize
              ? warehouseRecord.beamSize.volume * warehouseRecord.amount
              : Number(warehouseRecord.volume);

            return total + volume;
          },
          0,
        );

        output.push({
          woodTypeId: woodType.id,
          woodTypeName: woodType.name,
          totalVolume: Number(totalVolume.toFixed(4)),
        });
      }),
    );

    return output;
  }

  async deleteWarehouseRecord(warehouseRecordId: number) {
    const warehouseRecord =
      await this.beamWarehouseRepository.findByPk(warehouseRecordId);

    if (!warehouseRecord) {
      throw new HttpException(
        'Выбранная запись склада не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await warehouseRecord.destroy();
  }

  async deleteAllWarehouseRecords() {
    await this.beamWarehouseRepository.truncate({ cascade: true });
  }
}
