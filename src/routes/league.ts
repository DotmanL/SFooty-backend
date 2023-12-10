import express from "express";
import { createAsync, listAsync } from "../controllers/league";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.post("/createLeague", validateRequest, createAsync);
router.get("/listLeagues", validateRequest, listAsync);

module.exports = router;
