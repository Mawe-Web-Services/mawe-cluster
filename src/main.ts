import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // Iniciando um setInterval que executa a cada 5 segundos
    /*setInterval(() => {
      console.log('Servidor rodando...');
    }, 5000);
    */
  
  await app.listen(3000);
}
bootstrap();
