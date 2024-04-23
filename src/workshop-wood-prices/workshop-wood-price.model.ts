import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { Workshop } from 'src/workshop/workshop.model';

interface WorkshopWoodPriceCreationAttrs {
  price: number;
}

@Table({ tableName: 'workshop_wood_price', timestamps: false })
export class WorkshopWoodPrice extends Model<
  WorkshopWoodPrice,
  WorkshopWoodPriceCreationAttrs
> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '15000', description: 'Ширина 1м3 доски для цеха' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  price: number;

  @ApiProperty({ example: '8', description: 'id цеха' })
  @ForeignKey(() => Workshop)
  @Column({ field: 'workshop_id' })
  workshopId: number;

  @ApiProperty({
    example:
      '{ id: 1, name: "Цех 1", priceOfRawMaterials: 6800, sawingPrice: 3000 }',
    description: 'Цех в раскрытом виде',
  })
  @BelongsTo(() => Workshop)
  workshop: Workshop;

  @ApiProperty({ example: '12', description: 'id сечения' })
  @ForeignKey(() => Dimension)
  @Column({ field: 'dimension_id' })
  dimensionId: number;

  @ApiProperty({
    example:
      '{ id: 1, width: 140, thickness: 150, length: 6, woodClassId: 8, woodClass: {см. WoodClass} }',
    description: 'Сечение в раскрытом виде',
  })
  @BelongsTo(() => Dimension)
  dimension: Dimension;

  @ApiProperty({ example: '122', description: 'id сорта' })
  @ForeignKey(() => WoodClass)
  @Column({ field: 'wood_class_id' })
  woodClassId: number;

  @ApiProperty({
    example: '{ id: 1, name: "Первый" }',
    description: 'Сорт доски в раскрытом виде',
  })
  @BelongsTo(() => WoodClass)
  woodClass: WoodClass;

  @HasMany(() => WorkshopOut)
  workshopOuts: WorkshopOut[];
}
