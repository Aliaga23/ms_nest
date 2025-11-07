import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { EncuestaService } from './encuesta.service';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { UpdateEncuestaDto } from './dto/update-encuesta.dto';
import { UsuarioService } from '../usuario/usuario.service';

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
    async create(
        @Body() createEncuestaDto: CreateEncuestaDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.create(createEncuestaDto, userId);
    }

    @Get()
    async findAll(@Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const encuesta = await this.encuestaService.findOneByUser(id, userId);
        if (!encuesta) {
            throw new HttpException('Encuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return encuesta;
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateEncuestaDto: UpdateEncuestaDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.updateByUser(id, userId, updateEncuestaDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.encuestaService.removeByUser(id, userId);
    }
}
