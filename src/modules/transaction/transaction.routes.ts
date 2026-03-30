import { Router } from "express";
import { TransactionController } from "./transaction.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

router.get("/", controller.getTransactions);

export default router;
