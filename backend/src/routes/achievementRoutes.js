import { Router } from "express";
import { getItemRewards } from "../controllers/achievementController.js";

const router = Router();

router.get("/item_rewards", getItemRewards);

export { router as achievementRoutes };
