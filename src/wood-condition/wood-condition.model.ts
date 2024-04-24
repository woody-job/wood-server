import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Warehouse } from 'src/warehouse/warehouse.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';

interface WoodConditionCreationAttrs {
  name: string;
}

@Table({ tableName: 'wood_condition', timestamps: false })
export class WoodCondition extends Model<
  WoodCondition,
  WoodConditionCreationAttrs
> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Сухая',
    description: 'Название состояния',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => WoodArrival)
  woodArrivals: WoodArrival[];

  @HasMany(() => WoodShipment)
  woodShipments: WoodShipment[];

  @HasMany(() => Warehouse)
  warehouseDatas: Warehouse[];
}
