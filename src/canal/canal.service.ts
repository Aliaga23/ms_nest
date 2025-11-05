import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@Injectable()
export class CanalService {
    constructor(private readonly prisma: PrismaService) { }

    create(createCanalDto: CreateCanalDto) {
        return this.prisma.canal.create({
            data: createCanalDto,
        });
    }

    findAll() {
        return this.prisma.canal.findMany();
    }

    findOne(id: string) {
        return this.prisma.canal.findUnique({
            where: { id },
        });
    }

    update(id: string, updateCanalDto: UpdateCanalDto) {
        return this.prisma.canal.update({
            where: { id },
            data: updateCanalDto,
        });
    }

    remove(id: string) {
        return this.prisma.canal.delete({
            where: { id },
        });
    }
}
