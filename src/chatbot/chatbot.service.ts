import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CampanaService } from '../campaña/campana.service';
import { EncuestaService } from '../encuesta/encuesta.service';
import { PreguntaService } from '../pregunta/pregunta.service';
import { TipoPreguntaService } from '../tipo_pregunta/tipo-pregunta.service';
import { CanalService } from '../canal/canal.service';
import { OpcionEncuestaService } from '../opcion-encuesta/opcion-encuesta.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ChatSession {
  messages: ChatCompletionMessageParam[];
  userId: string;
  createdAt: Date;
}

@Injectable()
export class ChatbotService {
  private openai: OpenAI;
  private sessions: Map<string, ChatSession> = new Map();
  private readonly systemPrompt = `Eres un asistente inteligente para un sistema de encuestas. Tu trabajo es:

1. Ayudar a los usuarios a crear campañas, encuestas y preguntas de manera conversacional.
2. Extraer información del usuario de forma natural y guiar el proceso.
3. Cuando tengas toda la información necesaria, responde SOLO con un JSON válido.

IMPORTANTE: 
- Para crear una campaña completa con encuestas y preguntas, usa la acción "create_all"
- Los tipo_preguntaId deben ser IDs reales de UUID, no nombres
- Si el usuario no proporciona los IDs, pregúntale que te los proporcione o usa estos IDs por defecto:
  - Para "Texto corto": usa un UUID genérico
  - Para "Texto largo": usa otro UUID genérico
  - Para "Opción única": usa otro UUID genérico
  - Para "Opción múltiple": usa otro UUID genérico
  - Para "Sí/No": usa otro UUID genérico

Cuando el usuario confirme que quiere crear todo, responde EXACTAMENTE con este formato JSON (sin markdown, sin \`\`\`json):
{
  "action": "create_all",
  "data": {
    "campaña": {
      "nombre": "Nombre de la campaña"
    },
    "encuesta": {
      "nombre": "Nombre de la encuesta",
      "descripcion": "Descripción de la encuesta"
    },
    "preguntas": [
      {
        "texto": "Texto de la pregunta",
        "tipo_preguntaId": "ID_UUID_DEL_TIPO",
        "obligatorio": true,
        "opciones": [
          {"texto": "Opción 1", "valor": "opcion1"}
        ]
      }
    ]
  }
}

Si necesitas más información, pregunta de forma amigable. Cuando generes el JSON, NO uses markdown, NO uses \`\`\`json, solo el JSON puro.`;

  constructor(
    private configService: ConfigService,
    private campanaService: CampanaService,
    private encuestaService: EncuestaService,
    private preguntaService: PreguntaService,
    private tipoPreguntaService: TipoPreguntaService,
    private canalService: CanalService,
    private opcionEncuestaService: OpcionEncuestaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async chat(mensaje: string, sessionId: string, userId: string): Promise<any> {
    const tiposPreguntas = await this.tipoPreguntaService.findAll();
    const canales = await this.canalService.findAll();
    
    const tiposMap = new Map(tiposPreguntas.map(t => [t.nombre.toLowerCase(), t.id]));
    const canalesMap = new Map(canales.map(c => [c.nombre.toLowerCase(), c.id]));

    let session = this.sessions.get(sessionId);
    if (!session) {
      const tiposInfo = tiposPreguntas.map(t => `- ${t.nombre}: ID="${t.id}"`).join('\n');
      const canalesInfo = canales.map(c => `- ${c.nombre}: ID="${c.id}"`).join('\n');
      const systemPromptWithIds = this.systemPrompt + `\n\nTIPOS DE PREGUNTA DISPONIBLES:\n${tiposInfo}\n\nCANALES DISPONIBLES:\n${canalesInfo}\n\nUSA ESTOS IDs EXACTOS en tipo_preguntaId y canalId.`;
      
      session = {
        messages: [{ role: 'system', content: systemPromptWithIds }],
        userId,
        createdAt: new Date(),
      };
      this.sessions.set(sessionId, session);
    }

    session.messages.push({ role: 'user', content: mensaje });

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: session.messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = response.choices[0].message.content;
      if (!assistantMessage) {
        throw new HttpException('No se recibió respuesta de ChatGPT', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      session.messages.push({ role: 'assistant', content: assistantMessage });

      let cleanMessage = assistantMessage.trim();
      if (cleanMessage.includes('```json')) {
        cleanMessage = cleanMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (cleanMessage.includes('```')) {
        cleanMessage = cleanMessage.replace(/```\n?/g, '').trim();
      }

      try {
        const jsonMatch = cleanMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0]);
          
          if (jsonResponse.action) {
            const result = await this.executeAction(jsonResponse, userId);
            return {
              message: 'Acción ejecutada exitosamente',
              action: jsonResponse.action,
              result,
              sessionId,
            };
          }
        }
      } catch (e) {
        console.log('No se pudo parsear JSON:', e.message);
      }

      return {
        response: assistantMessage,
        sessionId,
      };
    } catch (error) {
      console.error('Error en chat:', error);
      throw new HttpException(
        'Error al procesar el mensaje con ChatGPT',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async executeAction(jsonResponse: any, userId: string): Promise<any> {
    const { action, data } = jsonResponse;

    try {
      switch (action) {
        case 'create_campaña':
          return await this.campanaService.create(data.campaña, userId);

        case 'create_encuesta':
          const encuesta = await this.encuestaService.create(data.encuesta, userId);
          
          if (data.preguntas && data.preguntas.length > 0) {
            const preguntas: any[] = [];
            for (let i = 0; i < data.preguntas.length; i++) {
              const { opciones, ...preguntaData } = data.preguntas[i];
              const preguntaCompleta = {
                ...preguntaData,
                encuestaId: encuesta.id,
                orden: i + 1,
              };
              
              const pregunta = await this.preguntaService.create(preguntaCompleta, userId);
              
              if (opciones && opciones.length > 0) {
                const opcionesCreadas: any[] = [];
                for (const opcion of opciones) {
                  const opcionCreada = await this.opcionEncuestaService.create({
                    ...opcion,
                    preguntaId: pregunta.id,
                  }, userId);
                  opcionesCreadas.push(opcionCreada);
                }
                preguntas.push({ ...pregunta, opciones: opcionesCreadas });
              } else {
                preguntas.push(pregunta);
              }
            }
            return { encuesta, preguntas };
          }
          return { encuesta };

        case 'create_all':
          const nuevaCampaña = await this.campanaService.create(data.campaña, userId);
          
          const nuevaEncuesta = await this.encuestaService.create({
            ...data.encuesta,
            campañaId: nuevaCampaña.id,
          }, userId);
          
          const nuevasPreguntas: any[] = [];
          if (data.preguntas && data.preguntas.length > 0) {
            for (let i = 0; i < data.preguntas.length; i++) {
              const { opciones: opcionesNuevas, ...preguntaData } = data.preguntas[i];
              const preguntaCompleta = {
                ...preguntaData,
                encuestaId: nuevaEncuesta.id,
                orden: i + 1,
              };
              
              const nuevaPregunta = await this.preguntaService.create(preguntaCompleta, userId);
              
              if (opcionesNuevas && opcionesNuevas.length > 0) {
                const opcionesCreadas: any[] = [];
                for (const opcion of opcionesNuevas) {
                  const opcionCreada = await this.opcionEncuestaService.create({
                    ...opcion,
                    preguntaId: nuevaPregunta.id,
                  }, userId);
                  opcionesCreadas.push(opcionCreada);
                }
                nuevasPreguntas.push({ ...nuevaPregunta, opciones: opcionesCreadas });
              } else {
                nuevasPreguntas.push(nuevaPregunta);
              }
            }
          }
          
          return {
            campaña: nuevaCampaña,
            encuesta: nuevaEncuesta,
            preguntas: nuevasPreguntas,
          };

        default:
          throw new Error(`Acción desconocida: ${action}`);
      }
    } catch (error) {
      throw new HttpException(
        `Error al ejecutar la acción: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
