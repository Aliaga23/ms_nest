import { Module } from '@nestjs/common';
import { OpcionEncuestaService } from './opcion-encuesta.service';
import { OpcionEncuestaController } from './opcion-encuesta.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioService } from '../usuario/usuario.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [OpcionEncuestaController],
    providers: [OpcionEncuestaService, UsuarioService],
})
export class OpcionEncuestaModule { }
