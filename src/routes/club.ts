import express from "express";
import {
  createAsync,
  listAsync,
  listByLeaguesAsync
} from "../controllers/club";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.post("/createClub", validateRequest, createAsync);
router.get("/listClubs", validateRequest, listAsync);
router.get("/listClubsByLeagues", validateRequest, listByLeaguesAsync);

module.exports = router;
