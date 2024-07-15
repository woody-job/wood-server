import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { BeamArrival } from 'src/beam-arrival/beam-arrival.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';

interface SupplierCreationAttrs {
  name: string;
}

@Table({ tableName: 'supplier', timestamps: false })
export class Supplier extends Model<Supplier, SupplierCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Поставщик 1',
    description: 'Наименование поставщика',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => WoodArrival)
  woodArrivals: WoodArrival[];

  @HasMany(() => BeamArrival)
  beamArrivals: BeamArrival[];
}
