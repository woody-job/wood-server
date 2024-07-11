import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BeamSize } from './beam-size.model';
import { CreateBeamSizeDto } from './dtos/create-beam-size.dto';

@Injectable()
export class BeamSizeService {
  constructor(
    @InjectModel(BeamSize) private beamSizeRepository: typeof BeamSize,
  ) {}

  async createBeamSize(beamSizeDto: CreateBeamSizeDto) {
    const { diameter, volume, length } = beamSizeDto;

    const existentBeamSize = await this.beamSizeRepository.findOne({
      where: {
        diameter,
        volume,
        length,
      },
    });

    if (existentBeamSize) {
      throw new HttpException(
        'Размер с такими значениями уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const beamSize = await this.beamSizeRepository.create({
      diameter,
      volume,
      length,
    });

    return beamSize;
  }

  async createManyBeamSizes(beamSizeDtos: CreateBeamSizeDto[]) {
    await this.beamSizeRepository.bulkCreate(beamSizeDtos);

    // const beamSizes = await Promise.all(
    //   beamSizeDtos.map(async (beamSizeDto) => {
    //     const beamSize = await this.createBeamSize(beamSizeDto);

    //     return beamSize;
    //   }),
    // );

    // return beamSizes;
  }

  async updateBeamSize(beamSizeId: number, beamSizeDto: CreateBeamSizeDto) {
    const { diameter, volume, length } = beamSizeDto;

    const beamSize = await this.beamSizeRepository.findByPk(beamSizeId);

    if (!beamSize) {
      throw new HttpException(
        'Выбранного размера не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    const existentBeamSize = await this.beamSizeRepository.findOne({
      where: {
        diameter,
        volume,
        length,
      },
    });

    if (existentBeamSize) {
      throw new HttpException(
        'Размер с такими значениями уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    beamSize.diameter = diameter;
    beamSize.volume = volume;
    beamSize.length = length;

    await beamSize.save();

    return beamSize;
  }

  async getAllBeamSizes() {
    const beamSizes = await this.beamSizeRepository.findAll({
      order: [['diameter', 'ASC']],
    });

    return beamSizes;
  }

  async getAllBeamSizesByLength(length: number) {
    const beamSizes = await this.beamSizeRepository.findAll({
      where: { length },
      order: [['diameter', 'ASC']],
    });

    return beamSizes;
  }

  async deleteBeamSize(beamSizeId: number) {
    const beamSize = await this.beamSizeRepository.findByPk(beamSizeId);

    if (!beamSize) {
      throw new HttpException(
        'Выбранного размера не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    await beamSize.destroy();
  }

  async findBeamSizeById(beamSizeId: number) {
    const beamSize = await this.beamSizeRepository.findByPk(beamSizeId);

    return beamSize;
  }

  async deleteAllBeamSizes() {
    await this.beamSizeRepository.truncate({ cascade: true });
  }
}
