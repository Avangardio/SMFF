import {Body, Controller, Get, Param, Post, Query, Request, Res, Response, Sse} from '@nestjs/common';
import {FinanceService} from "./finance.service";
import {JoiValidationPipe} from "./Pipes/JoiValidationPipe";
import {DateRangeSchema} from "./Pipes/Joys/DateRangeSchema";
import {map, Observable, ReplaySubject} from "rxjs";
import {ActionSchema} from "./Pipes/Joys/ActionSchema";

@Controller('finance')
//Класс, отвечающий за работу контроллера
export class FinanceController {
    //Добавляем класс соответсвуюшего сервиса
    constructor(private readonly financeService: FinanceService) {
    }

    //Определяем поток для sse
    private stream: {
        //email - индентификатор потоков
        email: string;
        //субьект
        subject: ReplaySubject<unknown>;
        //обсервер
        observer: Observable<unknown>;
    }[] = [];

    @Sse('sse')
    //Метод контроллера, отвечающая за обработку и добавления потока для работы с server-sent-events
    //Получает имейл из body с помощью мидлвейра
    public sse(@Request() request, @Res() response: Response): Observable<MessageEvent> {
        //Удаляем поток, если хозяин прервал соединение и вышел
        response['on']('close', () => this.removeStream(request.body['email']));
        //Создаем новый поток
        const subject = new ReplaySubject();
        //Добавляем обсервер на субъект
        const observer = subject.asObservable();
        //Добавляем поток с идентификатором
        this.addStream(subject, observer, request.body['email']);

        //Возвращаем обсервабл для отправки при получении данных
        // !!! Можно пайп вешать на сабжект см https://www.learnrxjs.io/learn-rxjs/subjects/replaysubject
        return observer.pipe(map(({event, data}) => ({
            id: `my-user-email:${request.body['email']}`,
            data: `${data}`,
            type: `${event}`,
        }) as unknown as MessageEvent));
    }

    //Метод, ответственный за добавление потока
    private addStream(subject: ReplaySubject<unknown>, observer: Observable<unknown>, email: string): void {
        this.stream.push({
            email: email,
            subject,
            observer,
        });
    }

    //Метод, ответственный за удаление потока
    private removeStream(email: string): void {
        this.stream = this.stream.filter(stream => stream.email !== email);
    }

    @Get('loadFromRange')
    //Метод, отвечающий за обработку гет запроса, вкучающий кваери start: начало поиска end: конец поиска
    async getLoadFromRange_controller(
        @Query(new JoiValidationPipe(DateRangeSchema)) query: { from: string, to: string },
        @Request() request: Request,
        @Response() response): Promise<void> {
        //Вызываем метод сервиса для запроса данных, выполнения не ждем
        this.financeService.getLoadFromRange_service(query, request.body['email'])
            .then(
                //Колбек успеха, отправляем массив
                result => response.status(200).send(result),
                //Отправляем ошибку
                error => response.status(400).send('Error getting data')
            );
    };

    @Get('getCurrency')
    //Метод, отвечающий за получение курсов валют
    async getCurrency_controller() {
        //Возвращаем обьект валют
        return this.financeService.currencyList;
    }

    @Post('addNewAction')
    //Метод, отвечающий за обработку пост запроса, включает тело запроса, проверенное пайпом
    async addNewAction_controller(
        @Body(new JoiValidationPipe(ActionSchema)) body: { data: ActionBody },
        @Request() request: Request,
        @Response() response): Promise<void> {
        //Вызываем метод сервиса
        this.financeService.addNewAction_service(body.data, request.body['email'])
            //Ловим колбеки
            .then(
                //Колбек успеха - отправляем ок
                result => {
                    //Отправляем ответ
                    response.status(200).send('Success');
                    // отправляем ивент пользователям
                    this.stream
                        //Фильтруем поток, оставляя ВСЕ те, на которых имейл совпадает
                        .filter(stream => stream.email === request.body['email'])
                        //Отправляем данные
                        .forEach(({subject, email}) => subject.next({
                            data: `${JSON.stringify(result[0])}`,
                            event: 'NewAction',
                        }));
                },
                //Колбек ошибки - отправляем ошибку
                error => response.status(400).send(error.message)
            )
    }

    @Get('deleteAction')
    //Метод, отвечающий за обработку пост запроса, включает имейл из request.body.email через мидллвейр и кваери
    async deleteAction_controller(@Query() query: { id: string }, @Request() request: Request, @Response() response) {
        //Проверяем, есть ли id и оно является число, иначе возвращем ошибку
        if (!query.id || isNaN(+query.id)) return response.status(400).send('Error');
        //Вызываем метод сервиса, который сделает запрос в базу данных, ID ОБЯЗАТЕЛЬНО делаем числом
        this.financeService.deleteAction_service(request.body['email'], +query.id)
            .then(
                //Колбек успеха
                result => {
                    //Отправляем ответ клиенту что все прошло успешно
                    response.status(200).send('Delete Success');
                    //Отправляем ивент на поток
                    this.stream
                        //Фильтруем поток, оставляя ВСЕ те, на которых имейл совпадает
                        .filter(stream => stream.email === request.body['email'])
                        //Отправляем данные через sse
                        .forEach(({subject, email}) => subject.next({
                            data: `${query.id}`,
                            event: "DeleteAction"
                        }));
                },
                //Коллбек ошибки, отправвляем 400
                error => response.status(400).send('Deleting error')
            )
    }

    @Post('changeAction')
    //Метод, отвечающий за обработку Post запроса, включает имейл из мидлвейра и обьект боди, провернный пайпом
    async changeAction_controller(
        @Body(new JoiValidationPipe(ActionSchema)) body: { data: ActionBody },
        @Request() request: Request,
        @Response() response): Promise<void> {
        //Проверяем, есть ли id, иначе возвращаем ошибку
        if (!body.data.action_id || isNaN(+body.data.action_id)) return response.status(400).send('Error');
        //Вызываем метод сервиса
        this.financeService.changeAction_service(body.data, request.body['email'])
            .then(
                //Ловим коллбек успеха
                result => {
                    //Отправляем ответ клиенту
                    response.status(200).send('Change Success');
                    //Отправляем ивен клиенту
                    this.stream
                        //Фильтруем поток, оставляя ВСЕ те, на которых имейл совпадает
                        .filter(stream => stream.email === request.body['email'])
                        //Отправляем данные через sse
                        .forEach(({
                                      subject,
                                      email
                                  }) => subject.next({
                            data: `${JSON.stringify(result[0])}`,
                            event: 'ChangeAction'
                        }));
                },
                //Коллбек ошибки, оптравляем ответ клиенту
                error => {
                    response.status(400).send('Change Error')
                }
            )
    }
}
