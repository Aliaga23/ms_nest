import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { PreguntaService } from './pregunta.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Preguntas')
@ApiBearerAuth()
@Controller('api/pregunta')
export class PreguntaController {
    constructor(
        private readonly preguntaService: PreguntaService,
        private readonly usuarioService: UsuarioService,
    ) { }

    private async extractUserId(authHeader: string): Promise<string> {
        if (!authHeader)
            throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);

        const token = authHeader.replace('Bearer ', '');
        const isValid = await this.usuarioService.validateToken(token);
        if (!isValid)
            throw new HttpException('Token inválido o expirado', HttpStatus.UNAUTHORIZED);

        return this.usuarioService.getUserId(token);
    }

    @Post()
    @ApiBody({
        description: 'Crea una nueva pregunta dentro de una encuesta existente.',
        type: CreatePreguntaDto,
        examples: {
            ejemplo1: {
                summary: 'Pregunta de opción múltiple',
                value: {
                    orden: 1,
                    texto: '¿Con qué frecuencia utiliza nuestro servicio?',
                    obligatorio: true,
                    encuestaId: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
                    tipo_preguntaId: '3c9e2a19-51ba-4a48-b6a8-04ecb1134d13',
                },
            },
            ejemplo2: {
                summary: 'Pregunta abierta',
                value: {
                    orden: 2,
                    texto: '¿Qué mejoras le gustaría ver en el futuro?',
                    obligatorio: false,
                    encuestaId: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
                    tipo_preguntaId: 'a1b2c3d4-5678-90ab-cdef-1234567890ff',
                },
            },
        },
    })
    async create(@Body() dto: CreatePreguntaDto, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.create(dto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const pregunta = await this.preguntaService.findOneByUser(id, userId);
        if (!pregunta)
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        return pregunta;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza los detalles de una pregunta específica.',
        type: UpdatePreguntaDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar texto y obligatoriedad',
                value: {
                    texto: '¿Qué tan satisfecho está con la rapidez del servicio?',
                    obligatorio: true,
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePreguntaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.updateByUser(id, userId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.removeByUser(id, userId);
    }

    @Get('encuesta/:encuestaId')
    @ApiParam({
        name: 'encuestaId',
        description: 'ID de la encuesta para obtener todas las preguntas asociadas.',
        example: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
    })
    async findByEncuesta(
        @Param('encuestaId') encuestaId: string,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.findByEncuesta(encuestaId, userId);
    }
}
