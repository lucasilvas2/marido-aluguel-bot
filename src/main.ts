import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('WhatsAppBootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita CORS para permitir requisições do frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Marido Aluguel API')
    .setDescription('API para gerenciamento de funcionalidades do Marido Aluguel')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📱 WhatsApp QR Code: http://localhost:${port}/whatsapp/qrcode`);
  logger.log(`📊 WhatsApp Status: http://localhost:${port}/whatsapp/status`);
  logger.log('');
  logger.log('💡 Para conectar seu WhatsApp:');
  logger.log('   1. Acesse o endpoint /whatsapp/qrcode');
  logger.log('   2. Escaneie o QR Code com seu celular');
  logger.log('   3. Aguarde a mensagem de conexão bem-sucedida');
  logger.log('');
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
