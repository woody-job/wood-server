import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PersonInCharge } from './person-in-charge.model';
import { CreatePersonInChargeDto } from './dtos/create-person-in-charge.dto';

@Injectable()
export class PersonInChargeService {
  constructor(
    @InjectModel(PersonInCharge)
    private personInChargeRepository: typeof PersonInCharge,
  ) {}

  async getAllPersonsInCharge() {
    const personsInCharge = await this.personInChargeRepository.findAll({
      order: [['secondName', 'ASC']],
    });

    return personsInCharge;
  }

  async createPersonInCharge(personInChargeDto: CreatePersonInChargeDto) {
    const { initials, secondName } = personInChargeDto;

    const existingPersonInCharge = await this.personInChargeRepository.findOne({
      where: {
        initials,
        secondName,
      },
    });

    if (existingPersonInCharge) {
      throw new HttpException(
        'Ответственный с таким именем уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const personInCharge =
      await this.personInChargeRepository.create(personInChargeDto);

    return personInCharge;
  }

  async updatePersonInCharge(
    PersonInChargeId: number,
    personInChargeDto: CreatePersonInChargeDto,
  ) {
    const { initials, secondName } = personInChargeDto;
    const personInCharge =
      await this.personInChargeRepository.findByPk(PersonInChargeId);

    if (!PersonInCharge) {
      throw new HttpException(
        'Выбранный ответственный не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    personInCharge.initials = initials;
    personInCharge.secondName = secondName;

    await personInCharge.save();

    return personInCharge;
  }

  async deletePersonInCharge(personInChargeId: number) {
    const personInCharge =
      await this.personInChargeRepository.findByPk(personInChargeId);

    if (!personInCharge) {
      throw new HttpException(
        'Выбранный ответственный не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    await personInCharge.destroy();
  }

  async findPersonInChargeById(personInChargeId: number) {
    const personInCharge =
      await this.personInChargeRepository.findByPk(personInChargeId);

    return personInCharge;
  }
}
