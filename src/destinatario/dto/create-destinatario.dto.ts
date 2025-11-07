import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateDestinatarioDto {
    @ApiProperty({
        example: 'Carlos Fernández',
        description: 'Nombre completo del destinatario que recibirá la encuesta.',
    })
    @IsString()
    @Length(2, 100)
    nombre: string;

    @ApiProperty({
        example: '+59170011223',
        description: 'Número de teléfono del destinatario. Debe incluir el prefijo del país.',
    })
    @IsString()
    @Matches(/^\+?[0-9]{7,15}$/, {
        message: 'El teléfono debe contener solo números y puede incluir el prefijo +',
    })
    telefono: string;

    @ApiProperty({
        example: 'carlos.fernandez@gmail.com',
        description: 'Correo electrónico válido del destinatario.',
    })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido.' })
    email: string;
}
