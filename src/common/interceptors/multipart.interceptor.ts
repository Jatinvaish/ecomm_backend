// multipart.interceptor.ts
import { Observable } from 'rxjs';
import { 
  CallHandler, 
  ExecutionContext, 
  HttpException, 
  HttpStatus, 
  mixin, 
  NestInterceptor, 
  Type 
} from '@nestjs/common';
import * as fastify from 'fastify';
import { MultipartValue, MultipartFile } from '@fastify/multipart';

// Helper function to convert multipart file to buffer
const getFileFromPart = async (part: MultipartFile): Promise<any> => {
  const buffer = await part.toBuffer(); // This is crucial!
  return {
    buffer,
    size: buffer.byteLength,
    filename: part.filename,
    mimetype: part.mimetype,
    fieldname: part.fieldname,
  };
};

export function MultipartInterceptor(): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const req = context.switchToHttp().getRequest() as fastify.FastifyRequest;
      
      if (!req.isMultipart()) {
        throw new HttpException('The request should be a form-data', HttpStatus.BAD_REQUEST);
      }

      const files = {};
      const body = {};

      for await (const part of req.parts()) {
        if (part.type !== 'file') {
          // Handle form fields (like your JSON data)
          body[part.fieldname] = (part as MultipartValue).value;
          continue;
        }

        // Handle file uploads
        const file = await getFileFromPart(part);
        files[part.fieldname] = files[part.fieldname] || [];
        files[part.fieldname].push(file);
      }

      // Attach parsed data to request
      (req as any).storedFiles = files;
      req.body = body;

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}