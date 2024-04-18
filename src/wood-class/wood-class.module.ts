import { Module } from '@nestjs/common';
import { WoodClassService } from './wood-class.service';
import { WoodClassController } from './wood-class.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodClass } from './wood-class.model';
import { Dimension } from 'src/dimension/dimension.model';

@Module({
  providers: [WoodClassService],
  controllers: [WoodClassController],
  imports: [SequelizeModule.forFeature([WoodClass, Dimension])],
  exports: [WoodClassService],
})
export class WoodClassModule {}
