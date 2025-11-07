import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePreguntaDto } from './create-pregunta.dto';

export class UpdatePreguntaDto extends PartialType(CreatePreguntaDto) {
    @ApiProperty({
        example: '¿Qué tan satisfecho está con la atención recibida?',
        description: 'Nuevo texto o descripción de la pregunta (opcional).',
        required: false,
    })
    texto?: string;

    @ApiProperty({
        example: false,
        description: 'Define si la pregunta sigue siendo obligatoria (opcional).',
        required: false,
    })
    obligatorio?: boolean;
}
