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
import { EncuestaService } from './encuesta.service';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { UpdateEncuestaDto } from './dto/update-encuesta.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Encuestas')
@ApiBearerAuth()
@Controller('api/encuesta')
export class EncuestaController {
    constructor(
        private readonly encuestaService: EncuestaService,
        private readonly usuarioService: UsuarioService,
    ) { }

    private async extractUserId(authHeader: string): Promise<string> {
        if (!authHeader) throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);

        const token = authHeader.replace('Bearer ', '');
        const isValid = await this.usuarioService.validateToken(token);
        if (!isValid) throw new HttpException('Token inválido o expirado', HttpStatus.UNAUTHORIZED);

        return this.usuarioService.getUserId(token);
    }

    @Post()
    @ApiBody({
        description: 'Crea una nueva encuesta vinculada al usuario autenticado.',
        type: CreateEncuestaDto,
        examples: {
            ejemplo1: {
                summary: 'Encuesta básica de satisfacción',
                value: {
                    nombre: 'Satisfacción de atención al cliente',
                    descripcion: 'Encuesta para medir la experiencia del cliente con el servicio.',
                    campañaId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                    canalId: 'c8a7d3e2-54b1-43c6-b123-9dc8f2e5a7c1',
                    activo: true,
                },
            },
            ejemplo2: {
                summary: 'Encuesta interna de empleados',
                value: {
                    nombre: 'Evaluación del ambiente laboral',
                    descripcion: 'Formulario para conocer la percepción del personal sobre su entorno de trabajo.',
                    activo: false,
                },
            },
        },
    })
    async create(
        @Body() createEncuestaDto: CreateEncuestaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.create(createEncuestaDto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const encuesta = await this.encuestaService.findOneByUser(id, userId);
        if (!encuesta) {
            throw new HttpException('Encuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return encuesta;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza los datos de una encuesta específica.',
        type: UpdateEncuestaDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar nombre y descripción de encuesta',
                value: {
                    nombre: 'Encuesta de experiencia de usuario',
                    descripcion: 'Actualización del cuestionario para versión 2025.',
                    activo: true,
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() updateEncuestaDto: UpdateEncuestaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.updateByUser(id, userId, updateEncuestaDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.removeByUser(id, userId);
    }

    @Post(':encuestaId/generar-json')
    @ApiBody({
        description: 'Genera un JSON con entregas simuladas de la encuesta',
        required: false,
        schema: {
            type: 'object',
            properties: {
                empresaId: { type: 'string', example: '690e9f2d7f4b29e419afdafd' },
                destinatarios: { type: 'number', example: 10, default: 10 },
            },
        },
    })
    async generarJson(
        @Param('encuestaId') encuestaId: string,
        @Body() body: { empresaId?: string; destinatarios?: number },
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.generarJson(encuestaId, userId, body);
    }

    @Post('generar-json-lote')
    @ApiBody({
        description: 'Genera JSON con entregas simuladas para múltiples encuestas',
        schema: {
            type: 'object',
            properties: {
                encuestas: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            encuestaId: { type: 'string', example: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3' },
                            destinatarios: { type: 'number', example: 100 },
                        },
                    },
                    example: [
                        { encuestaId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3', destinatarios: 100 },
                        { encuestaId: 'c8a7d3e2-54b1-43c6-b123-9dc8f2e5a7c1', destinatarios: 150 },
                    ],
                },
            },
        },
    })
    async generarJsonMasivo(
        @Body() body: { encuestas: { encuestaId: string; destinatarios: number }[] },
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);

        if (!body.encuestas || !Array.isArray(body.encuestas) || body.encuestas.length === 0) {
            throw new HttpException('encuestas array is required and cannot be empty', HttpStatus.BAD_REQUEST);
        }

        return this.encuestaService.generarJsonMasivo(body.encuestas, userId);
    }
}
