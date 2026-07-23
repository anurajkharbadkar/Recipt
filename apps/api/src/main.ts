import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Serve static uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Security
  app.use(helmet());

  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  const allowedOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((o: string) => o.trim())
    : [corsOrigin, 'http://localhost:3000', 'http://localhost:3010'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Digital Pavti Book API')
      .setDescription('Production API for Digital Receipt Book for Indian Community Organizations')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('organizations', 'Organization management')
      .addTag('campaigns', 'Campaign management')
      .addTag('receipts', 'Receipt / Pavti management')
      .addTag('collectors', 'Collector management')
      .addTag('expenses', 'Expense tracking')
      .addTag('reports', 'Analytics and reporting')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 Digital Pavti Book API running on http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
