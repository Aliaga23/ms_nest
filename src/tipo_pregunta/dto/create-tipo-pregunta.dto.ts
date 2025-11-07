import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTipoPreguntaDto {
    @ApiProperty({
        example: 'Opción múltiple',
        description: 'Nombre o tipo de pregunta que puede tener la encuesta. Ejemplo: Opción múltiple, Abierta, Escala, etc.',
    })
    @IsString()
    @Length(1, 100)
    nombre: string;
}
