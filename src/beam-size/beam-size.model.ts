import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { BeamIn } from 'src/beam-in/beam-in.model';

interface BeamSizeCreationAttrs {
  diameter: number;
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
    description: 'Диаметр бревна в метрах',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  diameter: number;

  @ApiProperty({
    example: '0.095',
    description: 'Объем бревна в м3',
  })
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    unique: true,
  })
  volume: number;

  @HasMany(() => BeamIn)
  beamIns: BeamIn[];
}
