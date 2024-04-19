import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WoodClass } from './wood-class.model';
import { CreateWoodClassDto } from './dtos/create-wood-class.dto';

@Injectable()
export class WoodClassService {
  constructor(
    @InjectModel(WoodClass) private woodClassRepository: typeof WoodClass,
  ) {}

  async createWoodClass(woodClassDto: CreateWoodClassDto) {
    const existingWoodClass = await this.woodClassRepository.findOne({
      where: { name: woodClassDto.name },
    });

    if (existingWoodClass) {
      throw new HttpException(
        'Сорт с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodClass = await this.woodClassRepository.create(woodClassDto);

    return woodClass;
  }

  async deleteWoodClass(woodClassId: number) {
    const woodClass = await this.woodClassRepository.findByPk(woodClassId);

    if (!woodClass) {
      throw new HttpException('Сорт не найден', HttpStatus.NOT_FOUND);
    }

    await woodClass.destroy();
  }

  async getAllWoodClasses() {
    const woodClasses = await this.woodClassRepository.findAll();

    return woodClasses;
  }

  async findWoodClassById(woodClassId: number) {
    const woodClass = await this.woodClassRepository.findByPk(woodClassId);

    return woodClass;
  }
}
