import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Job Application API')
    .setDescription('API for job postings and applications')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  const url = 'http://localhost:' + (process.env.PORT ?? 3001);
  console.log(`Application is running on: ${url}`);
  console.log(`Swagger UI available at: ${url}/api`);
  console.log(
    `Socket.IO available at: ws://localhost:${process.env.PORT ?? 3001}`,
  );
}
bootstrap();
