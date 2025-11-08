import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ingestarEmpresas(payload: any[]) {
    const detalle: any[] = [];
    let procesadas = 0;

    // Pre-cargar Canal "Ocr"
    const canalOcr = await this.prisma.canal.findFirst({
      where: { nombre: 'Ocr' },
    });

    if (!canalOcr) {
      throw new BadRequestException('El canal "Ocr" no existe en la base de datos');
    }

    // Pre-cargar tipos de pregunta
    const tiposPregunta = await this.prisma.tipoPregunta.findMany({
      where: {
        nombre: { in: ['Opción Múltiple', 'Completar', 'Opción Única'] },
      },
    });

    const tiposPreguntaMap = new Map(tiposPregunta.map((t) => [t.nombre, t.id]));

    // Procesar cada empresa
    for (const empresaData of payload) {
      try {
        this.validarReglasDeNegocio(empresaData, tiposPreguntaMap);
        const resultado = await this.procesarEmpresa(empresaData, canalOcr.id, tiposPreguntaMap);
        detalle.push(resultado);
        procesadas++;
      } catch (error: any) {
        this.logger.error(`Error procesando empresa ${empresaData.empresa.id}: ${error.message}`);
        detalle.push({
          empresaId: empresaData.empresa.id,
          empresaNombre: empresaData.empresa.nombre,
          status: 'failed',
          error: error.message,
          rolled_back: true,
        });
      }
    }

    return { ok: true, procesadas, detalle };
  }

  private async procesarEmpresa(
    empresaData: any,
    canalOcrId: string,
    tiposPreguntaMap: Map<string, string>
  ) {
    const userId = empresaData.empresa.id;
    const campanaNombre = empresaData.campaña.nombre;

    // Buscar o crear campaña
    let campana = await this.prisma.campaña.findFirst({
      where: { user_id: userId, nombre: campanaNombre },
    });

    if (!campana) {
      campana = await this.prisma.campaña.create({
        data: { nombre: campanaNombre, user_id: userId },
      });
    }

    const encuestasResultado: any[] = [];

    for (const encuestaData of empresaData.campaña.encuestas) {
      // Buscar o crear encuesta
      let encuesta = await this.prisma.encuesta.findFirst({
        where: { campañaId: campana.id, nombre: encuestaData.nombre },
      });

      if (!encuesta) {
        encuesta = await this.prisma.encuesta.create({
          data: {
            nombre: encuestaData.nombre,
            descripcion: encuestaData.descripcion,
            activo: encuestaData.activo,
            campañaId: campana.id,
            canalId: canalOcrId,
            user_id: userId,
          },
        });
      } else {
        encuesta = await this.prisma.encuesta.update({
          where: { id: encuesta.id },
          data: {
            descripcion: encuestaData.descripcion,
            activo: encuestaData.activo,
          },
        });
      }

      let preguntasCreadas = 0;
      let preguntasActualizadas = 0;
      let opcionesCreadas = 0;
      let opcionesActualizadas = 0;

      // Obtener todas las preguntas existentes de esta encuesta de una vez
      const preguntasExistentes = await this.prisma.pregunta.findMany({
        where: { encuestaId: encuesta.id },
        include: { opciones: true },
      });

      for (const preguntaData of encuestaData.preguntas) {
        const tipoPreguntaId = tiposPreguntaMap.get(preguntaData.tipo_preguntaId);

        // Buscar pregunta existente por orden
        const preguntaExistente = preguntasExistentes.find((p) => p.orden === preguntaData.orden);

        let pregunta;
        if (!preguntaExistente) {
          pregunta = await this.prisma.pregunta.create({
            data: {
              texto: preguntaData.texto,
              obligatorio: preguntaData.obligatorio,
              orden: preguntaData.orden,
              encuestaId: encuesta.id,
              tipo_preguntaId: tipoPreguntaId!,
            },
          });
          preguntasCreadas++;
        } else {
          pregunta = await this.prisma.pregunta.update({
            where: { id: preguntaExistente.id },
            data: {
              texto: preguntaData.texto,
              obligatorio: preguntaData.obligatorio,
              tipo_preguntaId: tipoPreguntaId!,
            },
          });
          preguntasActualizadas++;
        }

        // Procesar opciones si aplica
        if (preguntaData.opciones && preguntaData.opciones.length > 0) {
          const opcionesExistentes = preguntaExistente?.opciones || [];
          const valoresNuevos = new Set(preguntaData.opciones.map((o: any) => o.valor));

          // Actualizar o crear opciones
          for (const opcionData of preguntaData.opciones) {
            const opcionExistente = opcionesExistentes.find((o) => o.valor === opcionData.valor);

            if (opcionExistente) {
              await this.prisma.opcionEncuesta.update({
                where: { id: opcionExistente.id },
                data: { texto: opcionData.texto },
              });
              opcionesActualizadas++;
            } else {
              await this.prisma.opcionEncuesta.create({
                data: {
                  texto: opcionData.texto,
                  valor: opcionData.valor,
                  preguntaId: pregunta.id,
                },
              });
              opcionesCreadas++;
            }
          }

          // Eliminar opciones sobrantes
          const idsAEliminar = opcionesExistentes
            .filter((o) => !valoresNuevos.has(o.valor))
            .map((o) => o.id);

          if (idsAEliminar.length > 0) {
            await this.prisma.opcionEncuesta.deleteMany({
              where: { id: { in: idsAEliminar } },
            });
          }
        }
      }

      encuestasResultado.push({
        id: encuesta.id,
        nombre: encuesta.nombre,
        preguntas_creadas: preguntasCreadas,
        preguntas_actualizadas: preguntasActualizadas,
        opciones_creadas: opcionesCreadas,
        opciones_actualizadas: opcionesActualizadas,
      });
    }

    return {
      empresaId: empresaData.empresa.id,
      empresaNombre: empresaData.empresa.nombre,
      status: 'success',
      campaña: { id: campana.id, nombre: campana.nombre },
      encuestas: encuestasResultado,
      warnings: [],
    };
  }

  private validarReglasDeNegocio(empresaData: any, tiposPreguntaMap: Map<string, string>) {
    if (empresaData.campaña.encuestas.length !== 3) {
      throw new BadRequestException(`La campaña debe tener exactamente 3 encuestas`);
    }

    const tiposEsperados = ['Opción Múltiple', 'Completar', 'Opción Única', 'Completar', 'Completar'];

    for (const encuesta of empresaData.campaña.encuestas) {
      if (encuesta.preguntas.length !== 5) {
        throw new BadRequestException(`La encuesta "${encuesta.nombre}" debe tener exactamente 5 preguntas`);
      }

      if (encuesta.canal !== 'Ocr') {
        throw new BadRequestException(`El canal debe ser "Ocr"`);
      }

      encuesta.preguntas.forEach((pregunta: any, index: number) => {
        if (pregunta.orden !== index + 1) {
          throw new BadRequestException(`La pregunta ${index + 1} debe tener orden ${index + 1}`);
        }

        if (pregunta.tipo_preguntaId !== tiposEsperados[index]) {
          throw new BadRequestException(
            `La pregunta ${index + 1} debe ser "${tiposEsperados[index]}", recibido: "${pregunta.tipo_preguntaId}"`
          );
        }

        if (!tiposPreguntaMap.has(pregunta.tipo_preguntaId)) {
          throw new BadRequestException(`Tipo de pregunta inválido: "${pregunta.tipo_preguntaId}"`);
        }

        if (pregunta.tipo_preguntaId === 'Opción Múltiple' || pregunta.tipo_preguntaId === 'Opción Única') {
          if (!pregunta.opciones || pregunta.opciones.length !== 3) {
            throw new BadRequestException(`La pregunta ${index + 1} debe tener exactamente 3 opciones`);
          }
        }

        if (pregunta.tipo_preguntaId === 'Completar' && pregunta.opciones && pregunta.opciones.length > 0) {
          throw new BadRequestException(`La pregunta ${index + 1} de tipo "Completar" no debe tener opciones`);
        }
      });
    }
  }
}
