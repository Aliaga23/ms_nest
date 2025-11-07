export class Pregunta {
    id: string;
    orden: number;
    texto: string;
    obligatorio: boolean;
    encuestaId: string;
    tipo_preguntaId: string;
    creado_en?: Date;
}
