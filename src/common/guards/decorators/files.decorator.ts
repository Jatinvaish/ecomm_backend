// files.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as fastify from 'fastify';

export const Files = createParamDecorator(
  async (_data: unknown, ctx: ExecutionContext): Promise<any> => {
    const req = ctx.switchToHttp().getRequest() as fastify.FastifyRequest;
    return (req as any).storedFiles || {};
  },
);