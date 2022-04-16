import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import router from "./routers/index.ts"

const server = express();
server.use(cors());
server.use(express.json());
// server.use(error, )
server.use(router);

export default server;

const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log(`Running at ${port}`);
});

