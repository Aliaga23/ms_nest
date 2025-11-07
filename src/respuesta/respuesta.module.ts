import { Module } from '@nestjs/common';
import { RespuestaService } from './respuesta.service';
import { RespuestaController } from './respuesta.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioService } from '../usuario/usuario.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [RespuestaController],
    providers: [RespuestaService, UsuarioService],
})
export class RespuestaModule { }
