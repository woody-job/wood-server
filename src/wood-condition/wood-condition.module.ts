import { Module } from '@nestjs/common';
import { WoodConditionController } from './wood-condition.controller';
import { WoodConditionService } from './wood-condition.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodCondition } from './wood-condition.model';

@Module({
  controllers: [WoodConditionController],
  providers: [WoodConditionService],
  imports: [SequelizeModule.forFeature([WoodCondition])],
})
export class WoodConditionModule {}
