import { Module } from '@nestjs/common';
import { EncuestaService } from './encuesta.service';
import { EncuestaController } from './encuesta.controller';
import { UsuarioService } from '../usuario/usuario.service';
import { ChatgptModule } from '../gemini/chatgpt.module';

@Module({
    imports: [ChatgptModule],
    controllers: [EncuestaController],
    providers: [EncuestaService, UsuarioService],
    exports: [EncuestaService],
})
export class EncuestaModule { }
