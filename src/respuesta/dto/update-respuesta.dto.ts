import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsNumber,
    MaxLength,
    IsDateString,
} from 'class-validator';
import { CreateRespuestaDto } from './create-respuesta.dto';

export class UpdateRespuestaDto extends PartialType(CreateRespuestaDto) {
    @ApiProperty({
        example: 'Podría mejorar la atención telefónica.',
        description: 'Texto actualizado de la respuesta (opcional).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    texto?: string;

    @ApiProperty({
        example: 4,
        description: 'Valor actualizado si la respuesta es numérica.',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    numero?: number;

    @ApiProperty({
        example: '2025-11-07T09:00:00Z',
        description: 'Actualiza la fecha de recepción de la respuesta.',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    recibido_en?: Date;
}
