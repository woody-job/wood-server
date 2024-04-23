import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { Workshop } from 'src/workshop/workshop.model';

interface WorkshopDailyDataCreationAttrs {
  date: string;
}

@Table({ tableName: 'workshop_daily_data', timestamps: false })
export class WorkshopDailyData extends Model<
  WorkshopDailyData,
  WorkshopDailyDataCreationAttrs
> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date: string;

  @ApiProperty({
    example: '1',
    description: 'id цеха',
  })
  @ForeignKey(() => Workshop)
  @Column({ field: 'workshop_id' })
  workshopId: number;

  @BelongsTo(() => Workshop)
  workshop: Workshop;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения',
  })
  @ForeignKey(() => WoodNaming)
  @Column({ field: 'wood_naming_id' })
  woodNamingId: number;

  @BelongsTo(() => WoodNaming)
  woodNaming: WoodNaming;

  @ApiProperty({
    example: '1',
    description: 'id сечения',
  })
  @ForeignKey(() => Dimension)
  dimensionId: number;

  @BelongsTo(() => Dimension)
  dimension: Dimension;
}
