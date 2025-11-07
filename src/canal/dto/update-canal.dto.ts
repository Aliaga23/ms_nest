import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCanalDto } from './create-canal.dto';

export class UpdateCanalDto extends PartialType(CreateCanalDto) {
    @ApiProperty({
        example: 'Correo electrónico',
        description: 'Nuevo nombre del canal si se desea actualizar.',
        required: false,
    })
    nombre?: string;
}
