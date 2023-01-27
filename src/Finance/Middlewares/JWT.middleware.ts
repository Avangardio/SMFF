import {NextFunction, Request, Response} from 'express';
import {Injectable, NestMiddleware} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";

@Injectable()
//Миддлвейр, ответсвенный за проверку наличия аккаунта
export class JWTMiddleware implements NestMiddleware {
    //Добавляем JWT
    constructor(private readonly jwtService: JwtService) {
    };

    //Метод миддлвейра
    use(req: Request, res: Response, next: NextFunction) {
        try {
            //Расшифровываем токен
            const decoded = this.jwtService.verify(req.cookies.account)
            //Проверяем, есть ли имейл
            if (!decoded.account.email) throw new Error();
            //Все нормально, добавляем данные в реквест
            req.body.email = decoded.account.email;
            //Иначе заканчиваем запрос
        } catch (error) {
            //с ошибкой
            console.log(error)
            return res.status(400).send('Verification Error')
        }
        //Если все хорошо, то отправляем дальше
        next()
    }
};