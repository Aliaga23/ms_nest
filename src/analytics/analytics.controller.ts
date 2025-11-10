import { Controller, Get, Param, Res, HttpStatus, HttpException, Query } from '@nestjs/common';
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

    @Get('respuestas/:userId/:encuestaId')
    @ApiParam({
        name: 'userId',
        description: 'ID del usuario',
        example: 'user-123-abc'
    })
    @ApiParam({
        name: 'encuestaId',
        description: 'ID de la encuesta',
        example: 'encuesta-456-def'
    })
    @ApiOperation({ 
        summary: 'Obtener respuestas específicas de un usuario en una encuesta',
        description: 'Endpoint público rápido que devuelve solo las respuestas de un usuario en una encuesta específica'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Respuestas del usuario en la encuesta especificada',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        encuesta: { type: 'object' },
                        preguntas: { type: 'array' },
                        respuestas: { type: 'array' }
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario o encuesta no encontrada'
    })
    async getRespuestasByUsuarioEncuesta(
        @Param('userId') userId: string,
        @Param('encuestaId') encuestaId: string
    ) {
        const data = await this.analyticsService.getRespuestasByUsuarioEncuesta(userId, encuestaId);
        if (!data) {
            throw new HttpException('Usuario o encuesta no encontrada', HttpStatus.NOT_FOUND);
        }
        return data;
    }

    @Get('usuario/:userId/encuestas')
    @ApiParam({
        name: 'userId',
        description: 'ID del usuario para obtener sus encuestas',
        example: 'user-123-abc'
    })
    @ApiOperation({ 
        summary: 'Obtener lista de encuestas de un usuario',
        description: 'Endpoint público que devuelve todas las encuestas de un usuario específico'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de encuestas del usuario',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            encuesta_id: { type: 'string' },
                            nombre: { type: 'string' },
                            descripcion: { type: 'string' },
                            campana: { type: 'string' },
                            canal: { type: 'string' },
                            activo: { type: 'boolean' },
                            total_preguntas: { type: 'number' }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado'
    })
    async getUsuarioEncuestas(@Param('userId') userId: string) {
        const encuestas = await this.analyticsService.getUsuarioEncuestas(userId);
        if (encuestas === null) {
            throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
        }
        return encuestas;
    }

    @Get('respuestas-completar')
    @ApiOperation({ 
        summary: 'Obtener respuestas de tipo Completar (texto libre)',
        description: 'Endpoint público que devuelve todas las respuestas de preguntas tipo Completar. Puede filtrar por usuario y/o encuesta usando query params'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de respuestas de texto libre',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            respuesta_id: { type: 'string' },
                            texto_respuesta: { type: 'string' },
                            pregunta_texto: { type: 'string' },
                            encuesta_nombre: { type: 'string' },
                            user_id: { type: 'string' }
                        }
                    }
                }
            }
        }
    })
    async getRespuestasCompletar(
        @Query('userId') userId?: string,
        @Query('encuestaId') encuestaId?: string
    ) {
        return this.analyticsService.getRespuestasCompletar(userId, encuestaId);
    }
}