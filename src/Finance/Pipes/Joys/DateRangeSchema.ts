const Joi = require('joi');
//regexp для дат
const dateRangeRegex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$')
//функция проверки валидности дат
function dateIsValid(date) {
    return date instanceof Date && !isNaN(date.valueOf());
}

export const DateRangeSchema = Joi.object({
    from: Joi.string()
        .required()
        .pattern(dateRangeRegex)
        .custom((value, helper) => {
            let date = new Date(value);
            if (!dateIsValid(date)) throw new Error('Error');
         }),

    to: Joi.string()
        .required()
        .pattern(dateRangeRegex)
        .custom((value, helper) => {
            let date = new Date(value);
            if (!dateIsValid(date)) throw new Error('Error');
        }),
}).options({
    abortEarly: false,
});
