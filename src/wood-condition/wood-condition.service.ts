import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WoodCondition } from './wood-condition.model';
import { CreateWoodConditionDto } from './dtos/create-wood-condition.dto';

@Injectable()
export class WoodConditionService {
  constructor(
    @InjectModel(WoodCondition)
    private woodConditionRepository: typeof WoodCondition,
  ) {}

  async createWoodCondition(woodConditionDto: CreateWoodConditionDto) {
    const existingWoodCondition = await this.woodConditionRepository.findOne({
      where: { name: woodConditionDto.name },
    });

    if (existingWoodCondition) {
      throw new HttpException(
        'Состояние с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const woodCondition =
      await this.woodConditionRepository.create(woodConditionDto);

    return woodCondition;
  }

  async deleteWoodCondition(woodConditionId: number) {
    const woodCondition =
      await this.woodConditionRepository.findByPk(woodConditionId);

    if (!woodCondition) {
      throw new HttpException('Состояние не найдено', HttpStatus.NOT_FOUND);
    }

    await woodCondition.destroy();
  }

  async getAllWoodConditions() {
    const woodConditiones = await this.woodConditionRepository.findAll();

    return woodConditiones;
  }
}
