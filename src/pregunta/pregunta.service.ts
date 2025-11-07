import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';

@Injectable()
export class PreguntaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePreguntaDto, userId: string) {
        return this.prisma.pregunta.create({
            data: {
                orden: dto.orden,
                texto: dto.texto,
                obligatorio: dto.obligatorio,
                encuestaId: dto.encuestaId,
                tipo_preguntaId: dto.tipo_preguntaId,
            },
        });
    }


    async findAllByUser(userId: string) {
        return this.prisma.pregunta.findMany({
            where: {
                encuesta: {
                    user_id: userId,
                },
            },
            orderBy: { orden: 'asc' },
        });
    }

    async findOneByUser(id: string, userId: string) {
        return this.prisma.pregunta.findFirst({
            where: {
                id,
                encuesta: {
                    user_id: userId,
                },
            },
        });
    }

    async updateByUser(id: string, userId: string, dto: UpdatePreguntaDto) {
        const pregunta = await this.prisma.pregunta.findFirst({
            where: { id, encuesta: { user_id: userId } },
        });
        if (!pregunta) {
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.pregunta.update({
            where: { id },
            data: dto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const pregunta = await this.prisma.pregunta.findFirst({
            where: { id, encuesta: { user_id: userId } },
        });
        if (!pregunta) {
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.pregunta.delete({
            where: { id },
        });
    }

    async findByEncuesta(encuestaId: string, userId: string) {
        // Verificar que la encuesta pertenece al usuario autenticado
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: encuestaId, user_id: userId },
        });

        if (!encuesta) {
            throw new HttpException(
                'Encuesta no encontrada o sin permisos',
                HttpStatus.FORBIDDEN,
            );
        }

        // Retornar preguntas con su tipo y opciones
        return this.prisma.pregunta.findMany({
            where: { encuestaId },
            include: {
                tipo_pregunta: true,
                opciones: true,
            },
            orderBy: { orden: 'asc' },
        });
    }

}
