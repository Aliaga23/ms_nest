import { Module } from '@nestjs/common';
import { EntregaService } from './entrega.service';
import { EntregaController } from './entrega.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioService } from '../usuario/usuario.service';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [EntregaController],
    providers: [EntregaService, UsuarioService, EmailService],
})
export class EntregaModule { }
