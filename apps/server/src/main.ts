import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // 静态前端（生产构建）
  app.useStaticAssets(join(__dirname, '..', '..', 'web', 'dist'));
  // SPA fallback
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(__dirname, '..', '..', 'web', 'dist', 'index.html'));
  });
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3005',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Paperbox ERP API')
    .setDescription('纸箱 ERP API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`[Paperbox ERP] Server running on http://localhost:${port}`);
  console.log(`[Paperbox ERP] Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
