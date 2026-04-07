import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — web & mobile clients
  app.enableCors({
    origin: [
      'http://localhost:3000', // Remix web
      'http://localhost:8081', // Expo web
      'exp://*',              // Expo native
    ],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Majra Marketplace API')
    .setDescription('Village Marketplace — hyperlocal, influencer-driven marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running at http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
