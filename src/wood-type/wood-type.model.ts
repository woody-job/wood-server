import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { Warehouse } from 'src/warehouse/warehouse.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';

interface WoodTypeCreationAttrs {
  name: string;
}

@Table({ tableName: 'wood_type', timestamps: false })
export class WoodType extends Model<WoodType, WoodTypeCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Ель',
    description: 'Название породы',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => DryerChamberData)
  dryerChamberDatas: DryerChamberData[];

  @HasMany(() => WorkshopOut)
  workshopOuts: WorkshopOut[];

  @HasMany(() => WoodArrival)
  woodArrivals: WoodArrival[];

  @HasMany(() => WoodShipment)
  woodShipments: WoodShipment[];

  @HasMany(() => Warehouse)
  warehouseDatas: Warehouse[];

  @HasMany(() => WoodNaming)
  woodNamings: WoodNaming[];
}
