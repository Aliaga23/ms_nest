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

    async getPreguntasConOpciones(entregaId: string, userId: string) {
        // Verificar que la entrega pertenece al usuario
        const entrega = await this.prisma.entrega.findFirst({
            where: { id: entregaId, encuesta: { user_id: userId } },
            include: {
                encuesta: true,
            },
        });

        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        // Obtener preguntas con opciones
        const preguntas = await this.prisma.pregunta.findMany({
            where: { encuestaId: entrega.encuestaId },
            include: {
                tipo_pregunta: true,
                opciones: true,
            },
            orderBy: { orden: 'asc' },
        });

        return {
            entregaId: entrega.id,
            encuesta: {
                id: entrega.encuesta.id,
                nombre: entrega.encuesta.nombre,
                descripcion: entrega.encuesta.descripcion,
            },
            preguntas: preguntas.map(p => ({
                id: p.id,
                texto: p.texto,
                orden: p.orden,
                obligatorio: p.obligatorio,
                tipo: {
                    id: p.tipo_pregunta.id,
                    nombre: p.tipo_pregunta.nombre,
                },
                opciones: p.opciones.map(o => ({
                    id: o.id,
                    texto: o.texto,
                    valor: o.valor,
                })),
            })),
        };
    }

    async getPreguntasConOpcionesPublic(entregaId: string) {
        // Obtener la entrega sin verificar permisos de usuario
        const entrega = await this.prisma.entrega.findUnique({
            where: { id: entregaId },
            include: {
                encuesta: true,
            },
        });

        if (!entrega) {
            throw new NotFoundException('Entrega no encontrada');
        }

        // Obtener preguntas con opciones
        const preguntas = await this.prisma.pregunta.findMany({
            where: { encuestaId: entrega.encuestaId },
            include: {
                tipo_pregunta: true,
                opciones: true,
            },
            orderBy: { orden: 'asc' },
        });

        return {
            entregaId: entrega.id,
            encuesta: {
                id: entrega.encuesta.id,
                nombre: entrega.encuesta.nombre,
                descripcion: entrega.encuesta.descripcion,
            },
            preguntas: preguntas.map(p => ({
                id: p.id,
                texto: p.texto,
                orden: p.orden,
                obligatorio: p.obligatorio,
                tipo: {
                    id: p.tipo_pregunta.id,
                    nombre: p.tipo_pregunta.nombre,
                },
                opciones: p.opciones.map(o => ({
                    id: o.id,
                    texto: o.texto,
                    valor: o.valor,
                })),
            })),
        };
    }

    async guardarRespuestas(
        entregaId: string,
        userId: string,
        respuestas: Array<{ preguntaId: string; opcionId?: string; texto?: string }>,
    ) {
        // Verificar que la entrega pertenece al usuario
        const entrega = await this.prisma.entrega.findFirst({
            where: { id: entregaId, encuesta: { user_id: userId } },
            include: {
                encuesta: {
                    include: {
                        preguntas: {
                            include: {
                                tipo_pregunta: true,
                            },
                        },
                    },
                },
            },
        });

        if (!entrega) {
            throw new HttpException('Entrega no encontrada o sin permisos', HttpStatus.FORBIDDEN);
        }

        // Verificar que la entrega no haya sido respondida
        const respuestasExistentes = await this.prisma.respuesta.findFirst({
            where: { entregaId },
        });

        if (respuestasExistentes) {
            throw new BadRequestException('Esta entrega ya ha sido respondida');
        }

        // Validar que todas las preguntas están en la encuesta
        const preguntasIds = entrega.encuesta.preguntas.map(p => p.id);
        for (const respuesta of respuestas) {
            if (!preguntasIds.includes(respuesta.preguntaId)) {
                throw new BadRequestException(
                    `La pregunta ${respuesta.preguntaId} no pertenece a esta encuesta`,
                );
            }
        }

        // Crear respuestas en transacción
        const respuestasCreadas = await this.prisma.$transaction(async (prisma) => {
            const respuestasData: any[] = [];

            for (const respuesta of respuestas) {
                const pregunta = entrega.encuesta.preguntas.find(p => p.id === respuesta.preguntaId);
                
                if (!pregunta) continue;

                // Validar según el tipo de pregunta
                const tipoNombre = pregunta.tipo_pregunta.nombre.toLowerCase();
                const esTexto = tipoNombre.includes('abierta') || tipoNombre.includes('completar');
                
                if (esTexto) {
                    // Preguntas de texto (Abierta, Completar, etc.)
                    if (!respuesta.texto || respuesta.texto.trim() === '') {
                        throw new BadRequestException(
                            `La pregunta "${pregunta.texto}" requiere una respuesta de texto`,
                        );
                    }
                } else {
                    // Para preguntas con opciones (Opción Única, Opción Múltiple, etc.)
                    if (!respuesta.opcionId) {
                        throw new BadRequestException(
                            `La pregunta "${pregunta.texto}" requiere seleccionar una opción`,
                        );
                    }

                    // Verificar que la opción pertenece a la pregunta
                    const opcionValida = await prisma.opcionEncuesta.findFirst({
                        where: {
                            id: respuesta.opcionId,
                            preguntaId: respuesta.preguntaId,
                        },
                    });

                    if (!opcionValida) {
                        throw new BadRequestException(
                            `La opción seleccionada no es válida para la pregunta "${pregunta.texto}"`,
                        );
                    }
                }

                const respuestaCreada = await prisma.respuesta.create({
                    data: {
                        entregaId,
                        preguntaId: respuesta.preguntaId,
                        opcionEncuestaId: respuesta.opcionId || null,
                        texto: respuesta.texto || null,
                        recibido_en: new Date(),
                    },
                    include: {
                        pregunta: true,
                        opcion_encuesta: true,
                    },
                });

                respuestasData.push(respuestaCreada);
            }

            // Actualizar la fecha de respuesta de la entrega
            await prisma.entrega.update({
                where: { id: entregaId },
                data: { respondido_en: new Date() },
            });

            return respuestasData;
        });

        return {
            message: 'Respuestas guardadas exitosamente',
            entregaId,
            totalRespuestas: respuestasCreadas.length,
            respuestas: respuestasCreadas.map(r => ({
                id: r.id,
                pregunta: r.pregunta.texto,
                opcion: r.opcion_encuesta?.texto || null,
                texto: r.texto,
                recibido_en: r.recibido_en,
            })),
        };
    }

    async guardarRespuestasPublic(
        entregaId: string,
        respuestas: Array<{ preguntaId: string; opcionId?: string; texto?: string }>,
    ) {
        // Obtener la entrega sin verificar permisos de usuario
        const entrega = await this.prisma.entrega.findUnique({
            where: { id: entregaId },
            include: {
                encuesta: {
                    include: {
                        preguntas: {
                            include: {
                                tipo_pregunta: true,
                            },
                        },
                    },
                },
            },
        });

        if (!entrega) {
            throw new NotFoundException('Entrega no encontrada');
        }

        // Verificar que la entrega no haya sido respondida
        const respuestasExistentes = await this.prisma.respuesta.findFirst({
            where: { entregaId },
        });

        if (respuestasExistentes) {
            throw new BadRequestException('Esta entrega ya ha sido respondida');
        }

        // Validar que todas las preguntas están en la encuesta
        const preguntasIds = entrega.encuesta.preguntas.map(p => p.id);
        for (const respuesta of respuestas) {
            if (!preguntasIds.includes(respuesta.preguntaId)) {
                throw new BadRequestException(
                    `La pregunta ${respuesta.preguntaId} no pertenece a esta encuesta`,
                );
            }
        }

        // VALIDAR ANTES DE LA TRANSACCIÓN para evitar timeout
        for (const respuesta of respuestas) {
            const pregunta = entrega.encuesta.preguntas.find(p => p.id === respuesta.preguntaId);
            if (!pregunta) continue;

            const tipoNombre = pregunta.tipo_pregunta.nombre.toLowerCase();
            const esTexto = tipoNombre.includes('abierta') || tipoNombre.includes('completar');
            
            if (esTexto) {
                if (!respuesta.texto || respuesta.texto.trim() === '') {
                    throw new BadRequestException(
                        `La pregunta "${pregunta.texto}" requiere una respuesta de texto`,
                    );
                }
            } else {
                if (!respuesta.opcionId) {
                    throw new BadRequestException(
                        `La pregunta "${pregunta.texto}" requiere seleccionar una opción`,
                    );
                }

                // Verificar que la opción pertenece a la pregunta
                const opcionValida = await this.prisma.opcionEncuesta.findFirst({
                    where: {
                        id: respuesta.opcionId,
                        preguntaId: respuesta.preguntaId,
                    },
                });

                if (!opcionValida) {
                    throw new BadRequestException(
                        `La opción seleccionada no es válida para la pregunta "${pregunta.texto}"`,
                    );
                }
            }
        }

        // Crear respuestas en transacción (solo inserts, sin validaciones)
        const respuestasCreadas = await this.prisma.$transaction(async (prisma) => {
            const respuestasData: any[] = [];

            for (const respuesta of respuestas) {
                const respuestaCreada = await prisma.respuesta.create({
                    data: {
                        entregaId,
                        preguntaId: respuesta.preguntaId,
                        opcionEncuestaId: respuesta.opcionId || null,
                        texto: respuesta.texto || null,
                        recibido_en: new Date(),
                    },
                    include: {
                        pregunta: true,
                        opcion_encuesta: true,
                    },
                });

                respuestasData.push(respuestaCreada);
            }

            // Actualizar la fecha de respuesta de la entrega
            await prisma.entrega.update({
                where: { id: entregaId },
                data: { respondido_en: new Date() },
            });

            return respuestasData;
        });

        return {
            message: 'Respuestas guardadas exitosamente',
            entregaId,
            totalRespuestas: respuestasCreadas.length,
            respuestas: respuestasCreadas.map(r => ({
                id: r.id,
                pregunta: r.pregunta.texto,
                opcion: r.opcion_encuesta?.texto || null,
                texto: r.texto,
                recibido_en: r.recibido_en,
            })),
        };
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

    async createBulkForAudio(createBulkDto: CreateBulkEntregaDto, userId: string) {
        const { encuestaId, cantidad } = createBulkDto;

        // Validar que la encuesta existe y pertenece al usuario
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: encuestaId, user_id: userId },
            include: {
                canal: true,
            },
        });

        if (!encuesta) {
            throw new NotFoundException('Encuesta no encontrada o sin permisos');
        }

        // Validar que el canal sea Audio
        if (encuesta.canal?.id !== 'b8c7779c-37c7-4331-8dd5-9f07c1a3ade0') {
            throw new BadRequestException('La encuesta debe tener el canal Audio');
        }

        // Crear un destinatario genérico para Audio si no existe
        let destinatarioAudio = await this.prisma.destinatario.findFirst({
            where: { 
                email: 'audio@system.local',
                user_id: userId 
            },
        });

        if (!destinatarioAudio) {
            destinatarioAudio = await this.prisma.destinatario.create({
                data: {
                    nombre: 'Audio System',
                    email: 'audio@system.local',
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
                    destinatarioId: destinatarioAudio.id,
                    enviado_en: new Date(),
                },
            });
            entregas.push(entrega);
        }

        return {
            message: 'Entregas de Audio creadas exitosamente',
            cantidad: entregas.length,
            encuestaId,
            entregas: entregas.map(e => ({
                id: e.id,
                enviado_en: e.enviado_en,
            })),
        };
    }

    async getBulkAudioEntregas(encuestaId: string, userId: string) {
        // Validar que la encuesta existe y pertenece al usuario
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id: encuestaId, user_id: userId },
            include: {
                canal: true,
            },
        });

        if (!encuesta) {
            throw new NotFoundException('Encuesta no encontrada o sin permisos');
        }

        // Validar que el canal sea Audio
        if (encuesta.canal?.id !== 'b8c7779c-37c7-4331-8dd5-9f07c1a3ade0') {
            throw new BadRequestException('La encuesta debe tener el canal Audio');
        }

        // Obtener todas las entregas de Audio
        const entregas = await this.prisma.entrega.findMany({
            where: {
                encuestaId,
                destinatario: {
                    email: 'audio@system.local'
                }
            },
            include: {
                respuestas: {
                    include: {
                        pregunta: true,
                        opcion_encuesta: true,
                    },
                },
            },
            orderBy: {
                enviado_en: 'asc',
            },
        });

        return {
            encuesta: {
                id: encuesta.id,
                nombre: encuesta.nombre,
                descripcion: encuesta.descripcion,
            },
            totalEntregas: entregas.length,
            entregasRespondidas: entregas.filter(e => e.respondido_en !== null).length,
            entregasPendientes: entregas.filter(e => e.respondido_en === null).length,
            entregas: entregas.map(e => ({
                id: e.id,
                enviado_en: e.enviado_en,
                respondido_en: e.respondido_en,
                estado: e.respondido_en ? 'Respondida' : 'Pendiente',
                totalRespuestas: e.respuestas.length,
            })),
        };
    }
}
