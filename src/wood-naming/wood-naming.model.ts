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
import { BeamArrival } from 'src/beam-arrival/beam-arrival.model';
import { BeamShipment } from 'src/beam-shipment/beam-shipment.model';
import { BeamWarehouse } from 'src/beam-warehouse/beam-warehouse.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';

interface WoodNamingCreationAttrs {
  name: string;
  woodTypeId: number;
  minDiameter?: number;
  maxDiameter?: number;
  length: number;
}

@Table({ tableName: 'wood_naming', timestamps: false })
export class WoodNaming extends Model<WoodNaming, WoodNamingCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Елка 6',
    description: 'Название условного обозначения',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @ApiProperty({
    example: '1',
    description: 'id породы леса',
  })
  @ForeignKey(() => WoodType)
  @Column({ field: 'wood_type_id' })
  woodTypeId: number;

  @BelongsTo(() => WoodType)
  woodType: WoodType;

  @ApiProperty({
    example: '10',
    description: 'Минимальный диаметр бревна, см',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  minDiameter: number;

  @ApiProperty({
    example: '16',
    description: 'Максимальный диаметр бревна, см',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  maxDiameter: number;

  @ApiProperty({
    example: '6',
    description: 'Длина бревна, м',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  length: number;

  @HasMany(() => WorkshopDailyData)
  workshopDailyDatas: WorkshopDailyData[];

  @HasMany(() => BeamShipment)
  beamShipments: BeamShipment[];

  @HasMany(() => BeamArrival)
  beamArrivals: BeamArrival[];

  @HasMany(() => BeamWarehouse)
  beamWarehouseRecords: BeamWarehouse[];
}
