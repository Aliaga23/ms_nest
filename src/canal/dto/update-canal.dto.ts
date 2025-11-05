import { PartialType } from '@nestjs/mapped-types';
import { CreateCanalDto } from './create-canal.dto';

export class UpdateCanalDto extends PartialType(CreateCanalDto) { }
