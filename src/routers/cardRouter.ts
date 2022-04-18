import { Router } from "express";
import * as cardController from "../controllers/cardController.js"
import { verifyApiKey } from "../middlewares/apiKeyMiddleware.js";
import * as middlewaresValidation from "../middlewares/schemaCheckerMiddleware.js";
import activateSchema from "../schemas/activateSchema.js";
import cardSchema from "../schemas/cardSchema.js";
import amountSchema from "../schemas/amountSchema.js";
import paymentSchema from "../schemas/paymentSchema.js";

const cardRouter = Router();

cardRouter.post("/card", middlewaresValidation.default(cardSchema), verifyApiKey, cardController.postCard);
cardRouter.post("/card/:id/activate", middlewaresValidation.default(activateSchema), verifyApiKey, cardController.activateCard);
cardRouter.get("/card/:id", verifyApiKey, cardController.getCardBalance);
cardRouter.post("/card/:id/recharge", middlewaresValidation.default(amountSchema), verifyApiKey, cardController.rechargeCard);
cardRouter.post("/card/:id/payment/:idBusiness", middlewaresValidation.default(paymentSchema), cardController.postPayment);

export default cardRouter;