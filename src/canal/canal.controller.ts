import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CanalService } from './canal.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@ApiTags('Canales')
@Controller('api/canal')
export class CanalController {
    constructor(private readonly canalService: CanalService) { }

    @Post()
    create(@Body() createCanalDto: CreateCanalDto) {
        return this.canalService.create(createCanalDto);
    }

    @Get()
    findAll() {
        return this.canalService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.canalService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCanalDto: UpdateCanalDto) {
        return this.canalService.update(id, updateCanalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.canalService.remove(id);
    }
}
