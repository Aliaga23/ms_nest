import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CreateOpcionEncuestaDto } from './create-opcion-encuesta.dto';

export class UpdateOpcionEncuestaDto extends PartialType(CreateOpcionEncuestaDto) {
    @ApiProperty({
        example: 'Satisfecho',
        description: 'Nuevo texto de la opción (opcional).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Length(1, 200)
    texto?: string;

    @ApiProperty({
        example: '4',
        description: 'Nuevo valor numérico o textual asignado a la opción (opcional).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    valor?: string;
}
