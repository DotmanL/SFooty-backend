import express from "express";
import { getUserAsync } from "../controllers/user";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.get("/getUser/:id", validateRequest, getUserAsync);

module.exports = router;
