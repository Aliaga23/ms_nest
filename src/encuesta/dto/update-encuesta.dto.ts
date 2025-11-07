import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEncuestaDto } from './create-encuesta.dto';

export class UpdateEncuestaDto extends PartialType(CreateEncuestaDto) {
    @ApiProperty({
        example: 'Encuesta de calidad postventa',
        description: 'Nuevo título o nombre de la encuesta (opcional).',
        required: false,
    })
    nombre?: string;

    @ApiProperty({
        example: 'Actualización de la encuesta para el nuevo período 2025.',
        description: 'Nueva descripción o propósito de la encuesta (opcional).',
        required: false,
    })
    descripcion?: string;
}
