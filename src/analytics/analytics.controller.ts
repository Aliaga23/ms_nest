import { Controller, Get, Param, Res, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('usuarios')
    @ApiOperation({ 
        summary: 'Listar todos los usuarios disponibles',
        description: 'Endpoint público que lista todos los usuarios que tienen datos de encuestas'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de usuarios con información básica',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        total_usuarios: { type: 'number' },
                        usuarios: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    usuario_id: { type: 'string' },
                                    nombre: { type: 'string' },
                                    email: { type: 'string' },
                                    total_encuestas: { type: 'number' },
                                    total_respuestas: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    async getUsuarios() {
        return this.analyticsService.getUsuariosList();
    }

    @Get('usuario/:userId/kmeans-data')
    @ApiParam({
        name: 'userId',
        description: 'ID del usuario para obtener sus datos',
        example: 'user-123-abc'
    })
    @ApiOperation({ 
        summary: 'Obtener datos K-means de un usuario específico',
        description: 'Endpoint público que devuelve los datos de encuestas de un usuario específico para análisis K-means'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Datos del usuario estructurados para análisis K-means en formato JSON',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        usuario: {
                            type: 'object',
                            properties: {
                                usuario_id: { type: 'string' },
                                nombre: { type: 'string' },
                                email: { type: 'string' },
                                telefono: { type: 'string' },
                                estado: { type: 'boolean' },
                                es_admin: { type: 'boolean' }
                            }
                        },
                        encuestas: { type: 'array' },
                        categorias: { type: 'object' },
                        estadisticas: { type: 'object' }
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado o sin datos de encuestas'
    })
    async getUserKmeansData(@Param('userId') userId: string) {
        const userData = await this.analyticsService.getUsuarioKmeansData(userId);
        if (!userData) {
            throw new HttpException('Usuario no encontrado o sin datos de encuestas', HttpStatus.NOT_FOUND);
        }
        return userData;
    }

    @Get('usuario/:userId/download')
    @ApiParam({
        name: 'userId',
        description: 'ID del usuario para descargar sus datos',
        example: 'user-123-abc'
    })
    @ApiOperation({ 
        summary: 'Descargar datos K-means de un usuario como archivo JSON',
        description: 'Endpoint público que permite descargar los datos de un usuario específico como archivo JSON'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Archivo JSON descargado exitosamente',
        content: {
            'application/json': {
                schema: { type: 'object' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado o sin datos de encuestas'
    })
    async downloadUserData(@Param('userId') userId: string, @Res() res: Response) {
        const userData = await this.analyticsService.getUsuarioKmeansData(userId);
        if (!userData) {
            throw new HttpException('Usuario no encontrado o sin datos de encuestas', HttpStatus.NOT_FOUND);
        }

        const fileName = `kmeans_data_${userId}_${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(JSON.stringify(userData, null, 2));
    }

    @Get('kmeans-data')
    @ApiOperation({ 
        summary: 'Obtener datos limpios para análisis K-means de todos los usuarios',
        description: 'Endpoint público que devuelve todos los usuarios con sus respuestas de encuestas, excluyendo preguntas tipo "Completar"'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Datos estructurados para análisis K-means en formato JSON'
    })
    async getKmeansData() {
        return this.analyticsService.getKmeansData();
    }
}