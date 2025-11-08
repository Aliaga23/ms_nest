import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BulkRegisterController } from './bulk-register.controller';
import { BulkRegisterService } from './bulk-register.service';

@Module({
  imports: [HttpModule],
  controllers: [BulkRegisterController],
  providers: [BulkRegisterService],
})
export class BulkRegisterModule {}