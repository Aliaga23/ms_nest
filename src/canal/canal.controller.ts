import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { CanalService } from './canal.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@ApiTags('Canales')
@Controller('api/canal')
export class CanalController {
    constructor(private readonly canalService: CanalService) { }

    @Post()
    @ApiBody({
        description: 'Crea un nuevo canal para envío de encuestas.',
        type: CreateCanalDto,
        examples: {
            ejemplo1: {
                summary: 'Canal de WhatsApp',
                value: {
                    nombre: 'WhatsApp',
                },
            },
            ejemplo2: {
                summary: 'Canal de Correo Electrónico',
                value: {
                    nombre: 'Email',
                },
            },
        },
    })
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
    @ApiBody({
        description: 'Actualiza un canal existente.',
        type: UpdateCanalDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar canal',
                value: {
                    nombre: 'Telegram',
                },
            },
        },
    })
    update(@Param('id') id: string, @Body() updateCanalDto: UpdateCanalDto) {
        return this.canalService.update(id, updateCanalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.canalService.remove(id);
    }
}
