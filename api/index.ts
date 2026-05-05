import * as crypto from 'crypto';
if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ValidationPipe } from '../src/common/pipes/validation.pipe';

const logger = new Logger('VercelBootstrap');
const server = express();
let bootstrapPromise: Promise<any>;
let isBootstrapped = false;

// Add request logging middleware
server.use((req, res, next) => {
  console.log(
    `[REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`,
  );
  next();
});

async function bootstrap() {
  try {
    console.log('[BOOTSTRAP] Starting application...');

    // Log environment (without sensitive data)
    console.log('[BOOTSTRAP] NODE_ENV:', process.env.NODE_ENV);
    console.log('[BOOTSTRAP] PORT:', process.env.PORT);
    console.log('[BOOTSTRAP] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[BOOTSTRAP] DIRECT_URL exists:', !!process.env.DIRECT_URL);

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      },
    );

    console.log('[BOOTSTRAP] NestJS app created');

    app.enableCors({
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, apikey',
    });

    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
      .setTitle('HRIS Samugara API')
      .setDescription('HRIS Samugara Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    server.get('/api/docs-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    });

    server.get('/api/docs', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HRIS Samugara API - Swagger UI</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-bundle.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function() {
              window.ui = SwaggerUIBundle({
                url: '/api/docs-json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: 'StandaloneLayout'
              });
            };
          </script>
        </body>
        </html>
      `);
    });

    // Health check endpoint
    server.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        bootstrapped: isBootstrapped,
      });
    });

    await app.init();
    isBootstrapped = true;
    console.log('[BOOTSTRAP] NestJS app initialized successfully');
    return server;
  } catch (error) {
    console.error('[BOOTSTRAP ERROR]', error);
    console.error('[BOOTSTRAP ERROR] Stack:', error.stack);
    throw error;
  }
}

bootstrapPromise = bootstrap();

export default async (req: any, res: any) => {
  try {
    console.log(
      `[REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`,
    );

    if (!isBootstrapped) {
      console.log('[REQUEST] Waiting for bootstrap...');
    }

    const app = await bootstrapPromise;

    if (!app) {
      console.error('[REQUEST] App is null after bootstrap');
      return res.status(500).json({
        statusCode: 500,
        message: 'Application initialization failed',
      });
    }

    app(req, res);
  } catch (error) {
    console.error('[REQUEST ERROR]', error);
    console.error('[REQUEST ERROR] Stack:', error.stack);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
