import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTipoPreguntaDto } from './create-tipo-pregunta.dto';

export class UpdateTipoPreguntaDto extends PartialType(CreateTipoPreguntaDto) {
    @ApiProperty({
        example: 'Pregunta abierta',
        description: 'Nuevo nombre o categoría del tipo de pregunta (opcional).',
        required: false,
    })
    nombre?: string;
}
