import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRespuestaDto } from './dto/create-respuesta.dto';
import { UpdateRespuestaDto } from './dto/update-respuesta.dto';

@Injectable()
export class RespuestaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateRespuestaDto, userId: string) {
        const entrega = await this.prisma.entrega.findFirst({
            where: { id: dto.entregaId, encuesta: { user_id: userId } },
        });
        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        const pregunta = await this.prisma.pregunta.findFirst({
            where: { id: dto.preguntaId, encuesta: { user_id: userId } },
        });
        if (!pregunta) {
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        if (dto.opcionEncuestaId) {
            const opcion = await this.prisma.opcionEncuesta.findFirst({
                where: {
                    id: dto.opcionEncuestaId,
                    pregunta: { id: dto.preguntaId, encuesta: { user_id: userId } },
                },
            });
            if (!opcion) {
                throw new HttpException('Opción no válida o no pertenece a la pregunta', HttpStatus.FORBIDDEN);
            }
        }

        // Crear respuesta
        return this.prisma.respuesta.create({
            data: {
                texto: dto.texto,
                numero: dto.numero,
                recibido_en: dto.recibido_en || new Date(),
                entregaId: dto.entregaId,
                preguntaId: dto.preguntaId,
                opcionEncuestaId: dto.opcionEncuestaId,
            },
        });
    }

    async findAllByUser(userId: string) {
        return this.prisma.respuesta.findMany({
            where: {
                entrega: { encuesta: { user_id: userId } },
            },
            include: {
                pregunta: true,
                entrega: true,
                opcion_encuesta: true,
            },
            orderBy: { recibido_en: 'desc' },
        });
    }

    async findOneByUser(id: string, userId: string) {
        const respuesta = await this.prisma.respuesta.findFirst({
            where: { id, entrega: { encuesta: { user_id: userId } } },
            include: { pregunta: true, opcion_encuesta: true, entrega: true },
        });

        if (!respuesta) {
            throw new HttpException('Respuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return respuesta;
    }

    async updateByUser(id: string, userId: string, dto: UpdateRespuestaDto) {
        const respuesta = await this.prisma.respuesta.findFirst({
            where: { id, entrega: { encuesta: { user_id: userId } } },
        });

        if (!respuesta) {
            throw new HttpException('Respuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.respuesta.update({
            where: { id },
            data: dto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const respuesta = await this.prisma.respuesta.findFirst({
            where: { id, entrega: { encuesta: { user_id: userId } } },
        });

        if (!respuesta) {
            throw new HttpException('Respuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.respuesta.delete({ where: { id } });
    }
}
