export class CreateRespuestaDto {
    texto?: string;
    numero?: number;
    recibido_en?: Date;
    entregaId: string;
    preguntaId: string;
    opcionEncuestaId?: string;
}
