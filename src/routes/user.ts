import express from "express";
import { deleteAccountAsync, getUserAsync } from "../controllers/user";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";

const router = express.Router();

router.get("/getUser/:id", validateRequest, getUserAsync);
router.delete("/deleteAccount/:id", validateRequest, deleteAccountAsync);

module.exports = router;
