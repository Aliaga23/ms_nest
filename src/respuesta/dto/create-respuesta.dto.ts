import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsUUID,
    IsNumber,
    IsDateString,
    MaxLength,
} from 'class-validator';

export class CreateRespuestaDto {
    @ApiProperty({
        example: 'Excelente atención y rapidez en la entrega.',
        description:
            'Texto libre de la respuesta (solo para preguntas abiertas).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    texto?: string;

    @ApiProperty({
        example: 5,
        description:
            'Valor numérico asociado a la respuesta (por ejemplo, una escala de 1 a 5). Solo aplica a preguntas de tipo numérico.',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    numero?: number;

    @ApiProperty({
        example: '2025-11-06T18:45:00Z',
        description: 'Fecha y hora en que se recibió la respuesta (opcional).',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    recibido_en?: Date;

    @ApiProperty({
        example: 'aa5c90b0-52e8-4dbf-bb38-ecb87b19ccaf',
        description: 'ID de la entrega a la que pertenece esta respuesta.',
    })
    @IsUUID()
    entregaId: string;

    @ApiProperty({
        example: 'f31b1821-4b5d-4f3e-99cf-c3a6620e23df',
        description: 'ID de la pregunta que fue respondida.',
    })
    @IsUUID()
    preguntaId: string;

    @ApiProperty({
        example: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
        description:
            'ID de la opción elegida, solo si la pregunta es de tipo selección (opcional en preguntas abiertas).',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsUUID()
    opcionEncuestaId?: string;
}
