import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Dimension } from 'src/dimension/dimension.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

interface WoodClassCreationAttrs {
  name: string;
}

@Table({ tableName: 'wood_class', timestamps: false })
export class WoodClass extends Model<WoodClass, WoodClassCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Рыночный',
    description: 'Название сорта',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => Dimension)
  dimensions: Dimension[];

  @HasMany(() => WorkshopWoodPrice)
  workshopWoodPrices: WorkshopWoodPrice[];
}
