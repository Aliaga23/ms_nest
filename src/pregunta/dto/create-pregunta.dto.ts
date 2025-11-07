export class CreatePreguntaDto {
    orden: number;
    texto: string;
    obligatorio?: boolean;
    encuestaId: string;
    tipo_preguntaId: string;
}
