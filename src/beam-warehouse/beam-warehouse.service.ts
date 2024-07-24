import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamWarehouse } from './beam-warehouse.model';
import { WoodNamingService } from 'src/wood-naming/wood-naming.service';
import { CreateBeamWarehouseRecordDto } from './dtos/create-beam-warehouse-record.dto';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodTypeService } from 'src/wood-type/wood-type.service';

@Injectable()
export class BeamWarehouseService {
  constructor(
    @InjectModel(BeamWarehouse)
    private beamWarehouseRepository: typeof BeamWarehouse,
    private woodNamingService: WoodNamingService,
    private woodTypeService: WoodTypeService,
  ) {}

  async createWarehouseRecord(
    warehouseRecordDto: CreateBeamWarehouseRecordDto,
  ) {
    const { woodNamingId, volume } = warehouseRecordDto;

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    // Если запись склада с предоставленными параметрами бревна уже существует,
    // то просто увеличивается ее объем
    const existingWarehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        woodNamingId,
      },
    });

    if (existingWarehouseRecord) {
      // Если запись склада с предоставленными параметрами доски уже существует,
      // то просто увеличивается ее объем
      existingWarehouseRecord.volume = Number(
        (Number(existingWarehouseRecord.volume) + volume).toFixed(4),
      );

      await existingWarehouseRecord.save();

      return existingWarehouseRecord;
    }

    const warehouseRecord = await this.beamWarehouseRepository.create({
      volume,
    });

    await warehouseRecord.$set('woodNaming', woodNamingId);
    warehouseRecord.woodNaming = woodNaming;

    return warehouseRecord;
  }

  async updateWarehouseRecord(
    warehouseRecordDto: CreateBeamWarehouseRecordDto,
  ) {
    const { woodNamingId, volume } = warehouseRecordDto;

    const woodNaming =
      await this.woodNamingService.findWoodNamingById(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    const warehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        woodNamingId,
      },
    });

    if (!warehouseRecord) {
      throw new HttpException(
        'Выбранная запись склада не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    // Если новое количество <= 0, то запись на складе удаляется.
    // TODO: Здесь нужна проверка и оповещение пользователя
    if (volume <= 0) {
      await this.deleteWarehouseRecord(warehouseRecord.id);

      return;
    }

    warehouseRecord.volume = volume;

    await warehouseRecord.save();

    return warehouseRecord;
  }

  async findWarehouseRecordByBeamParams({
    woodNamingId,
  }: {
    woodNamingId: number;
  }) {
    const warehouseRecord = await this.beamWarehouseRepository.findOne({
      where: {
        woodNamingId,
      },
      include: [WoodNaming],
      attributes: {
        exclude: ['woodNamingId'],
      },
    });

    return warehouseRecord;
  }

  async getAllWarehouseRecords() {
    const warehouseRecords = await this.beamWarehouseRepository.findAll({
      include: [WoodNaming],
      attributes: {
        exclude: ['woodNamingId'],
      },
      order: [['id', 'DESC']],
    });

    let totalVolume = 0;

    const output = warehouseRecords.map(({ id, woodNaming, volume }) => {
      totalVolume += Number(volume);

      return {
        id,
        woodNaming,
        volume,
      };
    });

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
            ],
            attributes: {
              exclude: ['woodNamingId'],
            },
          });

        const balanceWarehouseRecordsByWoodType = [];
        const sawingWarehouseRecordsByWoodType = [];

        warehouseRecordsByWoodType.forEach((warehouseRecord) => {
          // 14см - максимальный диаметр баланса
          if (warehouseRecord.woodNaming.maxDiameter === 14) {
            balanceWarehouseRecordsByWoodType.push(warehouseRecord);

            return;
          }

          sawingWarehouseRecordsByWoodType.push(warehouseRecord);
        });

        const totalBalanceVolume = balanceWarehouseRecordsByWoodType.reduce(
          (total, warehouseRecord) => {
            const volume = Number(warehouseRecord.volume);

            return total + volume;
          },
          0,
        );

        const totalSawingVolume = sawingWarehouseRecordsByWoodType.reduce(
          (total, warehouseRecord) => {
            const volume = Number(warehouseRecord.volume);

            return total + volume;
          },
          0,
        );

        output.push({
          woodTypeId: woodType.id,
          woodTypeName: woodType.name,
          balanceVolume: Number(totalBalanceVolume.toFixed(4)),
          sawingVolume: Number(totalSawingVolume.toFixed(4)),
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
