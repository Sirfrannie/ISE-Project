import { Router } from "express";
import {
    getUser,
    addUser,
    addUser2
} from "../controllers/userController"

const router: Router = Router();

router.post("/register", addUser2);
router.get("/:id", getUser);

export default router;