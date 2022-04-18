import Joi from "joi";

const paymentSchema = Joi.object({
    amount: Joi.number().min(1).required(),
    password: Joi.string().required(),
});

export default paymentSchema;