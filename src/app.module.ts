import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CanalModule } from './canal/canal.module';
import { TipoPreguntaModule } from './tipo_pregunta/tipo-pregunta.module';
import { UsuarioService } from './usuario/usuario.service';
import { CampanaModule } from './campaña/campana.module';
import { EncuestaModule } from './encuesta/encuesta.module';
import { PreguntaModule } from './pregunta/pregunta.module';
import { OpcionEncuestaModule } from './opcion-encuesta/opcion-encuesta.module';
import { RespuestaModule } from './respuesta/respuesta.module';
import { EntregaModule } from './entrega/entrega.module';
import { DestinatarioModule } from './destinatario/destinatario.module';
import { HttpModule } from '@nestjs/axios';
import { BulkRegisterModule } from './bulk-register/bulk-register.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CanalModule,
    TipoPreguntaModule,
    CampanaModule,
    EncuestaModule,
    PreguntaModule,
    OpcionEncuestaModule,
    RespuestaModule,
    EntregaModule,
    DestinatarioModule,
    HttpModule,
    BulkRegisterModule,
    IngestionModule,
    AnalyticsModule,
    ChatbotModule
  ],
  controllers: [AppController],
  providers: [AppService, UsuarioService],
})
export class AppModule { }
