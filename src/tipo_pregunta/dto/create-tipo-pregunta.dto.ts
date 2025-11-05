import { IsString, Length } from 'class-validator';

export class CreateTipoPreguntaDto {
    @IsString()
    @Length(1, 100)
    nombre: string;
}
