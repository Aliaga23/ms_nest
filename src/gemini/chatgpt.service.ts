import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatgptService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateTextCompletar(preguntaTexto: string, contexto?: string): Promise<string> {
    // Si hay API key, usar OpenAI
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un experto que responde encuestas de forma breve, específica y ÚNICA.
IMPORTANTE: Cada respuesta debe ser COMPLETAMENTE DIFERENTE a las anteriores.
- Usa vocabulario variado y diverso
- Varía los datos numéricos significativamente
- Cambia el enfoque y perspectiva en cada respuesta
- Máximo 20 palabras
- NUNCA digas "no aplica" o similares
- Responde de forma natural y conversacional
- No debes responder nunca con una pregunta`
            },
            {
              role: 'user',
              content: `${contexto ? contexto + ' - ' : ''}${preguntaTexto}`
            }
          ],
          temperature: 1.3, // Balance entre creatividad y coherencia
          max_tokens: 60,
          presence_penalty: 0.8, // Penaliza repetición moderadamente
          frequency_penalty: 0.8, // Penaliza patrones repetitivos
        });

        const text = completion.choices[0]?.message?.content?.trim() || '';
        return text;
      } catch (error) {
        console.warn('Error llamando a OpenAI, usando fallback:', error.message);
        return this.generateFallbackText(preguntaTexto);
      }
    }

    // Fallback sin API key
    return this.generateFallbackText(preguntaTexto);
  }

  private generateFallbackText(preguntaTexto: string): string {
    // Generar respuesta básica pero específica basada en la pregunta
    const lower = preguntaTexto.toLowerCase();
    
    if (lower.includes('velocidad') || lower.includes('cpm') || lower.includes('producción')) {
      return `Promedio ${35 + Math.floor(Math.random() * 15)} CPM con variación ±${2 + Math.floor(Math.random() * 4)} unidades`;
    }
    
    if (lower.includes('ros') || lower.includes('comunicación') || lower.includes('qos')) {
      return `QoS ${['RELIABLE', 'BEST_EFFORT'][Math.floor(Math.random() * 2)]} con depth=${5 + Math.floor(Math.random() * 10)}`;
    }
    
    if (lower.includes('problema') || lower.includes('incidente') || lower.includes('fallo')) {
      const problemas = [
        'Vibración leve en eje X, ajustado con tensores',
        'Caída de red momentánea, UPS activado correctamente',
        'Sobrecalentamiento por polvo, limpieza realizada',
        'Atasco en línea B por pieza defectuosa',
      ];
      return problemas[Math.floor(Math.random() * problemas.length)];
    }
    
    if (lower.includes('mejora') || lower.includes('sugerencia') || lower.includes('optimizar')) {
      const mejoras = [
        'Implementar mantenimiento predictivo con sensores IoT',
        'Aumentar buffer de entrada en 20% para evitar colas',
        'Calibración semanal automática programada',
        'Reducir tiempo de cambio de lote con fixtures rápidos',
      ];
      return mejoras[Math.floor(Math.random() * mejoras.length)];
    }
    
    // Respuesta genérica técnica
    const respuestas = [
      `Proceso estable, desviación estándar ${(Math.random() * 2).toFixed(2)}`,
      `Implementado según norma ISO con ${90 + Math.floor(Math.random() * 10)}% conformidad`,
      `Configuración optimizada, latencia <${10 + Math.floor(Math.random() * 20)}ms`,
      `Resultado satisfactorio en ${95 + Math.floor(Math.random() * 5)}% de casos`,
    ];
    
    return respuestas[Math.floor(Math.random() * respuestas.length)];
  }
}
