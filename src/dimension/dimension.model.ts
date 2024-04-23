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
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

interface DimensionCreationAttrs {
  width: number;
  thickness: number;
  length: number;
}

@Table({ tableName: 'dimension', timestamps: false })
export class Dimension extends Model<Dimension, DimensionCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '150', description: 'Ширина доски (мм)' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  width: number;

  @ApiProperty({ example: '150', description: 'Толщина доски (мм)' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  thickness: number;

  @ApiProperty({ example: '6', description: 'Длина доски (м)' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  length: number;

  @ApiProperty({ example: '5', description: 'id сорта доски' })
  @ForeignKey(() => WoodClass)
  @Column({ field: 'wood_class_id' })
  woodClassId: number;

  @ApiProperty({
    example: '{ id: 1, name: "Первый" }',
    description: 'Сорт доски в раскрытом виде',
  })
  @BelongsTo(() => WoodClass)
  woodClass: WoodClass;

  @HasMany(() => WorkshopWoodPrice)
  workshopWoodPrices: WorkshopWoodPrice[];

  @HasMany(() => DryerChamberData)
  dryerChamberDatas: DryerChamberData[];
}
