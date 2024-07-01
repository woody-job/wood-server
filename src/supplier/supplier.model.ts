import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface SupplierCreationAttrs {
  name: string;
}

@Table({ tableName: 'supplier', timestamps: false })
export class Supplier extends Model<Supplier, SupplierCreationAttrs> {
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
