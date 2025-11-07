import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { CampanaService } from './campana.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
import { UsuarioService } from '../usuario/usuario.service';

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
    async create(
        @Body() createCampanaDto: CreateCampanaDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.create(createCampanaDto, userId);
    }


    @Get()
    async findAll(@Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.findAllByUser(userId);
    }


    @Get(':id')
    async findOne(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        const campaña = await this.campanaService.findOneByUser(id, userId);
        if (!campaña) {
            throw new HttpException('Campaña no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return campaña;
    }


    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCampanaDto: UpdateCampanaDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.updateByUser(id, userId, updateCampanaDto);
    }


    @Delete(':id')
    async remove(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const userId = await this.extractUserId(authHeader);
        return this.campanaService.removeByUser(id, userId);
    }
}
