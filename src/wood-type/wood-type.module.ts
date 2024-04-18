import { Module } from '@nestjs/common';
import { WoodTypeController } from './wood-type.controller';
import { WoodTypeService } from './wood-type.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodType } from './wood-type.model';

@Module({
  controllers: [WoodTypeController],
  providers: [WoodTypeService],
  imports: [SequelizeModule.forFeature([WoodType])],
})
export class WoodTypeModule {}
