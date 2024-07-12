import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WoodNaming } from './wood-naming.model';
import { CreateWoodNamingDto } from './dtos/create-wood-naming.dto';
import { WoodTypeService } from 'src/wood-type/wood-type.service';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Op } from 'sequelize';

@Injectable()
export class WoodNamingService {
  constructor(
    @InjectModel(WoodNaming)
    private woodNamingRepository: typeof WoodNaming,
    private woodTypeService: WoodTypeService,
  ) {}

  async createWoodNaming(woodNamingDto: CreateWoodNamingDto) {
    const { name, minDiameter, maxDiameter, length, woodTypeId } =
      woodNamingDto;

    const existingWoodNaming = await this.woodNamingRepository.findOne({
      where: {
        name,
        ...(minDiameter ? { minDiameter } : {}),
        ...(maxDiameter ? { maxDiameter } : {}),
        length,
        woodTypeId,
      },
    });

    if (existingWoodNaming) {
      throw new HttpException(
        'Условное обозначение с такими параметрами уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранная порода не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const woodNaming = await this.woodNamingRepository.create({
      name,
      minDiameter,
      maxDiameter,
      length,
    });

    await woodNaming.$set('woodType', woodTypeId);
    woodNaming.woodType = woodType;

    return woodNaming;
  }

  async updateWoodNaming(
    woodNamingId: number,
    woodNamingDto: CreateWoodNamingDto,
  ) {
    const woodNaming = await this.woodNamingRepository.findByPk(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { name, minDiameter, maxDiameter, length, woodTypeId } =
      woodNamingDto;

    const existingWoodNaming = await this.woodNamingRepository.findOne({
      where: {
        name,
        minDiameter,
        maxDiameter,
        length,
        woodTypeId,
      },
    });

    if (existingWoodNaming) {
      throw new HttpException(
        'Условное обозначение с такими параметрами уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodType = await this.woodTypeService.findWoodTypeById(woodTypeId);

    if (!woodType) {
      throw new HttpException(
        'Выбранная порода не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    woodNaming.name = name;
    woodNaming.minDiameter = minDiameter;
    woodNaming.maxDiameter = maxDiameter;
    woodNaming.length = length;

    if (woodNaming.woodTypeId !== woodTypeId) {
      await woodNaming.$set('woodType', woodTypeId);
      woodNaming.woodType = woodType;
    }

    await woodNaming.save();

    return woodNaming;
  }

  async deleteWoodNaming(woodNamingId: number) {
    const woodNaming = await this.woodNamingRepository.findByPk(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Условное обозначение не найдено',
        HttpStatus.NOT_FOUND,
      );
    }

    await woodNaming.destroy();
  }

  async getAllWoodNamings() {
    const woodNamings = await this.woodNamingRepository.findAll({
      include: [WoodType],
      attributes: { exclude: ['woodTypeId'] },
      order: [['id', 'DESC']],
    });

    return woodNamings;
  }

  async findWoodNamingById(woodNamingId: number) {
    const woodNaming = await this.woodNamingRepository.findByPk(woodNamingId);

    return woodNaming;
  }

  async findWoodNamingByBeamParams({
    length,
    woodTypeId,
    diameter,
  }: {
    diameter: number;
    length: number;
    woodTypeId: number;
  }) {
    const diameterParams =
      // 14см - максимальный диаметр баланса
      diameter === 14
        ? {
            maxDiameter: {
              [Op.lte]: diameter,
            },
          }
        : {
            minDiameter: {
              [Op.lte]: diameter,
            },
            maxDiameter: {
              [Op.gte]: diameter,
            },
          };

    const woodNaming = await this.woodNamingRepository.findOne({
      where: {
        length,
        woodTypeId,
        ...diameterParams,
      },
    });

    return woodNaming;
  }
}
