import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from 'src/roles/roles.model';

interface UserCreationAttrs {
  login: string;
  fullName: string;
  password: string;
}

@Table({ tableName: 'users ', timestamps: false })
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'zubabuba11', description: 'Логин пользователя' })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  login: string;

  @ApiProperty({
    example: 'Зубенко Михаил Петрович',
    description: 'ФИО пользователя',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fullName: string;

  @ApiProperty({
    example: 'passwordqqwerty123',
    description: 'Пароль пользователя',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @ApiProperty({ example: '3', description: 'id роли для пользователя' })
  @ForeignKey(() => Role)
  @Column({ field: 'role_id' })
  roleId: number;

  @ApiProperty({
    example: '{ id: 1, name: "SUPERADMIN", description: "Описание роли" }',
    description: 'Роль пользователя в раскрытом виде',
  })
  @BelongsTo(() => Role)
  role: Role;
}
