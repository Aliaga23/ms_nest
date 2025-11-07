import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return entrega;
    }


    @Patch(':id')
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
