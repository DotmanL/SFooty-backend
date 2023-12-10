import express from "express";
import { createOrUpdateAsync } from "../controllers/interest";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.post("/createOrUpdateInterest", validateRequest, createOrUpdateAsync);

module.exports = router;
