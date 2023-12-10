import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validate-request";
import { signUpAsync } from "../controllers/auth";

const router = express.Router();

router.post(
  "/signup",
  [
    body("userName").not().isEmpty(),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
  ],
  validateRequest,
  signUpAsync
);

router.post(
  "/signupWithIdp",
  [
    body("userName").not().isEmpty(),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters")
  ],
  validateRequest,
  signUpAsync
);

module.exports = router;
