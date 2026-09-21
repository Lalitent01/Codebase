import 'dotenv/config'; // <--- MUST BE THE VERY FIRST LINE
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  // Disable default 100kb body parser so custom limit works
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Allow up to 10MB for base64 character avatars
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Normalize CORS origin (strip trailing slash if present)
  const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const frontendOrigin = rawFrontendUrl.replace(/\/$/, '');

  app.enableCors({
    origin: [frontendOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global API route prefix: /api/...
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;

  // Listen on 0.0.0.0 for Docker and cloud platform compatibility
  await app.listen(port, '0.0.0.0');

  console.log(`Backend server running on port ${port}`);
}
bootstrap();