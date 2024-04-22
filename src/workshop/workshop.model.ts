import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { BeamIn } from 'src/beam-in/beam-in.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

interface WorkshopCreationAttrs {
  priceOfRawMaterials: number;
  sawingPrice: number;
}

@Table({ tableName: 'workshops', timestamps: false })
export class Workshop extends Model<Workshop, WorkshopCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'Цех 1', description: 'Название цеха' })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @ApiProperty({ example: '5800', description: 'Цена сырья (рубли)' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  priceOfRawMaterials: number;

  @ApiProperty({ example: '3000', description: 'Цена распиловки (рубли)' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sawingPrice: number;

  @HasMany(() => WorkshopWoodPrice)
  workshopWoodPrices: WorkshopWoodPrice[];

  @HasMany(() => BeamIn)
  beamIns: BeamIn[];
}
