import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { BeamArrival } from 'src/beam-arrival/beam-arrival.model';
import { BeamIn } from 'src/beam-in/beam-in.model';
import { BeamShipment } from 'src/beam-shipment/beam-shipment.model';

interface BeamSizeCreationAttrs {
  diameter: number;
  length: number;
  volume: number;
}

@Table({ tableName: 'beam_size', timestamps: false })
export class BeamSize extends Model<BeamSize, BeamSizeCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true,
  })
  id: number;

  @ApiProperty({
    example: '12',
    description: 'Диаметр бревна в сантиметрах',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: false,
  })
  diameter: number;

  @ApiProperty({
    example: '6',
    description: 'Длина бревна в метрах',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  length: number;

  @ApiProperty({
    example: '0.095',
    description: 'Объем бревна в м3',
  })
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    unique: false,
  })
  volume: number;

  @HasMany(() => BeamIn)
  beamIns: BeamIn[];

  @HasMany(() => BeamShipment)
  beamShipments: BeamShipment[];

  @HasMany(() => BeamArrival)
  beamArrivals: BeamArrival[];
}
