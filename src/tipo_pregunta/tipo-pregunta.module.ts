import { Module } from '@nestjs/common';
import { TipoPreguntaService } from './tipo-pregunta.service';
import { TipoPreguntaController } from './tipo-pregunta.controller';

@Module({
    controllers: [TipoPreguntaController],
    providers: [TipoPreguntaService],
})
export class TipoPreguntaModule { }
