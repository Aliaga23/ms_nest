import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { CampanaModule } from '../campaña/campana.module';
import { EncuestaModule } from '../encuesta/encuesta.module';
import { PreguntaModule } from '../pregunta/pregunta.module';
import { TipoPreguntaModule } from '../tipo_pregunta/tipo-pregunta.module';
import { CanalModule } from '../canal/canal.module';
import { OpcionEncuestaModule } from '../opcion-encuesta/opcion-encuesta.module';
import { UsuarioService } from '../usuario/usuario.service';

@Module({
  imports: [CampanaModule, EncuestaModule, PreguntaModule, TipoPreguntaModule, CanalModule, OpcionEncuestaModule],
  providers: [ChatbotService, UsuarioService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
