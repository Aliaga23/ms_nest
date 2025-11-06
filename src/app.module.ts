import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CanalModule } from './canal/canal.module';
import { TipoPreguntaModule } from './tipo_pregunta/tipo-pregunta.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, 
    CanalModule, 
    TipoPreguntaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
