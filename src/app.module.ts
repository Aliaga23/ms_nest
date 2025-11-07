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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CanalModule,
    TipoPreguntaModule,
    CampanaModule,
    EncuestaModule
  ],
  controllers: [AppController],
  providers: [AppService, UsuarioService],
})
export class AppModule { }
