import {Module} from '@nestjs/common';
import {Action} from "../Finance/DB/action.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {FinanceModule} from "../Finance/finance.module";
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        //Ипортируем финансовый модуль
        FinanceModule,
        //Подключаем .env файл
        ConfigModule.forRoot(),
        //Подключаем орм
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: 5432,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: 'users_db',
            entities: [Action],
            synchronize: false,
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}
