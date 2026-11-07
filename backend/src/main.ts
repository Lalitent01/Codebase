import 'dotenv/config'; // Must remain line 1
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Disable default 100kb body parser to allow high-res base64 avatar uploads
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Body parser limits for JSON and form data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // CORS configuration
  const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = [
    rawFrontendUrl.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or curl requests with no origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development; specify exact domains in strict production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global API route prefix: /api/...
  // Excludes root '/' and '/health' so cloud load balancers and uptime checkers work
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Set to false to prevent stripping payload properties from un-annotated body types
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3001;

  // Listen on 0.0.0.0 for containerized and cloud environments
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Suroor AI Backend running at: http://localhost:${port}/api`);
}

bootstrap();