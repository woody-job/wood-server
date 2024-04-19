import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateBeamSizeDto } from './dtos/create-beam-size.dto';
import { BeamSizeService } from './beam-size.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Размеры леса')
@Controller('beam-size')
export class BeamSizeController {
  constructor(private beamSizeService: BeamSizeService) {}

  @ApiOperation({ summary: 'Создание размера леса' })
  @Post()
  create(@Body() beamSizeDto: CreateBeamSizeDto) {
    return this.beamSizeService.createBeamSize(beamSizeDto);
  }

  @ApiOperation({ summary: 'Создание размера леса (массивом)' })
  @Post('/create-many')
  createMany(@Body() beamSizeDtos: CreateBeamSizeDto[]) {
    return this.beamSizeService.createManyBeamSizes(beamSizeDtos);
  }

  @ApiOperation({ summary: 'Обновление размера леса' })
  @Put('/:beamSizeId')
  update(
    @Param('beamSizeId') beamSizeId: string,
    @Body() beamSizeDto: CreateBeamSizeDto,
  ) {
    return this.beamSizeService.updateBeamSize(Number(beamSizeId), beamSizeDto);
  }

  @ApiOperation({ summary: 'Получение списка всех размеров леса' })
  @Get('/list')
  getAll() {
    return this.beamSizeService.getAllBeamSizes();
  }

  @ApiOperation({ summary: 'Удаление размера леса' })
  @Delete('/:beamSizeId')
  delete(@Param('beamSizeId') beamSizeId: string) {
    return this.beamSizeService.deleteBeamSize(Number(beamSizeId));
  }
}
