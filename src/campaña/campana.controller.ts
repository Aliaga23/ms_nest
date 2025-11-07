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
import { CampanaService } from './campana.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Campañas')
@ApiBearerAuth()
@Controller('api/campana')
export class CampanaController {
    constructor(
        private readonly campanaService: CampanaService,
        private readonly usuarioService: UsuarioService,
    ) { }

    private async extractUserId(authHeader: string): Promise<string> {
        if (!authHeader) {
            throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.replace('Bearer ', '');
        const isValid = await this.usuarioService.validateToken(token);
        if (!isValid) {
            throw new HttpException('Token inválido o expirado', HttpStatus.UNAUTHORIZED);
        }

        return this.usuarioService.getUserId(token);
    }

    @Post()
    @ApiBody({
        description: 'Crea una nueva campaña asociada al usuario autenticado.',
        type: CreateCampanaDto,
        examples: {
            ejemplo1: {
                summary: 'Campaña de evaluación de servicio',
                value: {
                    nombre: 'Evaluación de atención al cliente 2025',
                },
            },
            ejemplo2: {
                summary: 'Campaña de promoción de producto',
                value: {
                    nombre: 'Campaña de lanzamiento de nuevos productos',
                },
            },
        },
    })
    async create(
        @Body() createCampanaDto: CreateCampanaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.create(createCampanaDto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const campaña = await this.campanaService.findOneByUser(id, userId);
        if (!campaña) {
            throw new HttpException('Campaña no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return campaña;
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza el nombre de una campaña existente.',
        type: UpdateCampanaDto,
        examples: {
            ejemplo: {
                summary: 'Renombrar campaña existente',
                value: {
                    nombre: 'Campaña de seguimiento postventa',
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() updateCampanaDto: UpdateCampanaDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.updateByUser(id, userId, updateCampanaDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.removeByUser(id, userId);
    }
}
