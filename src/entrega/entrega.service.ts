import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { UpdateEntregaDto } from './dto/update-entrega.dto';
import { EmailService } from '../email/email.service';
import { generateEmailTemplate } from '../email/email.template';

@Injectable()
export class EntregaService {
    constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) { }

    async create(dto: CreateEntregaDto, userId: string) {
        // Verificar que la encuesta pertenece al usuario
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: dto.encuestaId, user_id: userId },
        });
        if (!encuesta) {
            throw new HttpException('Encuesta no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        // Verificar que el destinatario pertenece al usuario
        const destinatario = await this.prisma.destinatario.findFirst({
            where: { id: dto.destinatarioId, user_id: userId },
        });
        if (!destinatario) {
            throw new HttpException('Destinatario no encontrado o sin permisos', HttpStatus.FORBIDDEN);
        }

        const entrega = await this.prisma.entrega.create({
            data: dto,
        });

        // Verificar si el canal de la encuesta es "e-mail"
        if (encuesta.canalId === 'c06a090c-2997-429f-b4c4-45928529bfd8') {
            const emailContent = generateEmailTemplate(destinatario.nombre, encuesta.nombre, entrega.id);

            await this.emailService.sendEmail(destinatario.email, `Te invitamos a responder una encuesta: ${encuesta.nombre}`, emailContent);
        }

        return entrega;
    }

    async findAllByUser(userId: string) {
        return this.prisma.entrega.findMany({
            where: {
                encuesta: { user_id: userId },
            },
            include: {
                encuesta: true,
                destinatario: true,
            },
            orderBy: { enviado_en: 'desc' },
        });
    }

    async findOneByUser(id: string, userId: string) {
        const entrega = await this.prisma.entrega.findFirst({
            where: { id, encuesta: { user_id: userId } },
            include: { encuesta: true, destinatario: true, respuestas: true },
        });

        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return entrega;
    }

    async updateByUser(id: string, userId: string, dto: UpdateEntregaDto) {
        const entrega = await this.prisma.entrega.findFirst({
            where: { id, encuesta: { user_id: userId } },
        });

        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.entrega.update({
            where: { id },
            data: dto,
        });
    }

    async removeByUser(id: string, userId: string) {
        const entrega = await this.prisma.entrega.findFirst({
            where: { id, encuesta: { user_id: userId } },
        });

        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        return this.prisma.entrega.delete({ where: { id } });
    }
}
