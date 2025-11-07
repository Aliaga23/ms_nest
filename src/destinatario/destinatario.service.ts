import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';

@Injectable()
export class DestinatarioService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateDestinatarioDto, userId: string) {
        return this.prisma.destinatario.create({
            data: {
                ...dto,
                user_id: userId,
            },
        });
    }

    async findAllByUser(userId: string) {
        return this.prisma.destinatario.findMany({
            where: { user_id: userId },
            orderBy: { creado_en: 'desc' },
        });
    }

    async findOneByUser(id: string, userId: string) {
        const destinatario = await this.prisma.destinatario.findFirst({
            where: { id, user_id: userId },
        });

        if (!destinatario) {
            throw new HttpException('Destinatario no encontrado o sin permisos', HttpStatus.FORBIDDEN);
        }

        return destinatario;
    }

    async updateByUser(id: string, userId: string, dto: UpdateDestinatarioDto) {
        const destinatario = await this.prisma.destinatario.findFirst({
            where: { id, user_id: userId },
        });

        if (!destinatario) {
            throw new HttpException('Destinatario no encontrado o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.destinatario.update({
            where: { id },
            data: dto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const destinatario = await this.prisma.destinatario.findFirst({
            where: { id, user_id: userId },
        });

        if (!destinatario) {
            throw new HttpException('Destinatario no encontrado o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.destinatario.delete({
            where: { id },
        });
    }
}
