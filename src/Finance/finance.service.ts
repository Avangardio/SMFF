import {Injectable, OnModuleInit} from '@nestjs/common';
import {Action} from "./DB/action.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import axios from "axios";

//Массив ссылок на апи
const CurrencyAPILinks = [
    'https://api.freecurrencyapi.com/v1/latest?apikey=tcX6ZltCcn13xEKRtSf9zehYfML2nqEFzBUhDEyZ&currencies=GBP%2CEUR%2CRUB%2CTRY&base_currency=USD',
    'https://api.freecurrencyapi.com/v1/latest?apikey=tcX6ZltCcn13xEKRtSf9zehYfML2nqEFzBUhDEyZ&currencies=USD%2CGBP%2CRUB%2CTRY&base_currency=EUR',
    'https://api.freecurrencyapi.com/v1/latest?apikey=tcX6ZltCcn13xEKRtSf9zehYfML2nqEFzBUhDEyZ&currencies=USD%2CEUR%2CRUB%2CTRY&base_currency=GBP',
    'https://api.freecurrencyapi.com/v1/latest?apikey=tcX6ZltCcn13xEKRtSf9zehYfML2nqEFzBUhDEyZ&currencies=GBP%2CEUR%2CRUB%2CUSD&base_currency=TRY',
    'https://api.freecurrencyapi.com/v1/latest?apikey=tcX6ZltCcn13xEKRtSf9zehYfML2nqEFzBUhDEyZ&currencies=GBP%2CEUR%2CTRY%2CUSD&base_currency=RUB'
]

@Injectable()
//Класс, отвечающай за сервис Finance контроллера
export class FinanceService implements OnModuleInit {
    //Инжектируем в сервис
    constructor(@InjectRepository(Action) private repository: Repository<Action>) {
    };

    //Создаем обьект курса валют
    /*
    https://api.freecurrencyapi.com/v1/latest?apikey=7wRZSoydPoMprz32YoaxXRdvB8kM8czcrFjVZXhu&currencies=GBP%2CEUR%2CRUB%2CTRY&base_currency=USD - USD
    https://api.freecurrencyapi.com/v1/latest?apikey=7wRZSoydPoMprz32YoaxXRdvB8kM8czcrFjVZXhu&currencies=USD%2CGBP%2CRUB%2CTRY&base_currency=EUR - EUR
    https://api.freecurrencyapi.com/v1/latest?apikey=7wRZSoydPoMprz32YoaxXRdvB8kM8czcrFjVZXhu&currencies=USD%2CEUR%2CRUB%2CTRY&base_currency=GBP - GBP
    https://api.freecurrencyapi.com/v1/latest?apikey=7wRZSoydPoMprz32YoaxXRdvB8kM8czcrFjVZXhu&currencies=GBP%2CEUR%2CRUB%2CUSD&base_currency=TRY - TRY
    https://api.freecurrencyapi.com/v1/latest?apikey=7wRZSoydPoMprz32YoaxXRdvB8kM8czcrFjVZXhu&currencies=GBP%2CEUR%2CTRY%2CUSD&base_currency=RUB - RUB
     */
    public currencyList = {
        //USD-X
        'USDGBP': 0,
        'USDEUR': 0,
        'USDTRY': 0,
        'USDRUB': 0,
        'USDUSD': 1,
        //EUR-X
        'EURGBP': 0,
        'EURRUB': 0,
        'EURTRY': 0,
        'EURUSD': 0,
        'EUREUR': 1,
        //GBP-X
        'GBPUSD': 0,
        'GBPEUR': 0,
        'GBPRUB': 0,
        'GBPTRY': 0,
        'GBPGBP': 1,
        //TRY-X
        'TRYUSD': 0,
        'TRYEUR': 0,
        'TRYRUB': 0,
        'TRYGBP': 0,
        'TRYTRY': 1,
        //RUB-X
        'RUBUSD': 0,
        'RUBEUR': 0,
        'RUBGBP': 0,
        'RUBTRY': 0,
        'RUBRUB': 1
    };

    //ПО ИНИЦИАЛИЗАЦИИ ЗАПУСКАЕМ МЕТОД
    onModuleInit() {
        this.getCurrenciesList()
            .catch(error => error);
    }

    //метод сервиса, обновляющий информацию о валютах
    private async getCurrenciesList() {
        //Для каждой валюты
        ['USD', 'EUR', 'GBP', 'TRY', 'RUB'].forEach((item, index) => {
            //Отправляем запрос
            axios.get(CurrencyAPILinks[index])
                //Коллбек
                .then(
                    //В случае успеха
                    result => {
                        //Запысиваем в обьект валют
                        for (let [key, value] of Object.entries(result.data.data)) {
                            //значение
                            this.currencyList[`${item}${key}`] = value;
                        }
                        ;
                    },
                    //В случае ошибки ничего не делаем
                    error => error
                )
                //Вызываем эту функцию через чаc
                .then(nothing => setTimeout(() => this.getCurrenciesList(), 3600000));
        })
    }

    //Метод сервиса, отвечающий за получение данных из базы данных
    async getLoadFromRange_service({from, to}: { from: string, to: string }, email: string) {
        //делаем запрос и возвращаем ответ или ошибку
        return await this.repository.query(`SELECT * FROM "table:${email}" WHERE action_date >= '${from}' AND action_date <= '${to}'`);
    }

    //Метод сервиса, отвечающий за добавление записи в базу данных
    async addNewAction_service(data: ActionBody, email: string) {
        //Создаем запрос
        const query = `INSERT INTO "table:${email}" (action_date, action_name, action_description, action_type, action_amount, action_currency)
             VALUES 
             ('${data.action_date}', '${data.action_name}', '${data.action_description || ''}', ${data.action_type}, ${data.action_amount}, '${data.action_currency}')
             RETURNING *`
        //Добавляем запись в БД, должен вернуть массивс  новый обьект если все хорошо
        return this.repository.query(query);
    }

    //Метод сервиса, отвечащий за удаление записи из базы данных
    async deleteAction_service(email: string, id: number) {
        //создаем SQL запрос
        const query = `DELETE FROM "table:${email}"  WHERE action_id = ${id}`
        //отправляем запрос в базу данных
        return this.repository.query(query);
    }

    //Метод сервиса, отвечающий за изменение записи из базы данных
    async changeAction_service(data: ActionBody, email: string) {
        //Создаем SQL запрос
        const query =
            `UPDATE "table:${email}"
             SET
              action_date        = '${data.action_date}',
              action_name        = '${data.action_name}',
              action_description = '${data.action_description}',
              action_type        =  ${data.action_type},
              action_amount      =  ${data.action_amount},
              action_currency    = '${data.action_currency}'
             WHERE action_id = ${data.action_id}
             RETURNING *`;
        //Отправляем запрос, в случае успеха должен вернуть массив с обьектом
        return this.repository.query(query)
    }
}