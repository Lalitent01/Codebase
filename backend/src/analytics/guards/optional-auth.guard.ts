import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    // If not authenticated or token is absent/invalid, do not fail. Return null for guests.
    return user || null;
  }
}