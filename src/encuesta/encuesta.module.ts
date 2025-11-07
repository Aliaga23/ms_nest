import { Module } from '@nestjs/common';
import { EncuestaService } from './encuesta.service';
import { EncuestaController } from './encuesta.controller';
import { UsuarioService } from '../usuario/usuario.service';

@Module({
    controllers: [EncuestaController],
    providers: [EncuestaService, UsuarioService],
})
export class EncuestaModule { }
