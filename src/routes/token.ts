import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { createAsync, verifyAsync } from "../controllers/token";
import { body } from "express-validator";

const router = express.Router();

router.post(
  "/createToken",
  [body("email").isEmail().withMessage("Email must be valid").notEmpty()],
  validateRequest,
  createAsync
);

router.post(
  "/verifyToken",
  [
    body("email").isEmail().withMessage("Email must be valid").notEmpty(),
    body("token").notEmpty().withMessage("Email must be valid")
  ],
  validateRequest,
  verifyAsync
);

module.exports = router;
