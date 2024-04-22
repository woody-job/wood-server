import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';

interface DryerChamberCreationAttrs {
  name: string;
  chamberIterationCount: number;
}

@Table({ tableName: 'dryer_chamber', timestamps: false })
export class DryerChamber extends Model<
  DryerChamber,
  DryerChamberCreationAttrs
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
    example: 'Сушилка 1',
    description: 'Название сушильной камеры',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @ApiProperty({
    example: '63',
    description: 'Количество циклов сушильной камеры',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  chamberIterationCount: number;

  @HasMany(() => DryerChamberData)
  dryerChamberDatas: DryerChamberData[];
}
