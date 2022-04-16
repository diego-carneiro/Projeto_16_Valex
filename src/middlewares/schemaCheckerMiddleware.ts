import { NextFunction, Request, Response } from "express";
import { valid } from "joi";

export default function schemaChecker(schema) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const validation = schema.validate(req.body);

        if (validation.error) {
            console.log(validation.error.message);
            return res.status(422).send(validation.error.message);
        };

        next();
    };
};