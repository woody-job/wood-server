import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface PersonInChargeCreationAttrs {
  initials: string;
  secondName: string;
}

@Table({ tableName: 'person-in-charge', timestamps: false })
export class PersonInCharge extends Model<
  PersonInCharge,
  PersonInChargeCreationAttrs
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
    example: 'М.П',
    description: 'Инициалы',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  initials: string;

  @ApiProperty({
    example: 'Зубенко',
    description: 'Фамилия',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  secondName: string;
}
