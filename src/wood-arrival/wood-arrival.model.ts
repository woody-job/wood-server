import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Supplier } from 'src/supplier/supplier.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodType } from 'src/wood-type/wood-type.model';

interface WoodArrivalCreationAttrs {
  date: string;
  amount: number;
  woodClassId: number;
  woodTypeId: number;
  dimensionId: number;
  woodConditionId: number;
  supplierId: number;
  car: string;
}

@Table({ tableName: 'wood_arrival', timestamps: false })
export class WoodArrival extends Model<WoodArrival, WoodArrivalCreationAttrs> {
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
    description: 'id поставщика',
  })
  @ForeignKey(() => Supplier)
  @Column({ field: 'supplier_id', allowNull: true })
  supplierId: number;

  @BelongsTo(() => Supplier)
  supplier: Supplier;

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
