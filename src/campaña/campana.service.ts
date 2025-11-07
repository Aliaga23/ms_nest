import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';

@Injectable()
export class CampanaService {
    constructor(private readonly prisma: PrismaService) { }

    create(createCampanaDto: CreateCampanaDto, userId: string) {
        return this.prisma.campaña.create({
            data: {
                ...createCampanaDto,
                user_id: userId,
            },
        });
    }

    findAllByUser(userId: string) {
        return this.prisma.campaña.findMany({
            where: { user_id: userId },
            orderBy: { creado_en: 'desc' },
        });
    }

    findOneByUser(id: string, userId: string) {
        return this.prisma.campaña.findFirst({
            where: { id, user_id: userId },
        });
    }

    async updateByUser(id: string, userId: string, updateCampanaDto: UpdateCampanaDto) {
        const campaña = await this.prisma.campaña.findFirst({ where: { id, user_id: userId } });
        if (!campaña) {
            throw new HttpException('Campaña no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.campaña.update({
            where: { id },
            data: updateCampanaDto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const campaña = await this.prisma.campaña.findFirst({ where: { id, user_id: userId } });
        if (!campaña) {
            throw new HttpException('Campaña no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }
        return this.prisma.campaña.delete({
            where: { id },
        });
    }
}
