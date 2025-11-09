import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampanaRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;
}

export class CreateOpcionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  valor: string;
}

export class CreatePreguntaRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipo_preguntaId: string;

  @ApiProperty()
  @IsOptional()
  obligatorio?: boolean;

  @ApiProperty({ type: [CreateOpcionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpcionDto)
  opciones?: CreateOpcionDto[];
}

export class CreateEncuestaRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  campañaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  canalId?: string;

  @ApiProperty({ type: [CreatePreguntaRequestDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaRequestDto)
  preguntas?: CreatePreguntaRequestDto[];
}

export class ChatbotRequestDto {
  @ApiProperty({ description: 'Mensaje del usuario' })
  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @ApiProperty({ description: 'ID de la sesión de conversación', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
