import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCanalDto {
    @ApiProperty({
        example: 'WhatsApp',
        description: 'Nombre del canal por el cual se enviarán las encuestas. Ejemplo: WhatsApp, Email, SMS, etc.',
    })
    @IsString()
    @Length(1, 100)
    nombre: string;
}
