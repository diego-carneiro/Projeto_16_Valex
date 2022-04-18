import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Response, Request } from "express";
import "express-async-errors";
import router from "./routers/index.js"

const server = express();
server.use(cors());
server.use(express.json());
server.use(router);
server.use((error: any, req : Request, res: Response, next: NextFunction) => {
    console.log(error);
    
    if (error.type === "invalid_entity") {
        return res.sendStatus(422);
    }
    
    if (error.type === "auth_error") {
        return res.sendStatus(401);
    }
    
    if (error.type === "not_found") {
        return res.sendStatus(404);
    }
    
    if (error.type === "conflict") {
        return res.sendStatus(409);
    }
    
    return res.status(500).send("Something went wrong.");
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log(`Running at ${port}`);
});