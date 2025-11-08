import { Router } from "express";
import { 
    addProduct,
    getProducts,
    checkStock
} from "../controllers/productController";
const router: Router = Router();

router.get("/", getProducts);
router.post("/check", checkStock);
router.post("/add/:id", addProduct);

export default router;