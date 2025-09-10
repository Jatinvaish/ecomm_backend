import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/common-response';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Authorization header missing'),
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET!);

      if (!decoded?.userId) {
        throw new UnauthorizedException(
          ApiResponse.unauthorized('Invalid token structure'),
        );
      }

      // Attach only ID here — RoleGuard will enrich with full data
      request.user = { id: decoded.userId };

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Invalid or expired token'),
      );
    }
  }
}
