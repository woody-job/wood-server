import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Workshop } from './workshop.model';
import { CreateWorkshopDto } from './dtos/create-workshop.dto';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

@Injectable()
export class WorkshopService {
  constructor(
    @InjectModel(Workshop) private workshopRepository: typeof Workshop,
  ) {}

  async createWorkshop(workshopDto: CreateWorkshopDto) {
    const existingWorkshop = await this.workshopRepository.findOne({
      where: { name: workshopDto.name },
    });

    if (existingWorkshop) {
      throw new HttpException(
        'Цех с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const workshop = await this.workshopRepository.create(workshopDto);

    return workshop;
  }

  async updateWorkshop(workshopId: number, workshopDto: CreateWorkshopDto) {
    const workshop = await this.workshopRepository.findByPk(workshopId);

    if (!workshop) {
      throw new HttpException('Цех не найден', HttpStatus.BAD_REQUEST);
    }

    workshop.name = workshopDto.name;
    workshop.priceOfRawMaterials = workshopDto.priceOfRawMaterials;
    workshop.sawingPrice = workshopDto.sawingPrice;

    await workshop.save();

    return workshop;
  }

  async getAllWorkshops() {
    const workshops = await this.workshopRepository.findAll({
      order: [['id', 'ASC']],
    });

    return workshops;
  }

  async deleteWorkshop(workshopId: number) {
    const workshop = await this.workshopRepository.findByPk(workshopId);

    if (!workshop) {
      throw new HttpException('Цех не найден', HttpStatus.BAD_REQUEST);
    }

    await workshop.destroy();
  }

  async findWorkshopById(workshopId: number) {
    const workshop = await this.workshopRepository.findByPk(workshopId, {
      include: [WorkshopWoodPrice],
    });

    return workshop;
  }
}
