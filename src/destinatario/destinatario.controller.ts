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
import { DestinatarioService } from './destinatario.service';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';
import { UsuarioService } from '../usuario/usuario.service';
import { AuthHeader } from '../auth/auth-header.decorator';

@ApiTags('Destinatarios')
@ApiBearerAuth()
@Controller('api/destinatario')
export class DestinatarioController {
    constructor(
        private readonly destinatarioService: DestinatarioService,
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
        description: 'Crea un nuevo destinatario que podrá recibir encuestas.',
        type: CreateDestinatarioDto,
        examples: {
            ejemplo1: {
                summary: 'Destinatario con teléfono y correo personal',
                value: {
                    nombre: 'Carlos Fernández',
                    telefono: '+59170011223',
                    email: 'carlos.fernandez@gmail.com',
                },
            },
            ejemplo2: {
                summary: 'Destinatario corporativo',
                value: {
                    nombre: 'Lucía Méndez',
                    telefono: '+59178543210',
                    email: 'lucia.mendez@empresa.com',
                },
            },
        },
    })
    async create(@Body() dto: CreateDestinatarioDto, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.destinatarioService.create(dto, userId);
    }

    @Get()
    async findAll(@AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.destinatarioService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.destinatarioService.findOneByUser(id, userId);
    }

    @Patch(':id')
    @ApiBody({
        description: 'Actualiza los datos de un destinatario existente.',
        type: UpdateDestinatarioDto,
        examples: {
            ejemplo: {
                summary: 'Actualizar nombre, teléfono y correo electrónico',
                value: {
                    nombre: 'María José Rojas',
                    telefono: '+59176001122',
                    email: 'maria.rojas@empresa.com',
                },
            },
        },
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateDestinatarioDto,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.destinatarioService.updateByUser(id, userId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AuthHeader() authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.destinatarioService.removeByUser(id, userId);
    }
}
