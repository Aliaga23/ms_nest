import { HttpException, HttpStatus, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { UpdateEntregaDto } from './dto/update-entrega.dto';
import { CreateBulkEntregaDto } from './dto/create-bulk-entrega.dto';
import { EmailService } from '../email/email.service';
import { generateEmailTemplate } from '../email/email.template';
import { ConfigService } from '@nestjs/config';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class EntregaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly pdfService: PdfService,
    ) { }

    async create(dto: CreateEntregaDto, userId: string) {
        // Verificar que la encuesta pertenece al usuario
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: dto.encuestaId, user_id: userId },
            include: {
                canal: true,
            },
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

        // Verificar si el canal de la encuesta es "E-mail" por nombre
        if (encuesta.canal?.nombre === 'E-mail') {
            const emailContent = generateEmailTemplate(destinatario.nombre, encuesta.nombre, entrega.id, this.configService);
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

    async createBulkForOCR(createBulkDto: CreateBulkEntregaDto, userId: string): Promise<{ entregas: any[], pdf: Buffer }> {
        const { encuestaId, cantidad } = createBulkDto;

        // Validar que la encuesta existe y pertenece al usuario
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: encuestaId, user_id: userId },
            include: {
                canal: true,
                campaña: true,
            },
        });

        if (!encuesta) {
            throw new NotFoundException('Encuesta no encontrada o sin permisos');
        }

        // Validar que el canal sea Ocr
        if (encuesta.canal?.nombre !== 'Ocr') {
            throw new BadRequestException('La encuesta debe tener el canal Ocr');
        }

        // Verificar si ya existen entregas OCR para esta encuesta
        const existingEntregas = await this.prisma.entrega.findFirst({
            where: { 
                encuestaId,
                destinatario: {
                    email: 'ocr@system.local'
                }
            },
        });

        if (existingEntregas) {
            throw new BadRequestException('Ya se han generado entregas OCR para esta encuesta. No se pueden crear más.');
        }

        // Obtener preguntas de la encuesta
        const preguntas = await this.prisma.pregunta.findMany({
            where: { encuestaId },
            include: {
                tipo_pregunta: true,
                opciones: true,
            },
            orderBy: { orden: 'asc' },
        });

        if (preguntas.length === 0) {
            throw new BadRequestException('La encuesta no tiene preguntas');
        }

        // Crear un destinatario genérico para OCR si no existe
        let destinatarioOCR = await this.prisma.destinatario.findFirst({
            where: { 
                email: 'ocr@system.local',
                user_id: userId 
            },
        });

        if (!destinatarioOCR) {
            destinatarioOCR = await this.prisma.destinatario.create({
                data: {
                    nombre: 'OCR System',
                    email: 'ocr@system.local',
                    telefono: '0000000000',
                    user_id: userId,
                },
            });
        }

        // Crear entregas en la base de datos
        const entregas: any[] = [];
        for (let i = 0; i < cantidad; i++) {
            const entrega = await this.prisma.entrega.create({
                data: {
                    encuestaId,
                    destinatarioId: destinatarioOCR.id,
                    enviado_en: new Date(),
                },
            });
            entregas.push(entrega);
        }

        // Generar PDF
        const pdfBuffer = await this.pdfService.generateSurveyPDF(
            encuesta,
            preguntas,
            entregas,
        );

        return {
            entregas,
            pdf: pdfBuffer,
        };
    }
}
