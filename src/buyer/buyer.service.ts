import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Buyer } from './buyer.model';
import { CreateBuyerDto } from './dtos/create-buyer.dto';

@Injectable()
export class BuyerService {
  constructor(
    @InjectModel(Buyer)
    private buyerRepository: typeof Buyer,
  ) {}

  async getAllBuyers() {
    const buyers = await this.buyerRepository.findAll({
      order: [['id', 'DESC']],
    });

    return buyers;
  }

  async createBuyer(BuyerDto: CreateBuyerDto) {
    const { name } = BuyerDto;

    const existingBuyer = await this.buyerRepository.findOne({
      where: {
        name,
      },
    });

    if (existingBuyer) {
      throw new HttpException(
        'Покупатель с таким наименованием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const buyer = await this.buyerRepository.create(BuyerDto);

    return buyer;
  }

  async updateBuyer(BuyerId: number, BuyerDto: CreateBuyerDto) {
    const { name } = BuyerDto;
    const buyer = await this.buyerRepository.findByPk(BuyerId);

    if (!Buyer) {
      throw new HttpException(
        'Выбранный Покупатель не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    buyer.name = name;

    await buyer.save();

    return buyer;
  }

  async deleteBuyer(buyerId: number) {
    const buyer = await this.buyerRepository.findByPk(buyerId);

    if (!buyer) {
      throw new HttpException(
        'Выбранный Покупатель не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    await buyer.destroy();
  }

  async findBuyerById(buyerId: number) {
    const buyer = await this.buyerRepository.findByPk(buyerId);

    return buyer;
  }
}
