import { Module } from '@nestjs/common';
import { CampanaService } from './campana.service';
import { CampanaController } from './campana.controller';
import { UsuarioService } from '../usuario/usuario.service';

@Module({
    controllers: [CampanaController],
    providers: [CampanaService, UsuarioService],
})
export class CampanaModule { }
