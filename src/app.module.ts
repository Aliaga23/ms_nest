import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CanalModule } from './canal/canal.module';
import { TipoPreguntaModule } from './tipo_pregunta/tipo-pregunta.module';

@Module({
  imports: [PrismaModule, CanalModule, TipoPreguntaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
