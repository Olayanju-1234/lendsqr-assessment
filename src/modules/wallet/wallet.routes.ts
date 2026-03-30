import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { fundSchema, transferSchema, withdrawSchema } from "./wallet.validation";

const router = Router();
const controller = new WalletController();

router.use(authenticate);

router.post("/fund", validate(fundSchema), controller.fund);
router.post("/transfer", validate(transferSchema), controller.transfer);
router.post("/withdraw", validate(withdrawSchema), controller.withdraw);
router.get("/balance", controller.getBalance);

export default router;
