import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WoodType } from './wood-type.model';
import { CreateWoodTypeDto } from './dtos/create-wood-type.dto';

@Injectable()
export class WoodTypeService {
  constructor(
    @InjectModel(WoodType)
    private woodTypeRepository: typeof WoodType,
  ) {}

  async createWoodType(woodTypeDto: CreateWoodTypeDto) {
    const existingWoodType = await this.woodTypeRepository.findOne({
      where: { name: woodTypeDto.name },
    });

    if (existingWoodType) {
      throw new HttpException(
        'Порода с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodType = await this.woodTypeRepository.create(woodTypeDto);

    return woodType;
  }

  async deleteWoodType(woodTypeId: number) {
    const woodType = await this.woodTypeRepository.findByPk(woodTypeId);

    if (!woodType) {
      throw new HttpException('Порода не найдена', HttpStatus.NOT_FOUND);
    }

    await woodType.destroy();
  }

  async getAllWoodTypes() {
    const woodTypees = await this.woodTypeRepository.findAll();

    return woodTypees;
  }

  async findWoodTypeById(woodTypeId: number) {
    const woodType = await this.woodTypeRepository.findByPk(woodTypeId);

    return woodType;
  }
}
