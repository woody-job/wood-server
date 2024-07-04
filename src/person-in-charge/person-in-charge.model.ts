import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';

interface PersonInChargeCreationAttrs {
  initials: string;
  secondName: string;
}

@Table({ tableName: 'person_in_charge', timestamps: false })
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

  @HasMany(() => WoodShipment)
  woodShipments: WoodShipment[];
}
