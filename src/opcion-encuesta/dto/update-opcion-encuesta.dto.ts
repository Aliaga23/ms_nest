import { PartialType } from '@nestjs/mapped-types';
import { CreateOpcionEncuestaDto } from './create-opcion-encuesta.dto';

export class UpdateOpcionEncuestaDto extends PartialType(CreateOpcionEncuestaDto) { }
