import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('encuestas-lote')
  @HttpCode(HttpStatus.OK)
  async ingestEncuestas(@Body() payload: any[]) {
    return this.ingestionService.ingestarEmpresas(payload);
  }
}
