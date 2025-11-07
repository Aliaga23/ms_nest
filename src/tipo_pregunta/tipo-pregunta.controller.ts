import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { TipoPreguntaService } from './tipo-pregunta.service';
import { CreateTipoPreguntaDto } from './dto/create-tipo-pregunta.dto';
import { UpdateTipoPreguntaDto } from './dto/update-tipo-pregunta.dto';

@ApiTags('Tipos de Pregunta')
@Controller('api/tipo-pregunta')
export class TipoPreguntaController {
    constructor(private readonly tipoPreguntaService: TipoPreguntaService) { }

    @Post()
    @ApiBody({
        description: 'Crea un nuevo tipo de pregunta que podrá usarse al definir preguntas de encuestas.',
        type: CreateTipoPreguntaDto,
        examples: {
            ejemplo1: {
                summary: 'Tipo de pregunta de opción múltiple',
                value: { nombre: 'Opción múltiple' },
            },
            ejemplo2: {
                summary: 'Tipo de pregunta abierta',
                value: { nombre: 'Abierta' },
            },
            ejemplo3: {
                summary: 'Tipo de pregunta con escala numérica',
                value: { nombre: 'Escala (1 a 5)' },
            },
        },
    })
    create(@Body() createTipoPreguntaDto: CreateTipoPreguntaDto) {
        return this.tipoPreguntaService.create(createTipoPreguntaDto);
    }

    @Get()
    findAll() {
        return this.tipoPreguntaService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tipoPreguntaService.findOne(id);
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza el nombre del tipo de pregunta existente.',
        type: UpdateTipoPreguntaDto,
        examples: {
            ejemplo: {
                summary: 'Cambio de nombre del tipo',
                value: { nombre: 'Pregunta condicional' },
            },
        },
    })
    update(@Param('id') id: string, @Body() updateTipoPreguntaDto: UpdateTipoPreguntaDto) {
        return this.tipoPreguntaService.update(id, updateTipoPreguntaDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tipoPreguntaService.remove(id);
    }
}
