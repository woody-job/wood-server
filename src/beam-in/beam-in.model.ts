import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { Workshop } from 'src/workshop/workshop.model';

interface BeamInCreationAttrs {
  workshopId: number;
  beamSizeId: number;
  woodNamingId: number;
  amount: number;
  date: string;
}

@Table({ tableName: 'beam_in', timestamps: false })
export class BeamIn extends Model<BeamIn, BeamInCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

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
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date: string;

  @ForeignKey(() => BeamSize)
  @Column({ field: 'beam_size_id' })
  beamSizeId: number;

  @ApiProperty({
    example: 'BeamSize',
    description: 'Размера леса',
  })
  @BelongsTo(() => BeamSize)
  beamSize: BeamSize;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения леса',
  })
  @ForeignKey(() => WoodNaming)
  @Column({ field: 'wood_naming_id', allowNull: true })
  woodNamingId: number;

  @BelongsTo(() => WoodNaming)
  woodNaming: WoodNaming;

  @ApiProperty({
    example: '1',
    description: 'id цеха',
  })
  @ForeignKey(() => Workshop)
  @Column({ field: 'workshop_id' })
  workshopId: number;

  @BelongsTo(() => Workshop)
  workshop: Workshop;
}
