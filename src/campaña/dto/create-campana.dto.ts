import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCampanaDto {
    @ApiProperty({
        example: 'Campaña de satisfacción 2025',
        description: 'Nombre de la campaña, usada para agrupar encuestas relacionadas.',
    })
    @IsString()
    @Length(1, 100)
    nombre: string;
}
