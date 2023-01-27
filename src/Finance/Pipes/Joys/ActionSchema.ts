const Joi = require('joi');
const dateRangeRegex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');

function dateIsValid(date) {
    return date instanceof Date && !isNaN(date.valueOf());
}


export const ActionSchema = Joi.object({
    email: Joi.string(),

    data: {
        action_id: Joi.number().allow(null)
            .positive(),

        action_date: Joi.string()
            .required()
            .pattern(dateRangeRegex)
            .custom((value, helper) => {
                let date = new Date(value);
                if (!dateIsValid(date)) throw new Error('Error');
            }),

        action_name: Joi.string()
            .required(),

        action_description: Joi.string()
            .allow(''),

        action_type: Joi.number()
            .required()
            .valid(1, 2, 3, 4, 5, 6, 7, 8, 9),

        action_amount: Joi.number()
            .required(),

        action_currency: Joi.string()
            .required()
            .valid("GBP", "USD", "TRY", 'EUR', "RUB")
    }

}).options({
    abortEarly: false,
});
