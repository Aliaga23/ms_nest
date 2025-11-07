import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { CreateEntregaDto } from './create-entrega.dto';

export class UpdateEntregaDto extends PartialType(CreateEntregaDto) {
    @ApiProperty({
        example: '2025-11-06T10:00:00Z',
        description: 'Actualiza la fecha de envío o respuesta (opcional).',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    enviado_en?: Date;

    @ApiProperty({
        example: '2025-11-07T17:00:00Z',
        description: 'Actualiza la fecha de respuesta del destinatario (opcional).',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    respondido_en?: Date;
}
