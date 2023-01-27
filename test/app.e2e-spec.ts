import {Test, TestingModule} from '@nestjs/testing';
import {ExecutionContext, INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/App/app.module';
import * as cookieParser from 'cookie-parser';

//E-2E ТЕСТ ФИНАНСОВОГО СЕРВЕРА
describe('Finance Server (e2e)', () => {
    //Подключаем эпп
    let app: INestApplication;

    //Перед каждым тестом пересобирает сервер
    beforeEach(async () => {
        //Создаем тестовый модуль
        const moduleFixture: TestingModule = await Test.createTestingModule({
            //Импортируем главный модуль сервера
            imports: [AppModule],
            //Компилируем
        })
            .compile();
        //Создаем приложение
        app = moduleFixture.createNestApplication();
        //Запускаем его
        app.use(cookieParser());
        await app.init();
    });
    //ВАЖНО! Для тестов рекомендуется использовать аккаунт из базы данных и на аккаунте есть записи
    //Переходим к тестам
    //Для этих тестов я буду использовать уже подписанные jwt куки, так как тест именно финансового сервера
    //todo - прописать сюда куки на сто лет
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50Ijp7ImVtYWlsIjoiYXZhbmdhcmRpbzE0NThAZ21haWwuY29tIiwibmlja25hbWUiOiLQkNGA0YLRkdC8INCR0LXQu9GP0L3QuNC9In0sImlhdCI6MTY3NDUxMDk2OCwiZXhwIjoxNjg3NDcwOTY4fQ.SlDkd1CUm4rVhsMMYPwK8_F7bFxbCr6xpZJTG7ULugQ'
    //Первый тест -  получение данных из базы данных за выбранные даты из кваери - даты есть, но не валидные
    it('[FINANCE] - (1) - /loadFromRange (GET) [НЕПРАВИЛЬНЫЕ ДАТЫ]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .get('/finance/loadFromRange?from=1990-13-34&to=2023-12-31')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Должны получить BAD REQUEST - 400
            .expect(400)
    });
    //Второй тест -  получение данных из базы данных за выбранные даты из кваери - дат нет
    it('[FINANCE] - (2) - /loadFromRange (GET) [НЕТ ДАТ]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .get('/finance/loadFromRange')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Должны получить BAD REQUEST - 400
            .expect(400)
    });
    //Третий тест -  получение данных из базы данных за выбранные даты из кваери - даты правильные, записи есть
    it('[FINANCE] - (3) - /loadFromRange (GET) [ВСЕ ОК]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .get('/finance/loadFromRange?from=1990-12-01&to=2023-12-31')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Должны получить OK - 200
            .expect(200)
            //И количество записей в массиве должно быть бдльше нуля
            .expect(res => res.body.length > 0)
    });
    //Четвертый тест -  запрос на получение курса валют, обычный гет запрос
    it('[FINANCE] - (4) - /getCurrency (GET) [ВСЕ ОК]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .get('/finance/getCurrency')
            //Должны получить OK - 200
            .expect(200)
            //И количество записей в массиве ключей обьекта должно быть бдльше нуля
            .expect(res => Object.keys(res.body).length > 0)
    });
    //Пятый тест -  запрос на добавление новой записи , пост запрос- некорректное тело
    it('[FINANCE] - (5) - /addNewAction (POST) [ТЕЛО ЗАПРОСА НЕКОРРЕКТНОЕ]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .post('/finance/addNewAction')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Отправляем тело запроса
            .send({
                data: {
                    //Некоторые поля не пишем, некоторые неправильно
                    email: '123213313sadsdad@sae',
                    action_id: 2232132132131,
                    action_amount: '12321321321321312',
                    action_type: 'wut',
                    action_currency: 'tenge'
                }
            })
            //Должны получить BAD REQUEST - 400
            .expect(400)
    });
    //Шестой тест -  запрос на добавление новой записи, пост запрос -  тело запроса правильное
    it('[FINANCE] - (6) - /addNewAction (POST) [ТЕЛО ЗАПРОСА ОК]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .post('/finance/addNewAction')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Отправляем тело запроса
            .send({
                "data": {
                    "action_date": "2022-11-23",
                    "action_name": "Loshped",
                    "action_description": "",
                    "action_type": 3,
                    "action_amount": -333.21,
                    "action_currency": "GBP"
                }
            })
            //Должны получить BAD REQUEST - 400
            .expect(200)
            //И в ответе должно быть следющее:
            .expect('Success')
    });
    //Седьмой тест -  запрос на изменение записи, пост запрос -  тело запроса неправильное
    it('[FINANCE] - (7) - /changeAction (POST) [ТЕЛО ЗАПРОСА ПЛОХОЕ]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .post('/finance/changeAction')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Отправляем тело запроса
            .send({
                "data": {
                    "action_id": '321313123123213qdsadsad',
                    "action_date": "2022-11-23",
                    "action_name": "CHANGED",
                    "action_description": "",
                    "action_type": 5,
                    "action_amount": 1000,
                    "action_currency": "GBP"
                }
            })
            //Должны получить BAD REQUEST - 400
            .expect(400)
    });
    //Восьмой тест -  запрос на изменение записи, пост запрос -  тело запроса правильное
    it('[FINANCE] - (8) - /changeAction (POST) [ТЕЛО ЗАПРОСА ОК]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос
            .post('/finance/changeAction')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Отправляем тело запроса
            .send({
                "data": {
                    "action_id": 1,
                    "action_date": "2022-11-23",
                    "action_name": "CHANGED",
                    "action_description": "",
                    "action_type": 5,
                    "action_amount": 1000,
                    "action_currency": "GBP"
                }
            })
            //Должны получить OK - 200
            .expect(200)
    });

    //Девятый тест -  запрос на удаление записи, пост запрос -  тело запроса неправильное
    it('[FINANCE] - (9) - /deleteAction (GET) [ТЕЛО ЗАПРОСА ПЛОХОЕ]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос с плохим кваери
            .get('/finance/deleteAction?id=sadadsadasd')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Отправляем тело запроса
            //Должны получить BAD REQUEST - 400
            .expect(400)
    });
    //Десятый тест -  запрос на удаление записи, пост запрос -  тело запроса правильное
    it('[FINANCE] - (10) - /deleteAction (GET) [ТЕЛО ЗАПРОСА ОК]', () => {
        return request(app.getHttpServer())
            //Отправляем запрос с ок кваери
            .get('/finance/deleteAction?id=1')
            //Прикрепляем куки с jwt
            .set('Cookie', `account=${jwt};`)
            //Прописываем заголовки
            .set("Accept", "application/json")
            //Должны получить OK - 200
            .expect(200)
            //И в ответе должно быть следющее:
            .expect('Delete Success')
    });
});
