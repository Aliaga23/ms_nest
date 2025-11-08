import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateBulkEntregaDto {
  @IsUUID()
  encuestaId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}
