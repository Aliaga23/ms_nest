import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateEntregaDto {
    @ApiProperty({
        example: '2025-11-04T18:30:00Z',
        description: 'Fecha y hora en que la encuesta fue enviada al destinatario (opcional).',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    enviado_en?: Date;

    @ApiProperty({
        example: '2025-11-06T14:00:00Z',
        description: 'Fecha y hora en que el destinatario respondió la encuesta (opcional).',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    respondido_en?: Date;

    @ApiProperty({
        example: '5e4b4a32-1f3b-4971-9f0b-4a90f05ac2b7',
        description: 'ID de la encuesta que se está entregando.',
    })
    @IsUUID()
    @IsNotEmpty()
    encuestaId: string;

    @ApiProperty({
        example: 'b4c2f9c8-74aa-4f0b-b65e-01fdc22a51d3',
        description: 'ID del destinatario que recibirá la encuesta.',
    })
    @IsUUID()
    @IsNotEmpty()
    destinatarioId: string;
}
