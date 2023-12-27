import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validate-request";
import {
  getEmailProvidersAsync,
  loginAsync,
  loginWithIdpAsync,
  signUpAsync,
  signUpWithIdpAsync
} from "../controllers/auth";

const router = express.Router();

router.post(
  "/signup",
  [
    body("userName").notEmpty(),
    body("email").isEmail().withMessage("Email must be valid").notEmpty(),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
  ],
  validateRequest,
  signUpAsync
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email must be valid").notEmpty(),
    body("password")
      .notEmpty()
      .withMessage("Password cannot be empty")
      .notEmpty()
  ],
  validateRequest,
  loginAsync
);

router.post(
  "/signupWithIdp",
  [
    body("userName").not().isEmpty(),
    body("email").isEmail().withMessage("Email must be valid"),
    body("idToken").notEmpty(),
    body("providerId").notEmpty()
  ],
  validateRequest,
  signUpWithIdpAsync
);

router.post(
  "/loginWithIdp",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("idToken").notEmpty(),
    body("providerId").notEmpty()
  ],
  validateRequest,
  loginWithIdpAsync
);

router.post(
  "/getEmailProvider",
  [body("email").isEmail().withMessage("Email must be valid")],
  validateRequest,
  getEmailProvidersAsync
);

module.exports = router;
