import { ApiProperty } from '@nestjs/swagger';
import { DataTypes } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { Buyer } from 'src/buyer/buyer.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodType } from 'src/wood-type/wood-type.model';

interface BeamShipmentCreationAttrs {
  date: string;
  buyerId?: number;
  woodNamingId?: number;
  woodTypeId: number;
  beamSizeId?: number;
  amount?: number;
  volume: number;
}

@Table({ tableName: 'beam_shipment', timestamps: false })
export class BeamShipment extends Model<
  BeamShipment,
  BeamShipmentCreationAttrs
> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  })
  id: number;

  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @Column({
    type: DataTypes.DATE,
    allowNull: false,
  })
  date: string;

  @ApiProperty({
    example: '1',
    description: 'id покупателя',
  })
  @ForeignKey(() => Buyer)
  @Column({ field: 'buyer_id', allowNull: true })
  buyerId: number;

  @BelongsTo(() => Buyer)
  buyer: Buyer;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения леса',
  })
  @ForeignKey(() => WoodNaming)
  @Column({ field: 'wood_naming_id' })
  woodNamingId: number;

  @BelongsTo(() => WoodNaming)
  woodNaming: WoodNaming;

  @ApiProperty({
    example: '1',
    description: 'id породы',
  })
  @ForeignKey(() => WoodType)
  @Column({ field: 'wood_type_id' })
  woodTypeId: number;

  @BelongsTo(() => WoodType)
  woodType: WoodType;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @Column({
    type: DataTypes.INTEGER,
    allowNull: true,
  })
  amount: number;

  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @ForeignKey(() => BeamSize)
  @Column({ field: 'beam_size_id' })
  beamSizeId: number;

  @BelongsTo(() => BeamSize)
  beamSize: BeamSize;

  @ApiProperty({
    example: '1',
    description: 'Объем в м3',
  })
  @Column({
    type: DataTypes.FLOAT,
    allowNull: false,
  })
  volume: number;
}
