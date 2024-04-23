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
import { WoodType } from 'src/wood-type/wood-type.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';
import { Workshop } from 'src/workshop/workshop.model';

interface WorkshopOutCreationAttrs {
  date: string;
  amount: number;
  workshopWoodPriceId: number;
  workshopId: number;
  woodClassId: number;
  woodTypeId: number;
  dimensionId: number;
}

@Table({ tableName: 'workshop_out', timestamps: false })
export class WorkshopOut extends Model<WorkshopOut, WorkshopOutCreationAttrs> {
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
    description: 'id цены доски в цехе',
  })
  @ForeignKey(() => WorkshopWoodPrice)
  @Column({ field: 'workshop_wood_price_id' })
  workshopWoodPriceId: number;

  @BelongsTo(() => WorkshopWoodPrice)
  workshopWoodPrice: WorkshopWoodPrice;

  @ApiProperty({
    example: '1',
    description: 'id цеха',
  })
  @ForeignKey(() => Workshop)
  @Column({ field: 'workshop_id' })
  workshopId: number;

  @BelongsTo(() => Workshop)
  workshop: Workshop;

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
}
