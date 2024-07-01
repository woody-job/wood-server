import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface BuyerCreationAttrs {
  name: string;
}

@Table({ tableName: 'buyer', timestamps: false })
export class Buyer extends Model<Buyer, BuyerCreationAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;
}
