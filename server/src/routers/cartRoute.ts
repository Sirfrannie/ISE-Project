import { Router } from "express";
import {
    getCart,
    addToCart,
    clearCart,
    removeFromCart
} from "../controllers/cartController"
const router: Router = Router();

router.post("/add", addToCart);
router.post("/get", getCart);
router.post("/remove", removeFromCart);
router.post("/clear", clearCart);

export default router;