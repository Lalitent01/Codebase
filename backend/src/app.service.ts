import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string; service: string; version: string } {
    return {
      status: 'online',
      service: 'Suroor AI Backend',
      version: '1.0.0',
    };
  }
}