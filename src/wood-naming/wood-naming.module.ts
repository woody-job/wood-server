import { Module } from '@nestjs/common';
import { WoodNamingController } from './wood-naming.controller';
import { WoodNamingService } from './wood-naming.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodNaming } from './wood-naming.model';

@Module({
  controllers: [WoodNamingController],
  providers: [WoodNamingService],
  imports: [SequelizeModule.forFeature([WoodNaming])],
})
export class WoodNamingModule {}
