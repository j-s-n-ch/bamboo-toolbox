import { Router } from "express";
import {
  getChests
} from "../controllers/lootTableController.js";

const router = Router();

router.get("/chests", getChests);

export { router as lootTableRoutes };
