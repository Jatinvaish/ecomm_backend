import {
    ArgumentMetadata,
    Injectable,
    PipeTransform,
    BadRequestException,
  } from '@nestjs/common';
  
  @Injectable()
  export class ValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
      if (typeof value === 'string' && value.trim() === '') {
        throw new BadRequestException('Validation failed: empty string');
      }
  
      return value;
    }
  }
  