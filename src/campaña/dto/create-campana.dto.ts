import { IsString, Length } from 'class-validator';

export class CreateCampanaDto {
    @IsString()
    @Length(1, 100)
    nombre: string;
}
