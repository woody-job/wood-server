import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

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
}
