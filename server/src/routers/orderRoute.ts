import { Router } from "express";
import {
    makeOrder
} from "../controllers/orderController"

const router: Router = Router();

router.post("/make", makeOrder);

export default router;