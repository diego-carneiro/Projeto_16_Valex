import Joi from "joi";

const activateSchema = Joi.object({
    securityCode: Joi.string().required(),
    password: Joi.string().pattern(/^[0-9]{4}$/).required(),
});

export default activateSchema;