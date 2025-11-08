import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { UpdateEncuestaDto } from './dto/update-encuesta.dto';
import { ChatgptService } from '../gemini/chatgpt.service';

@Injectable()
export class EncuestaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly chatgptService: ChatgptService,
    ) { }

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

    async generarJson(
        encuestaId: string,
        userId: string,
        body?: { empresaId?: string; destinatarios?: number }
    ) {
        const numDestinatarios = body?.destinatarios || 10;

        // 1. Traer encuesta con preguntas y opciones (sin filtrar por user_id)
        const encuesta = await this.prisma.encuesta.findUnique({
            where: { id: encuestaId },
            include: {
                preguntas: {
                    include: {
                        tipo_pregunta: true,
                        opciones: true,
                    },
                    orderBy: { orden: 'asc' },
                },
            },
        });

        if (!encuesta) {
            throw new HttpException(
                `Encuesta con ID ${encuestaId} no encontrada`,
                HttpStatus.NOT_FOUND
            );
        }

        if (!encuesta.preguntas || encuesta.preguntas.length === 0) {
            throw new HttpException('La encuesta no tiene preguntas', HttpStatus.BAD_REQUEST);
        }

        // 2. Validar tipos de pregunta
        const tiposValidos = ['Completar', 'Opción Múltiple', 'Opción Única'];
        for (const pregunta of encuesta.preguntas) {
            if (!tiposValidos.includes(pregunta.tipo_pregunta.nombre)) {
                throw new HttpException(
                    `Tipo de pregunta inválido: ${pregunta.tipo_pregunta.nombre}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        // 3. Generar destinatarios únicos
        const destinatarios = this.generarDestinatariosUnicos(numDestinatarios);

        // 4. Generar entregas con respuestas
        const entregas: any[] = [];
        
        for (let i = 0; i < destinatarios.length; i++) {
            const destinatario = destinatarios[i];
            const preguntas: any[] = [];
            
            // Agregar un seed aleatorio único para cada destinatario
            const seedUnico = `Respuesta ${i + 1}-${Date.now()}-${Math.random()}`;

            for (const pregunta of encuesta.preguntas) {
                const tipoPregunta = pregunta.tipo_pregunta.nombre;
                let respuestas: any[] = [];

                if (tipoPregunta === 'Completar') {
                    // Generar texto con OpenAI usando seed único para diversidad
                    const textoRespuesta = await this.chatgptService.generateTextCompletar(
                        pregunta.texto,
                        seedUnico
                    );
                    respuestas = [{ texto: textoRespuesta }];
                } else if (tipoPregunta === 'Opción Múltiple') {
                    // Seleccionar 2 opciones distintas
                    const opcionesIds = pregunta.opciones.map(o => o.id);
                    if (opcionesIds.length < 2) {
                        throw new HttpException(
                            `La pregunta "${pregunta.texto}" debe tener al menos 2 opciones`,
                            HttpStatus.BAD_REQUEST
                        );
                    }
                    const seleccionadas = this.seleccionarOpcionesAleatorias(opcionesIds, 2);
                    respuestas = seleccionadas.map(id => ({ opcionEncuestaId: id }));
                } else if (tipoPregunta === 'Opción Única') {
                    // Seleccionar 1 opción al azar
                    const opcionesIds = pregunta.opciones.map(o => o.id);
                    if (opcionesIds.length === 0) {
                        throw new HttpException(
                            `La pregunta "${pregunta.texto}" debe tener al menos 1 opción`,
                            HttpStatus.BAD_REQUEST
                        );
                    }
                    const seleccionada = opcionesIds[Math.floor(Math.random() * opcionesIds.length)];
                    respuestas = [{ opcionEncuestaId: seleccionada }];
                }

                preguntas.push({
                    preguntaId: pregunta.id,
                    respuestas,
                });
            }

            entregas.push({
                destinatario,
                preguntas,
            });
        }

        // 5. Construir respuesta JSON
        const jsonRespuesta = {
            encuesta: {
                encuestaId: encuesta.id,
                empresaId: body?.empresaId || encuesta.user_id,
                entregas,
            },
        };

        // 6. Poblar la base de datos
        const resultadoPoblacion = await this.poblarBaseDeDatos(jsonRespuesta, userId);

        // 7. Retornar JSON + resumen de población
        return {
            ...jsonRespuesta,
            poblacion: resultadoPoblacion,
        };
    }

    private async poblarBaseDeDatos(jsonData: any, userId: string) {
        const destinatariosCreados: string[] = [];
        const entregasCreadas: string[] = [];
        const respuestasCreadas: string[] = [];

        for (const entregaData of jsonData.encuesta.entregas) {
            // 1. Crear o buscar destinatario
            let destinatario = await this.prisma.destinatario.findFirst({
                where: {
                    email: entregaData.destinatario.email,
                    user_id: userId,
                },
            });

            if (!destinatario) {
                destinatario = await this.prisma.destinatario.create({
                    data: {
                        nombre: entregaData.destinatario.nombre,
                        telefono: entregaData.destinatario.telefono,
                        email: entregaData.destinatario.email,
                        user_id: userId,
                    },
                });
                destinatariosCreados.push(destinatario.id);
            }

            // 2. Crear entrega
            const entrega = await this.prisma.entrega.create({
                data: {
                    encuestaId: jsonData.encuesta.encuestaId,
                    destinatarioId: destinatario.id,
                    enviado_en: new Date(),
                },
            });
            entregasCreadas.push(entrega.id);

            // 3. Crear respuestas
            for (const preguntaData of entregaData.preguntas) {
                for (const respuestaData of preguntaData.respuestas) {
                    const respuesta = await this.prisma.respuesta.create({
                        data: {
                            entregaId: entrega.id,
                            preguntaId: preguntaData.preguntaId,
                            texto: respuestaData.texto || null,
                            opcionEncuestaId: respuestaData.opcionEncuestaId || null,
                            recibido_en: new Date(),
                        },
                    });
                    respuestasCreadas.push(respuesta.id);
                }
            }
        }

        return {
            destinatarios_creados: destinatariosCreados.length,
            entregas_creadas: entregasCreadas.length,
            respuestas_creadas: respuestasCreadas.length,
        };
    }

    private generarDestinatariosUnicos(cantidad: number) {
        const destinatarios: any[] = [];
        const telefonosUsados = new Set<string>();
        const emailsUsados = new Set<string>();

        const nombres = [
            'Carlos Fernández', 'María López', 'Jorge Rojas', 'Ana Méndez',
            'Luis Vargas', 'Sofía Camacho', 'Ricardo Salinas', 'Valeria Ortiz',
            'Diego Pereira', 'Paola Guzmán', 'Roberto Sánchez', 'Laura Morales',
            'Fernando Castro', 'Isabel Navarro', 'Martín Herrera', 'Claudia Reyes',
            'Pablo Ramos', 'Gabriela Torres', 'Andrés Delgado', 'Carolina Vega',
            'Sebastián Flores', 'Daniela Campos', 'Javier Medina', 'Natalia Silva',
            'Eduardo Romero', 'Marcela Guerrero', 'Rodrigo Castillo', 'Verónica Núñez',
            'Alejandro Díaz', 'Camila Paredes', 'Gustavo Ríos', 'Beatriz Soto',
            'Héctor Ponce', 'Mónica Aguilar', 'Raúl Mendoza', 'Patricia Chávez',
            'Alberto Cruz', 'Rosa Fuentes', 'Miguel Araya', 'Cecilia Bravo',
            'Julio Montoya', 'Diana Escobar', 'Francisco Leiva', 'Andrea Muñoz',
            'Tomás Acosta', 'Silvia Cortés', 'Ignacio Vera', 'Lucía Maldonado',
        ];

        const apellidos = [
            'Fernández', 'López', 'Rojas', 'Méndez', 'Vargas', 'Camacho',
            'Salinas', 'Ortiz', 'Pereira', 'Guzmán', 'Sánchez', 'Morales',
            'Castro', 'Navarro', 'Herrera', 'Reyes', 'Ramos', 'Torres',
            'Delgado', 'Vega', 'Flores', 'Campos', 'Medina', 'Silva',
            'Romero', 'Guerrero', 'Castillo', 'Núñez', 'Díaz', 'Paredes',
        ];

        const nombresSimples = [
            'Carlos', 'María', 'Jorge', 'Ana', 'Luis', 'Sofía', 'Ricardo',
            'Valeria', 'Diego', 'Paola', 'Roberto', 'Laura', 'Fernando',
            'Isabel', 'Martín', 'Claudia', 'Pablo', 'Gabriela', 'Andrés',
            'Carolina', 'Sebastián', 'Daniela', 'Javier', 'Natalia', 'Eduardo',
            'Marcela', 'Rodrigo', 'Verónica', 'Alejandro', 'Camila',
        ];

        for (let i = 0; i < cantidad; i++) {
            let telefono, email;

            // Generar nombre aleatorio (combinar nombre + apellido)
            const nombreAleatorio = nombresSimples[Math.floor(Math.random() * nombresSimples.length)];
            const apellidoAleatorio = apellidos[Math.floor(Math.random() * apellidos.length)];
            const nombre = `${nombreAleatorio} ${apellidoAleatorio}`;

            // Generar teléfono único (+59170000000 a +59179999999)
            do {
                const num = 70000000 + Math.floor(Math.random() * 10000000);
                telefono = `+591${num}`;
            } while (telefonosUsados.has(telefono));
            telefonosUsados.add(telefono);

            // Generar email ÚNICO con timestamp y random para garantizar unicidad global
            do {
                const nombreParts = nombreAleatorio.toLowerCase();
                const apellidoParts = apellidoAleatorio.toLowerCase();
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 100000);
                const uniqueId = `${timestamp}${randomNum}`;
                email = `${nombreParts}.${apellidoParts}.${uniqueId}@gmail.com`;
            } while (emailsUsados.has(email));
            emailsUsados.add(email);

            destinatarios.push({ nombre, telefono, email });
        }

        return destinatarios;
    }

    private seleccionarOpcionesAleatorias(opciones: string[], cantidad: number): string[] {
        const shuffled = [...opciones].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(cantidad, opciones.length));
    }

    async generarJsonMasivo(
        encuestas: { encuestaId: string; destinatarios: number }[],
        userId: string
    ) {
        const resultados: Array<{
            encuestaId: string;
            status: 'success' | 'error';
            poblacion?: { destinatarios_creados: number; entregas_creadas: number; respuestas_creadas: number };
            error?: string;
        }> = [];
        let totalDestinatarios = 0;
        let totalEntregas = 0;
        let totalRespuestas = 0;

        for (const encuestaConfig of encuestas) {
            try {
                const resultado = await this.generarJson(
                    encuestaConfig.encuestaId,
                    userId,
                    { destinatarios: encuestaConfig.destinatarios }
                );

                resultados.push({
                    encuestaId: encuestaConfig.encuestaId,
                    status: 'success',
                    poblacion: resultado.poblacion,
                });

                totalDestinatarios += resultado.poblacion.destinatarios_creados;
                totalEntregas += resultado.poblacion.entregas_creadas;
                totalRespuestas += resultado.poblacion.respuestas_creadas;
            } catch (error) {
                resultados.push({
                    encuestaId: encuestaConfig.encuestaId,
                    status: 'error',
                    error: error.message,
                });
            }
        }

        return {
            resumen: {
                encuestas_procesadas: resultados.length,
                encuestas_exitosas: resultados.filter(r => r.status === 'success').length,
                encuestas_fallidas: resultados.filter(r => r.status === 'error').length,
                total_destinatarios_creados: totalDestinatarios,
                total_entregas_creadas: totalEntregas,
                total_respuestas_creadas: totalRespuestas,
            },
            detalle: resultados,
        };
    }
}
