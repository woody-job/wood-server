import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Dimension } from './dimension.model';
import { WoodClassService } from 'src/wood-class/wood-class.service';
import { CreateDimensionDto } from './dtos/create-dimension.dto';
import { WoodClass } from 'src/wood-class/wood-class.model';

@Injectable()
export class DimensionService {
  constructor(
    @InjectModel(Dimension) private dimensionRepository: typeof Dimension,
    private woodClassService: WoodClassService,
  ) {}

  async fixDimensions() {
    // do this only once
    const dimensions = await this.dimensionRepository.findAll();

    Promise.all(
      dimensions.map((dimension) => {
        dimension.volume =
          (dimension.width / 1000) *
          (dimension.thickness / 1000) *
          dimension.length;

        return dimension.save();
      }),
    );
  }

  async createDimension(dimensionDto: CreateDimensionDto) {
    const { woodClassId, width, thickness, length } = dimensionDto;

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      throw new HttpException('Сорт не найден', HttpStatus.NOT_FOUND);
    }

    const existentDimension = await this.dimensionRepository.findOne({
      where: {
        width,
        thickness,
        length,
        woodClassId,
      },
    });

    if (existentDimension) {
      throw new HttpException(
        'Такие размеры для выбранного сорта уже существуют',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dimension = await this.dimensionRepository.create({
      width,
      thickness,
      length,
      volume: (width / 1000) * (thickness / 1000) * length,
    });

    await dimension.$set('woodClass', woodClassId);
    dimension.woodClass = woodClass;

    return dimension;
  }

  async updateDimension(dimensionId: number, dimensionDto: CreateDimensionDto) {
    const { woodClassId, width, thickness, length } = dimensionDto;

    const woodClass =
      await this.woodClassService.findWoodClassById(woodClassId);

    if (!woodClass) {
      throw new HttpException('Сорт не найден', HttpStatus.NOT_FOUND);
    }

    const dimension = await this.dimensionRepository.findByPk(dimensionId);

    if (!dimension) {
      throw new HttpException('Сечение не найдено', HttpStatus.NOT_FOUND);
    }

    dimension.width = width;
    dimension.thickness = thickness;
    dimension.length = length;

    const existentDimensionWithNewParams =
      await this.dimensionRepository.findOne({
        where: {
          width,
          thickness,
          length,
          woodClassId,
        },
      });

    if (existentDimensionWithNewParams) {
      throw new HttpException(
        'Такие размеры для выбранного сорта уже существуют',
        HttpStatus.BAD_REQUEST,
      );
    }

    dimension.volume = (width / 1000) * (thickness / 1000) * length;

    if (woodClassId !== dimension.woodClassId) {
      dimension.$set('woodClass', woodClassId);
    }

    await dimension.save();

    return dimension;
  }

  async getAllDimensions() {
    const dimensions = await this.dimensionRepository.findAll({
      include: [WoodClass],
      attributes: {
        exclude: ['woodClassId'],
      },
    });

    return dimensions;
  }

  async getDimensionsByWoodClass(woodClassId: number) {
    const dimensions = await this.dimensionRepository.findAll({
      where: {
        woodClassId,
      },
      include: [WoodClass],
      attributes: {
        exclude: ['woodClassId'],
      },
    });

    return dimensions;
  }

  async deleteDimension(dimensionId: number) {
    const dimension = await this.dimensionRepository.findByPk(dimensionId);

    if (!dimension) {
      throw new HttpException('Сечение не найдено', HttpStatus.NOT_FOUND);
    }

    await dimension.destroy();
  }

  async findDimensionById(dimensionId: number) {
    const dimension = await this.dimensionRepository.findByPk(dimensionId);

    return dimension;
  }
}
