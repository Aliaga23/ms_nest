import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoPreguntaDto } from './dto/create-tipo-pregunta.dto';
import { UpdateTipoPreguntaDto } from './dto/update-tipo-pregunta.dto';

@Injectable()
export class TipoPreguntaService {
    constructor(private readonly prisma: PrismaService) { }

    create(createTipoPreguntaDto: CreateTipoPreguntaDto) {
        return this.prisma.tipoPregunta.create({
            data: createTipoPreguntaDto,
        });
    }

    findAll() {
        return this.prisma.tipoPregunta.findMany();
    }

    findOne(id: string) {
        return this.prisma.tipoPregunta.findUnique({
            where: { id },
        });
    }

    update(id: string, updateTipoPreguntaDto: UpdateTipoPreguntaDto) {
        return this.prisma.tipoPregunta.update({
            where: { id },
            data: updateTipoPreguntaDto,
        });
    }

    remove(id: string) {
        return this.prisma.tipoPregunta.delete({
            where: { id },
        });
    }
}
