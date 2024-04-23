import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';

interface WoodNamingCreationAttrs {
  name: string;
}

@Table({ tableName: 'wood_naming', timestamps: false })
export class WoodNaming extends Model<WoodNaming, WoodNamingCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Елка 6',
    description: 'Название условного обозначения',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @HasMany(() => WorkshopDailyData)
  workshopDailyDatas: WorkshopDailyData[];
}
