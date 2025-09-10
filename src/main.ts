// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as dotenv from 'dotenv';
// import {
//   FastifyAdapter,
//   NestFastifyApplication,
// } from '@nestjs/platform-fastify';
// import { Logger, ValidationPipe } from '@nestjs/common';

// // Load environment variables from .env file
// dotenv.config();

// const logger = new Logger('startPoint');

// async function startPoint() {
//   try {
//     // Create the NestJS application with the Fastify adapter
//     const app = await NestFactory.create<NestFastifyApplication>(
//       AppModule,
//       new FastifyAdapter({
//         logger: true,
//         bodyLimit: 50 * 1024 * 1024,
//       }),
//     );

//     // Use NestJS's built-in enableCors method
//     app.enableCors({
//       origin: [
//         'http://localhost:3000',
//         'http://localhost:3001',
//         'http://localhost:3002',
//         'http://localhost:3060',
//       ],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//       allowedHeaders: [
//         'Content-Type',
//         'Authorization',
//         'X-Requested-With',
//         'Accept',
//         'Origin',
//         'X-CSRF-Token',
//         'X-Timestamp',
//         'X-Nonce',
//         'X-Client-Version',
//         'X-Signature',
//       ],
//       credentials: true,
//     });

//     // Register the multipart plugin with proper typing
//     await app.register(
//       // @ts-ignore - Temporary fix for type compatibility
//       require('@fastify/multipart'),
//       {
//         attachFieldsToBody: true,
//         limits: {
//           fieldNameSize: 100, // Max field name size in bytes
//           fieldSize: 100, // Max field value size in bytes
//           fields: 50, // Max number of non-file fields
//           fileSize: 10 * 1024 * 1024, // 10MB per file
//           files: 50, // Max number of file fields
//           headerPairs: 2000, // Max number of header key=>value pairs
//         },
//       }
//     );

//     // Set global validation pipe
//     app.useGlobalPipes(
//       new ValidationPipe({
//         transform: true,
//         whitelist: true,
//         forbidNonWhitelisted: true,
//       })
//     );

//     // Set the global API prefix
//     app.setGlobalPrefix('/api');

//     const port = process.env.API_PORT || 3060;
//     console.log('✌️port --->', port);

//     // Listen for incoming requests
//     await app.listen(port, '0.0.0.0');

//     logger.log(`🚀 Application is running on: http://localhost:${port}`);
//     logger.log(`📚 API Documentation: http://localhost:${port}/api`);
//   } catch (error) {
//     logger.error('❌ Error starting the application:', error);
//     process.exit(1);
//   }
// }

// startPoint();







// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as dotenv from 'dotenv';
// import {
//   FastifyAdapter,
//   NestFastifyApplication,
// } from '@nestjs/platform-fastify';
// import { Logger, ValidationPipe } from '@nestjs/common';

// // Load environment variables from .env file
// dotenv.config();

// const logger = new Logger('startPoint');

// async function startPoint() {
//   try {
//     // Create the NestJS application with the Fastify adapter
//     const app = await NestFactory.create<NestFastifyApplication>(
//       AppModule,
//       new FastifyAdapter({
//         logger: true,
//         bodyLimit: 50 * 1024 * 1024,
//       }),
//     );

//     // Use NestJS's built-in enableCors method
//     app.enableCors({
//       origin: [
//         'http://localhost:3000',
//         'http://localhost:3001',
//         'http://localhost:3002',
//         'http://localhost:3060',
//       ],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//       allowedHeaders: [
//         'Content-Type',
//         'Authorization',
//         'X-Requested-With',
//         'Accept',
//         'Origin',
//         'X-CSRF-Token',
//         'X-Timestamp',
//         'X-Nonce',
//         'X-Client-Version',
//         'X-Signature',
//       ],
//       credentials: true,
//     });

     
//     app.useGlobalPipes(
//       new ValidationPipe({
//         transform: true,
//         whitelist: true,
//         forbidNonWhitelisted: false, // 🔥 Changed to false to allow form data fields
//       })
//     );

//     // Set the global API prefix
//     app.setGlobalPrefix('/api');

//     const port = process.env.API_PORT || 3060;
//     console.log('✌️port --->', port);

//     // Listen for incoming requests
//     await app.listen(port, '0.0.0.0');

//     logger.log(`🚀 Application is running on: http://localhost:${port}`);
//     logger.log(`📚 API Documentation: http://localhost:${port}/api`);
//   } catch (error) {
//     logger.error('❌ Error starting the application:', error);
//     process.exit(1);
//   }
// }

// startPoint();


//v4


import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart'; // 👈 Import the Fastify multipart plugin
import { AppModule } from 'src/app.module';

// Load environment variables from .env file
dotenv.config();

const logger = new Logger('startPoint');

async function startPoint() {
  try {
    // Create the NestJS application with the Fastify adapter
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: true,
        bodyLimit: 50 * 1024 * 1024,
      }),
    );

    // 🚀 Register the Fastify multipart plugin to handle form data
    await app.register(multipart as any);

    // Use NestJS's built-in enableCors method
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3060',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
        'X-Timestamp',
        'X-Nonce',
        'X-Client-Version',
        'X-Signature',
      ],
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        // whitelist: true,
        //TODO make it true
        whitelist: false,
        forbidNonWhitelisted: false, // Changed to false to allow form data fields
      }),
    );

    // Set the global API prefix
    app.setGlobalPrefix('/api');

    const port = process.env.API_PORT || 3060;
    console.log('✌️port --->', port);

    // Listen for incoming requests
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('❌ Error starting the application:', error);
    process.exit(1);
  }
}

startPoint();