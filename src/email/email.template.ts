export function generateEmailTemplate(destinatario: string, campaña: string, entregaId: string): string {
  const enlace = `https://example.com/${entregaId}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hola ${destinatario},</h2>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 15px 0;">
                    Te invitamos a participar en nuestra <strong>encuesta</strong>: <strong>${campaña}</strong>.
                  </p>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                    Tu opinión es muy importante para nosotros. La <strong>encuesta</strong> solo tomará unos minutos de tu tiempo.
                  </p>
                  
                  <table role="presentation" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #4CAF50;">
                        <a href="${enlace}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Responder Encuesta
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 10px 0;">
                    Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:
                  </p>
                  
                  <p style="color: #4CAF50; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                    <a href="${enlace}" style="color: #4CAF50; text-decoration: underline;">${enlace}</a>
                  </p>
                  
                  <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 0;">
                    El enlace estará activo por 7 días.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}