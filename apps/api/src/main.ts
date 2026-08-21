import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { BRAND_NAME } from '@pavti/shared';
import { EmptyStringToUndefinedPipe } from './common/pipes/empty-string-to-undefined.pipe';
import { validationExceptionFactory } from './common/validation-exception.factory';

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
  httpAdapter.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: `${BRAND_NAME} API`, version: '1.0.0' });
  });
  httpAdapter.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  httpAdapter.get('/api/v1', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: `${BRAND_NAME} API`, version: '1.0.0' });
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

  // The `else` branch here used to unconditionally `callback(null, true)`,
  // which made every check above it dead code — the allowlist was never
  // actually enforced, every origin was let through regardless of
  // CORS_ORIGIN. Combined with `credentials: true`, that's a real
  // misconfiguration worth fixing before this handles production traffic,
  // even though this app sends auth via a Bearer header (not cookies) so
  // there's no session to silently steal. This now actually enforces the
  // allowlist — app.epavtibook.com is hardcoded below as a permanent entry
  // (same treatment as localhost) so the real production frontend keeps
  // working even if CORS_ORIGIN is ever unset/misconfigured on Railway;
  // CORS_ORIGIN itself should still be set there too, for any additional
  // origin (a staging domain, etc.) beyond this hardcoded pair.
  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin || // same-origin/non-browser callers (curl, server-to-server, Postman) send no Origin header
        corsOrigin === '*' ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https:\/\/(app\.)?epavtibook\.com$/.test(origin);
      callback(isAllowed ? null : new Error(`Origin ${origin} not allowed by CORS`), isAllowed);
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation — EmptyStringToUndefinedPipe runs first (global pipes run in
  // array order), so a blank optional field ('') reads as "not provided" to
  // every DTO's @IsOptional() the same way omitting the key entirely would,
  // instead of tripping whatever stricter validator it's paired with
  // (@IsEmail(), @MinLength(), ...) — see that pipe's own comment for the
  // live bug this closes. validationExceptionFactory then formats whatever
  // *does* fail into one readable string instead of NestJS's default
  // unjoined message array (see that file's comment).
  app.useGlobalPipes(
    new EmptyStringToUndefinedPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle(`${BRAND_NAME} API`)
    .setDescription('Production API for digital receipt & collection management for Mandals, trusts, NGOs and community organizations')
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
  console.log(`🚀 ${BRAND_NAME} API running on port ${port} -> http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
