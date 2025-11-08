import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class PdfService {
  async generateSurveyPDF(
    encuesta: any,
    preguntas: any[],
    entregas: any[],
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        for (let i = 0; i < entregas.length; i++) {
          await this.generateSurveyPage(doc, encuesta, preguntas, entregas[i].id);
          if (i < entregas.length - 1) {
            doc.addPage();
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateSurveyPage(
    doc: PDFKit.PDFDocument,
    encuesta: any,
    preguntas: any[],
    entregaId: string,
  ): Promise<void> {
    // Generar QR code
    const qrCodeDataUrl = await QRCode.toDataURL(entregaId);
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Header con QR centrado
    const qrSize = 80; // Reducido de 100 a 80
    doc.image(qrBuffer, doc.page.width / 2 - qrSize / 2, 40, { width: qrSize });
    
    // Título de la encuesta
    doc.fontSize(14) // Reducido de 16 a 14
       .font('Helvetica-Bold')
       .text(encuesta.nombre || 'Encuesta NPS', 50, 140, { align: 'center' });

    let yPosition = 170; // Ajustado para empezar más arriba
    const pageHeight = doc.page.height - 80; // Espacio disponible con margen inferior
    const totalPreguntas = preguntas.length;
    
    // Calcular espacio disponible por pregunta para ajustar dinámicamente
    const availableSpace = pageHeight - yPosition;
    const baseSpacePerQuestion = availableSpace / totalPreguntas;
    
    // Ajustar tamaños de fuente según cantidad de preguntas
    let fontSize = 10;
    let lineSpacing = 18;
    if (totalPreguntas > 10) {
      fontSize = 9;
      lineSpacing = 15;
    }
    if (totalPreguntas > 15) {
      fontSize = 8;
      lineSpacing = 12;
    }

    // Renderizar preguntas
    preguntas.forEach((pregunta, index) => {
      // Número y texto de la pregunta
      doc.fontSize(fontSize)
         .font('Helvetica')
         .text(`${index + 1}. ${pregunta.texto}`, 50, yPosition, { 
           width: doc.page.width - 100 
         });

      yPosition += lineSpacing + 5;

      // Renderizar según tipo de pregunta
      if (pregunta.tipo_pregunta?.nombre === 'Completar') {
        // Sin línea guía para escribir
        yPosition += lineSpacing;
      } else if (pregunta.tipo_pregunta?.nombre === 'Opción Única' || pregunta.tipo_pregunta?.nombre === 'Opción Múltiple') {
        // Opciones de respuesta con cuadraditos dibujados
        if (pregunta.opciones && pregunta.opciones.length > 0) {
          pregunta.opciones.forEach((opcion: any) => {
            // Dibujar cuadradito
            const boxSize = 8;
            doc.rect(70, yPosition - 1, boxSize, boxSize).stroke();
            
            // Texto de la opción
            doc.fontSize(fontSize - 1)
               .text(opcion.texto, 82, yPosition, { width: doc.page.width - 140 });
            yPosition += lineSpacing - 3;
          });
          
          // Agregar hint según el tipo de pregunta
          if (pregunta.tipo_pregunta?.nombre === 'Opción Única') {
            doc.fontSize(7)
               .font('Helvetica-Oblique')
               .text('(una opción)', 70, yPosition, { width: doc.page.width - 140 });
            yPosition += 10;
          } else if (pregunta.tipo_pregunta?.nombre === 'Opción Múltiple') {
            doc.fontSize(7)
               .font('Helvetica-Oblique')
               .text('(una o más opciones)', 70, yPosition, { width: doc.page.width - 140 });
            yPosition += 10;
          }
        }
      }

      // Espacio entre preguntas reducido
      yPosition += 8;
    });
  }
}
