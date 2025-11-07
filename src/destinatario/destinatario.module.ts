import { Module } from '@nestjs/common';
import { DestinatarioService } from './destinatario.service';
import { DestinatarioController } from './destinatario.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioService } from '../usuario/usuario.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [DestinatarioController],
    providers: [DestinatarioService, UsuarioService],
})
export class DestinatarioModule { }
