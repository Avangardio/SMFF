import {NestFactory} from '@nestjs/core';
import {AppModule} from './App/app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({origin: `http://localhost:8080`, credentials: true});
    app.use(cookieParser());
    await app.listen(3001);
    console.log('Finance Server Listening on http://localhost:3001')
}

bootstrap();
