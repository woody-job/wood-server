import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Buyer } from 'src/buyer/buyer.model';
import { Dimension } from 'src/dimension/dimension.model';
import { PersonInCharge } from 'src/person-in-charge/person-in-charge.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodType } from 'src/wood-type/wood-type.model';

interface WoodShipmentCreationAttrs {
  date: string;
  amount: number;
  woodClassId: number;
  woodTypeId: number;
  dimensionId: number;
  dimensionForSaleId?: number;
  woodConditionId: number;
  car: string;
  buyerId: number;
  personInChargeId: number;
}

@Table({ tableName: 'wood_shipment', timestamps: false })
export class WoodShipment extends Model<
  WoodShipment,
  WoodShipmentCreationAttrs
> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
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
    type: DataType.DATE,
    allowNull: false,
  })
  date: string;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  amount: number;

  @ApiProperty({
    example: 'мерс 2881337/1612',
    description: 'Марка и номера машины (одна строка)',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  car: string;

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
    description: 'id ответственного',
  })
  @ForeignKey(() => PersonInCharge)
  @Column({ field: 'person_in_charge_id', allowNull: true })
  personInChargeId: number;

  @BelongsTo(() => PersonInCharge)
  personInCharge: PersonInCharge;

  @ApiProperty({
    example: '1',
    description: 'id сорта',
  })
  @ForeignKey(() => WoodClass)
  @Column({ field: 'wood_class_id' })
  woodClassId: number;

  @BelongsTo(() => WoodClass)
  woodClass: WoodClass;

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
    example: '1',
    description: 'id сечения',
  })
  @ForeignKey(() => Dimension)
  @Column({ field: 'dimension_id' })
  dimensionId: number;

  @BelongsTo(() => Dimension, { as: 'dimension', foreignKey: 'dimension_id' })
  dimension: Dimension;

  @ApiProperty({
    example: '1',
    description: 'id сечения для продажи',
  })
  @ForeignKey(() => Dimension)
  @Column({ field: 'dimension_for_sale_id', allowNull: true })
  dimensionForSaleId: number;

  @BelongsTo(() => Dimension, {
    as: 'dimensionForSale',
    foreignKey: 'dimension_for_sale_id',
  })
  dimensionForSale: Dimension;

  @ForeignKey(() => WoodCondition)
  @Column({ field: 'wood_condition_id' })
  woodConditionId: number;

  @BelongsTo(() => WoodCondition)
  woodCondition: WoodCondition;
}
