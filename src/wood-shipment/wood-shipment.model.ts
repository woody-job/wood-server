import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodType } from 'src/wood-type/wood-type.model';

interface WoodShipmentCreationAttrs {
  date: string;
  amount: number;
  woodClassId: number;
  woodTypeId: number;
  dimensionId: number;
  woodConditionId: number;
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

  @BelongsTo(() => Dimension)
  dimension: Dimension;

  @ForeignKey(() => WoodCondition)
  @Column({ field: 'wood_condition_id' })
  woodConditionId: number;

  @BelongsTo(() => WoodCondition)
  woodCondition: WoodCondition;
}
