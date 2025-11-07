import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateEntregaDto {
  enviado_en?: Date;
  respondido_en?: Date;

  @IsUUID()
  @IsNotEmpty()
  encuestaId: string;

  @IsUUID()
  @IsNotEmpty()
  destinatarioId: string;
}
