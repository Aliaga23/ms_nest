import { Module } from '@nestjs/common';
import { PreguntaService } from './pregunta.service';
import { PreguntaController } from './pregunta.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioService } from '../usuario/usuario.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [PreguntaController],
    providers: [PreguntaService, UsuarioService],
})
export class PreguntaModule { }
