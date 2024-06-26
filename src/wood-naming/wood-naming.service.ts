import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WoodNaming } from './wood-naming.model';
import { CreateWoodNamingDto } from './dtos/create-wood-naming.dto';

@Injectable()
export class WoodNamingService {
  constructor(
    @InjectModel(WoodNaming)
    private woodNamingRepository: typeof WoodNaming,
  ) {}

  async createWoodNaming(woodNamingDto: CreateWoodNamingDto) {
    const existingWoodNaming = await this.woodNamingRepository.findOne({
      where: { name: woodNamingDto.name },
    });

    if (existingWoodNaming) {
      throw new HttpException(
        'Условное обозначение с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodNaming = await this.woodNamingRepository.create(woodNamingDto);

    return woodNaming;
  }

  async updateWoodNaming(woodNamingId, woodNamingDto: CreateWoodNamingDto) {
    const woodNaming = await this.woodNamingRepository.findByPk(woodNamingId);

    if (!woodNaming) {
      throw new HttpException(
        'Выбранное условное обозначение не найдено',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingWoodNaming = await this.woodNamingRepository.findOne({
      where: { name: woodNamingDto.name },
    });

    if (existingWoodNaming) {
      throw new HttpException(
        'Условное обозначение с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    woodNaming.name = woodNamingDto.name;
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
    const woodNamings = await this.woodNamingRepository.findAll();

    return woodNamings;
  }

  async findWoodNamingById(woodNamingId: number) {
    const woodNaming = await this.woodNamingRepository.findByPk(woodNamingId);

    return woodNaming;
  }
}
