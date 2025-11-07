import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateOpcionEncuestaDto {
    @ApiProperty({
        example: 'Muy satisfecho',
        description: 'Texto visible de la opción que se mostrará al encuestado.',
    })
    @IsString()
    @Length(1, 200)
    texto: string;

    @ApiProperty({
        example: '5',
        description: 'Valor asociado a la opción (puede ser numérico o texto interpretativo).',
    })
    @IsString()
    @Length(1, 50)
    valor: string;

    @ApiProperty({
        example: 'a1b2c3d4-5678-90ab-cdef-1234567890ff',
        description: 'ID de la pregunta a la que pertenece esta opción.',
    })
    @IsString()
    preguntaId: string;
}
