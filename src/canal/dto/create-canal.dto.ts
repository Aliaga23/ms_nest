import { IsString, Length } from 'class-validator';

export class CreateCanalDto {
    @IsString()
    @Length(1, 100)
    nombre: string;
}
