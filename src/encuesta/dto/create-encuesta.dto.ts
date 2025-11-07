import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class CreateEncuestaDto {
    @ApiProperty({
        example: 'Encuesta de satisfacción del cliente',
        description: 'Título o nombre descriptivo de la encuesta.',
    })
    @IsString()
    @Length(1, 150)
    nombre: string;

    @ApiProperty({
        example: 'Encuesta destinada a evaluar la atención al cliente y la calidad del servicio brindado.',
        description: 'Breve descripción sobre el objetivo o propósito de la encuesta.',
    })
    @IsString()
    @Length(1, 500)
    descripcion: string;

    @ApiProperty({
        example: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
        description: 'ID de la campaña a la cual pertenece esta encuesta. Opcional.',
        required: false,
    })
    @IsOptional()
    @IsString()
    campañaId?: string;

    @ApiProperty({
        example: 'c8a7d3e2-54b1-43c6-b123-9dc8f2e5a7c1',
        description: 'ID del canal por el cual se distribuirá la encuesta (WhatsApp, email, etc.). Opcional.',
        required: false,
    })
    @IsOptional()
    @IsString()
    canalId?: string;

    @ApiProperty({
        example: true,
        description: 'Indica si la encuesta está activa o no.',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
