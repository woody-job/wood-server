import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DryerChamber } from './dryer-chamber.model';
import { CreateDryerChamberDto } from './dtos/create-dryer-chamber.dto';
import { DryerChamberDataService } from 'src/dryer-chamber-data/dryer-chamber-data.service';

@Injectable()
export class DryerChamberService {
  constructor(
    @InjectModel(DryerChamber)
    private dryerChamberRepository: typeof DryerChamber,
    @Inject(forwardRef(() => DryerChamberDataService))
    private dryerChamberDataService: DryerChamberDataService,
  ) {}

  async createDryerChamber(dryerChamberDto: CreateDryerChamberDto) {
    const { name } = dryerChamberDto;

    const existentDryerChamber = await this.dryerChamberRepository.findOne({
      where: { name },
    });

    if (existentDryerChamber) {
      throw new HttpException(
        'Сушильная камера с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dryerChamber = await this.dryerChamberRepository.create({
      name,
      chamberIterationCount: 0,
    });

    return dryerChamber;
  }

  async updateDryerChamber(
    dryerChamberId: number,
    dryerChamberDto: CreateDryerChamberDto,
  ) {
    const { name } = dryerChamberDto;

    const dryerChamber =
      await this.dryerChamberRepository.findByPk(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    dryerChamber.name = name;

    await dryerChamber.save();

    return dryerChamber;
  }

  async getAllDryerChambers() {
    const dryerChambers = await this.dryerChamberRepository.findAll({
      order: [['id', 'ASC']],
    });

    return dryerChambers;
  }

  async deleteDryerChamber(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberRepository.findByPk(dryerChamberId);

    if (!dryerChamber) {
      throw new HttpException(
        'Сушильная камера не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    const recordsForChamber =
      await this.dryerChamberDataService.getAllChamberData(dryerChamberId);

    if (recordsForChamber) {
      await Promise.all(
        recordsForChamber.map(async (record) => {
          await this.dryerChamberDataService.eraseRecord(record.id);
        }),
      );
    }

    await dryerChamber.destroy();
  }

  async findDryerChamberById(dryerChamberId: number) {
    const dryerChamber =
      await this.dryerChamberRepository.findByPk(dryerChamberId);

    return dryerChamber;
  }
}
