import { Module } from '@nestjs/common';
import { CanalService } from './canal.service';
import { CanalController } from './canal.controller';

@Module({
    controllers: [CanalController],
    providers: [CanalService],
    exports: [CanalService],
})
export class CanalModule { }
