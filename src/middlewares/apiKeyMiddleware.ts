import { NextFunction, Request, Response } from "express";
import * as authService from "../services/authService.js"

export async function verifyApiKey(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const apiKey : any = req.headers["x-api-key"];

    if (!apiKey) {
        throw {
            error_type: "auth_error",
            message: "API key missing"
        };
    };

    const validatedCompany = await authService.validateCompany(apiKey);

    res.locals.apiKey = apiKey;
    
    next();
}