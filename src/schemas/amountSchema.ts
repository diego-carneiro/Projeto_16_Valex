import Joi from "joi";

const amountSchema = Joi.object({
    amount: Joi.number().min(1).required(),
});

export default amountSchema;