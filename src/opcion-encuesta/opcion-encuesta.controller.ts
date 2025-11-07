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
import { OpcionEncuestaService } from './opcion-encuesta.service';
import { CreateOpcionEncuestaDto } from './dto/create-opcion-encuesta.dto';
import { UpdateOpcionEncuestaDto } from './dto/update-opcion-encuesta.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Opciones de Encuesta')
@ApiBearerAuth()
@Controller('api/opcion-encuesta')
export class OpcionEncuestaController {
    constructor(
        private readonly opcionService: OpcionEncuestaService,
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
        description: 'Crea una nueva opción dentro de una pregunta existente.',
        type: CreateOpcionEncuestaDto,
        examples: {
            ejemplo1: {
                summary: 'Opción de escala de satisfacción',
                value: {
                    texto: 'Muy satisfecho',
                    valor: '5',
                    preguntaId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                },
            },
            ejemplo2: {
                summary: 'Opción de respuesta binaria',
                value: {
                    texto: 'No',
                    valor: '0',
                    preguntaId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                },
            },
        },
    })
    async create(@Body() dto: CreateOpcionEncuestaDto, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.opcionService.create(dto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.opcionService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const opcion = await this.opcionService.findOneByUser(id, userId);
        if (!opcion)
            throw new HttpException('Opción no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        return opcion;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza los datos de una opción de pregunta.',
        type: UpdateOpcionEncuestaDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar texto y valor de una opción',
                value: {
                    texto: 'Parcialmente satisfecho',
                    valor: '3',
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateOpcionEncuestaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.opcionService.updateByUser(id, userId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.opcionService.removeByUser(id, userId);
    }
}
