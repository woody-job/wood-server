import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from './pipes/validation.pipe';

Date.prototype.toJSON = function () {
  return this.toLocaleString();
};

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  // swagger setup
  const config = new DocumentBuilder()
    .setTitle('Wood-work бэкенд')
    .setDescription('Документация REST API')
    .setVersion('1.0.0')
    .build();

  // adding cors
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);
  // swagger setup end

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(PORT, () => {
    console.log(`Server started on port = ${PORT}`);
  });
}

bootstrap();
