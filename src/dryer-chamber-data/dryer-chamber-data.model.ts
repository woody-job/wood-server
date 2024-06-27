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
import { DryerChamber } from 'src/dryer-chamber/dryer-chamber.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';

interface DryerChamberDataCreationAttrs {
  date: string;
  amount: number;
  dimensionId: number;
  woodClassId: number;
  woodTypeId: number;
  dryerChamberId: number;
  isDrying?: boolean;
  isTakenOut?: boolean;
  chamberIterationCountWhenBringingIn: number;
}

@Table({ tableName: 'dryer_chamber_data', timestamps: false })
export class DryerChamberData extends Model<
  DryerChamberData,
  DryerChamberDataCreationAttrs
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
    example: '2024-04-26T05:47:00.452Z',
    description: 'Дата занесения доски в сушилку',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date: string;

  @ApiProperty({
    example: '12250',
    description: 'Количество занесенной доски в сушилку',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  amount: number;

  @ApiProperty({
    example: 'true',
    description: 'Флаг сушится ли доска',
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isDrying: boolean;

  @ApiProperty({
    example: 'false',
    description: 'Флаг вынесена ли доска из сушилки',
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isTakenOut: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  chamberIterationCountWhenBringingIn: number;

  @ForeignKey(() => DryerChamber)
  @Column({ field: 'dryer_chamber_id ' })
  dryerChamberId: number;

  @BelongsTo(() => DryerChamber)
  dryerChamber: DryerChamber;

  @ForeignKey(() => WoodType)
  woodTypeId: number;

  @ApiProperty({
    example: 'WoodType',
    description: 'Порода леса',
  })
  @BelongsTo(() => WoodType)
  woodType: WoodType;

  @ForeignKey(() => Dimension)
  @Column({ field: 'dimension_id' })
  dimensionId: number;

  @ApiProperty({
    example: 'Dimension',
    description: 'Сечение доски',
  })
  @BelongsTo(() => Dimension)
  dimension: Dimension;

  @ForeignKey(() => WoodClass)
  @Column({ field: 'wood_class_id' })
  woodClassId: number;

  @ApiProperty({
    example: 'WoodClass',
    description: 'Сорт доски',
  })
  @BelongsTo(() => WoodClass)
  woodClass: WoodClass;
}
