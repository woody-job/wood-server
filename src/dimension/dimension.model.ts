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
import { Warehouse } from 'src/warehouse/warehouse.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

interface DimensionCreationAttrs {
  width: number;
  thickness: number;
  length: number;
  volume: number;
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

  @ApiProperty({ example: '0.095', description: 'Объем доски (м3)' })
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  volume: number;

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

  @HasMany(() => WorkshopDailyData)
  workshopDailyDatas: WorkshopDailyData[];

  @HasMany(() => WorkshopOut)
  workshopOuts: WorkshopOut[];

  @HasMany(() => WoodArrival)
  woodArrivals: WoodArrival[];

  @HasMany(() => WoodShipment, { as: 'dimension', foreignKey: 'dimension_id' })
  woodShipmentsWithActualDimension: WoodShipment[];

  @HasMany(() => WoodShipment, {
    as: 'dimensionForSale',
    foreignKey: 'dimension_for_sale_id',
  })
  woodShipmentsWithDimensionForSale: WoodShipment[];

  @HasMany(() => Warehouse)
  warehouseDatas: Warehouse[];
}
