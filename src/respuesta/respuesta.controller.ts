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
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { RespuestaService } from './respuesta.service';
import { CreateRespuestaDto } from './dto/create-respuesta.dto';
import { UpdateRespuestaDto } from './dto/update-respuesta.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Respuestas')
@ApiBearerAuth()
@Controller('api/respuesta')
export class RespuestaController {
    constructor(
        private readonly respuestaService: RespuestaService,
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
        description:
            'Crea una nueva respuesta a una pregunta dentro de una entrega de encuesta.',
        type: CreateRespuestaDto,
        examples: {
            ejemplo1: {
                summary: 'Respuesta abierta (texto libre)',
                value: {
                    texto: 'Me encantó la atención al cliente, fue muy amable.',
                    entregaId: 'aa5c90b0-52e8-4dbf-bb38-ecb87b19ccaf',
                    preguntaId: 'f31b1821-4b5d-4f3e-99cf-c3a6620e23df',
                },
            },
            ejemplo2: {
                summary: 'Respuesta de opción múltiple (escala de satisfacción)',
                value: {
                    numero: 5,
                    recibido_en: '2025-11-06T18:45:00Z',
                    entregaId: 'aa5c90b0-52e8-4dbf-bb38-ecb87b19ccaf',
                    preguntaId: 'f31b1821-4b5d-4f3e-99cf-c3a6620e23df',
                    opcionEncuestaId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                },
            },
        },
    })
    async create(@Body() dto: CreateRespuestaDto, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.respuestaService.create(dto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.respuestaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const respuesta = await this.respuestaService.findOneByUser(id, userId);
        if (!respuesta)
            throw new HttpException('Respuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        return respuesta;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza el texto, número o fecha de una respuesta existente.',
        type: UpdateRespuestaDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar texto de respuesta abierta',
                value: {
                    texto: 'Podrían mejorar los tiempos de respuesta al cliente.',
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateRespuestaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.respuestaService.updateByUser(id, userId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.respuestaService.removeByUser(id, userId);
    }
}
