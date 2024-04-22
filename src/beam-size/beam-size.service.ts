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
    const { diameter, volume } = beamSizeDto;

    const existentBeamSize = await this.beamSizeRepository.findOne({
      where: {
        diameter,
        volume,
      },
    });

    if (existentBeamSize) {
      throw new HttpException(
        'Размер с такими значениями уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const beamSize = await this.beamSizeRepository.create({ diameter, volume });

    return beamSize;
  }

  async createManyBeamSizes(beamSizeDtos: CreateBeamSizeDto[]) {
    const beamSizes = await Promise.all(
      beamSizeDtos.map(async (beamSizeDto) => {
        const beamSize = await this.createBeamSize(beamSizeDto);

        return beamSize;
      }),
    );

    return beamSizes;
  }

  async updateBeamSize(beamSizeId: number, beamSizeDto: CreateBeamSizeDto) {
    const { diameter, volume } = beamSizeDto;

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

    await beamSize.save();

    return beamSize;
  }

  async getAllBeamSizes() {
    const beamSizes = await this.beamSizeRepository.findAll();

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
}
