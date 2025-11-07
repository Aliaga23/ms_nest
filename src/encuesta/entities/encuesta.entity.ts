export class Encuesta {
    id: string;
    nombre: string;
    descripcion: string;
    user_id: string;
    activo: boolean;
    creado_en: Date;
    campañaId?: string;
    canalId?: string;
}
