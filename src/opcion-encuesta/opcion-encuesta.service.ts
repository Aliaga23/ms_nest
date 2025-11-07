import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpcionEncuestaDto } from './dto/create-opcion-encuesta.dto';
import { UpdateOpcionEncuestaDto } from './dto/update-opcion-encuesta.dto';

@Injectable()
export class OpcionEncuestaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateOpcionEncuestaDto, userId: string) {
        // Verificar que la pregunta pertenece al usuario
        const pregunta = await this.prisma.pregunta.findFirst({
            where: { id: dto.preguntaId, encuesta: { user_id: userId } },
        });

        if (!pregunta) {
            throw new HttpException('Pregunta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.opcionEncuesta.create({
            data: dto,
        });
    }

    async findAllByUser(userId: string) {
        return this.prisma.opcionEncuesta.findMany({
            where: {
                pregunta: {
                    encuesta: {
                        user_id: userId,
                    },
                },
            },
            include: {
                pregunta: true,
            },
            orderBy: { texto: 'asc' },
        });
    }

    async findOneByUser(id: string, userId: string) {
        const opcion = await this.prisma.opcionEncuesta.findFirst({
            where: { id, pregunta: { encuesta: { user_id: userId } } },
            include: { pregunta: true },
        });

        if (!opcion) {
            throw new HttpException('Opción no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return opcion;
    }

    async updateByUser(id: string, userId: string, dto: UpdateOpcionEncuestaDto) {
        const opcion = await this.prisma.opcionEncuesta.findFirst({
            where: { id, pregunta: { encuesta: { user_id: userId } } },
        });

        if (!opcion) {
            throw new HttpException('Opción no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.opcionEncuesta.update({
            where: { id },
            data: dto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const opcion = await this.prisma.opcionEncuesta.findFirst({
            where: { id, pregunta: { encuesta: { user_id: userId } } },
        });

        if (!opcion) {
            throw new HttpException('Opción no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.opcionEncuesta.delete({ where: { id } });
    }
}
