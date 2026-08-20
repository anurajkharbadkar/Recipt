import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true — the Cashfree webhook signature (CashfreeWebhookService)
  // is computed over the exact raw request bytes, not the parsed/
  // re-serialized JSON body (key order/whitespace differ, so a re-stringify
  // would never match). This only adds `req.rawBody` alongside the normal
  // parsed `req.body` Nest already provides everywhere else — no behavior
  // change for any other route.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  // Root & Health routes for platform proxies (Railway / Load Balancers)
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.get('/', (_req: any, res: any) => {
    res.json({ status: 'ok', service: 'e Pavti Book API', version: '1.0.0' });
  });
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  httpAdapter.get('/api/v1', (_req: any, res: any) => {
    res.json({ status: 'ok', service: 'e Pavti Book API', version: '1.0.0' });
  });

  // Serve static uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN', '*');
  const allowedOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((o: string) => o.trim())
    : [corsOrigin, 'http://localhost:3000', 'http://localhost:3010'];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOrigin === '*' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        // Fallback allow for web client
        callback(null, true);
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
  const config = new DocumentBuilder()
    .setTitle('e Pavti Book API')
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

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 e Pavti Book API running on port ${port} -> http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
