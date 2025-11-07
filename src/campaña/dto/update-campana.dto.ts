import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCampanaDto } from './create-campana.dto';

export class UpdateCampanaDto extends PartialType(CreateCampanaDto) {
    @ApiProperty({
        example: 'Campaña de opinión pública 2025',
        description: 'Nuevo nombre de la campaña (opcional).',
        required: false,
    })
    nombre?: string;
}
