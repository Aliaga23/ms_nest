import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class CreateEncuestaDto {
    @IsString()
    @Length(1, 150)
    nombre: string;

    @IsString()
    @Length(1, 500)
    descripcion: string;

    @IsOptional()
    @IsString()
    campañaId?: string;

    @IsOptional()
    @IsString()
    canalId?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
