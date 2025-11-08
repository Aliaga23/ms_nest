import { Controller, Post, Body } from '@nestjs/common';
import { BulkRegisterService } from './bulk-register.service';

@Controller('bulk-register')
export class BulkRegisterController {
  constructor(private readonly bulkRegisterService: BulkRegisterService) {}

  @Post()
  async registerUsers(@Body() users: any[]): Promise<any> {
    return this.bulkRegisterService.registerUsers(users);
  }
}