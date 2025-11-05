import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoPreguntaDto } from './create-tipo-pregunta.dto';

export class UpdateTipoPreguntaDto extends PartialType(CreateTipoPreguntaDto) { }
