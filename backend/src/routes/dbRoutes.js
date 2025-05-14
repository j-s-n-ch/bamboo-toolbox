import { Router } from "express";
import { postUserLevels } from "../controllers/dbController.js";

const router = Router();

router.post("/user_levels", postUserLevels);

export { router as dbRoutes };
