import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Length, Matches } from 'class-validator';
import { CreateDestinatarioDto } from './create-destinatario.dto';

export class UpdateDestinatarioDto extends PartialType(CreateDestinatarioDto) {
    @ApiProperty({
        example: 'María José Rojas',
        description: 'Nombre actualizado del destinatario (opcional).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Length(2, 100)
    nombre?: string;

    @ApiProperty({
        example: '+59176001122',
        description: 'Teléfono actualizado (opcional).',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[0-9]{7,15}$/, {
        message: 'El teléfono debe contener solo números y puede incluir el prefijo +',
    })
    telefono?: string;

    @ApiProperty({
        example: 'maria.rojas@empresa.com',
        description: 'Correo electrónico actualizado (opcional).',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Debe ser un correo electrónico válido.' })
    email?: string;
}
