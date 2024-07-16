import { ApiProperty } from '@nestjs/swagger';
import { DataTypes } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';

interface BeamWarehouseCreationAttrs {
  woodNamingId: number; // (has woodType, length)
  amount?: number;
  beamSizeId?: number;
  volume?: number;
}

@Table({ tableName: 'beam_warehouse', timestamps: false })
export class BeamWarehouse extends Model<
  BeamWarehouse,
  BeamWarehouseCreationAttrs
> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  })
  id: number;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения леса',
  })
  @ForeignKey(() => WoodNaming)
  @Column({ field: 'wood_naming_id' })
  woodNamingId: number;

  @BelongsTo(() => WoodNaming)
  woodNaming: WoodNaming;

  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @ForeignKey(() => BeamSize)
  @Column({ field: 'beam_size_id', allowNull: true })
  beamSizeId: number;

  @BelongsTo(() => BeamSize)
  beamSize: BeamSize;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @Column({
    type: DataTypes.INTEGER,
    allowNull: true,
  })
  amount: number;

  @ApiProperty({
    example: '1',
    description: 'Объем, м3',
  })
  @Column({
    type: DataTypes.DECIMAL,
    allowNull: true,
  })
  volume: number;
}
