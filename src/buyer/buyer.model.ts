import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';

interface BuyerCreationAttrs {
  name: string;
}

@Table({ tableName: 'buyer', timestamps: false })
export class Buyer extends Model<Buyer, BuyerCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Покупатель 1',
    description: 'Наименование покупателя',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => WoodShipment)
  woodShipments: WoodShipment[];
}
