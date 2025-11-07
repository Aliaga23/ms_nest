import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { UpdateEncuestaDto } from './dto/update-encuesta.dto';

@Injectable()
export class EncuestaService {
    constructor(private readonly prisma: PrismaService) { }

    create(createEncuestaDto: CreateEncuestaDto, userId: string) {
        return this.prisma.encuesta.create({
            data: {
                ...createEncuestaDto,
                user_id: userId,
            },
        });
    }

    findAllByUser(userId: string) {
        return this.prisma.encuesta.findMany({
            where: { user_id: userId },
            orderBy: { creado_en: 'desc' },
        });
    }

    findOneByUser(id: string, userId: string) {
        return this.prisma.encuesta.findFirst({
            where: { id, user_id: userId },
        });
    }

    async updateByUser(id: string, userId: string, updateEncuestaDto: UpdateEncuestaDto) {
        const encuesta = await this.prisma.encuesta.findFirst({ where: { id, user_id: userId } });
        if (!encuesta) {
            throw new HttpException('Encuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.encuesta.update({
            where: { id },
            data: updateEncuestaDto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const encuesta = await this.prisma.encuesta.findFirst({ where: { id, user_id: userId } });
        if (!encuesta) {
            throw new HttpException('Encuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.encuesta.delete({
            where: { id },
        });
    }
}
