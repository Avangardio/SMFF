import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {FinanceService} from "./finance.service";
import {FinanceController} from "./finance.controller";
import {Action} from "../Finance/DB/action.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {JWTMiddleware} from "./Middlewares/JWT.middleware";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [

        //Подключаем орм с репозиторием Users
        TypeOrmModule.forFeature([Action]),
        //Подключаем .env файл
        ConfigModule.forRoot(),
        //Подключаем jwt модуль
        JwtModule.register({secret: process.env.SERVER_SECRET}),
    ],
    controllers: [FinanceController],
    providers: [FinanceService],
})
//Добавляем миддлвейр на все роуты здесь
export class FinanceModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JWTMiddleware)
            .exclude({path: 'finance/getCurrency', method: RequestMethod.GET})
            .forRoutes(FinanceController)
    }
}