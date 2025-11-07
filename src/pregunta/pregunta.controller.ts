import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
        if (!pregunta) {
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return pregunta;
    }


    @Patch(':id')
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
    async findByEncuesta(
        @Param('encuestaId') encuestaId: string,
        @AuthHeader() authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.preguntaService.findByEncuesta(encuestaId, userId);
    }

}
