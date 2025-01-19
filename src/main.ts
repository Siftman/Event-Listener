import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true
  });
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST']
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(4040);
}
bootstrap();
