import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreatePreguntaDto {
    @ApiProperty({
        example: 1,
        description: 'Orden numérico en el que la pregunta aparece dentro de la encuesta.',
    })
    @IsNumber()
    orden: number;

    @ApiProperty({
        example: '¿Qué tan satisfecho está con nuestro servicio?',
        description: 'Texto o contenido principal de la pregunta.',
    })
    @IsString()
    @Length(1, 255)
    texto: string;

    @ApiProperty({
        example: true,
        description: 'Indica si esta pregunta es obligatoria para el encuestado.',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    obligatorio?: boolean;

    @ApiProperty({
        example: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
        description: 'ID de la encuesta a la que pertenece esta pregunta.',
    })
    @IsString()
    encuestaId: string;

    @ApiProperty({
        example: '3c9e2a19-51ba-4a48-b6a8-04ecb1134d13',
        description: 'ID del tipo de pregunta (por ejemplo: opción múltiple, abierta, escala, etc.).',
    })
    @IsString()
    tipo_preguntaId: string;
}
