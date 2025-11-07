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
import { EntregaService } from './entrega.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { UpdateEntregaDto } from './dto/update-entrega.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Entregas')
@ApiBearerAuth()
@Controller('api/entrega')
export class EntregaController {
    constructor(
        private readonly entregaService: EntregaService,
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
        description: 'Crea una nueva entrega asociando una encuesta a un destinatario.',
        type: CreateEntregaDto,
        examples: {
            ejemplo1: {
                summary: 'Entrega básica sin fechas',
                value: {
                    encuestaId: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
                    destinatarioId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                },
            },
            ejemplo2: {
                summary: 'Entrega con fechas de envío y respuesta',
                value: {
                    enviado_en: '2025-11-04T18:30:00Z',
                    respondido_en: '2025-11-06T12:00:00Z',
                    encuestaId: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
                    destinatarioId: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
                },
            },
        },
    })
    async create(@Body() dto: CreateEntregaDto, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.entregaService.create(dto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.entregaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const entrega = await this.entregaService.findOneByUser(id, userId);
        if (!entrega)
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        return entrega;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza las fechas u otros datos de una entrega específica.',
        type: UpdateEntregaDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar fecha de respuesta',
                value: {
                    respondido_en: '2025-11-07T09:45:00Z',
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEntregaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.entregaService.updateByUser(id, userId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.entregaService.removeByUser(id, userId);
    }
}
