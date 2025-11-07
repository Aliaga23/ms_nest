import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
        if (!respuesta) {
            throw new HttpException('Respuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return respuesta;
    }


    @Patch(':id')
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
