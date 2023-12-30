import { Request, Response } from "express";
import Crypto from "crypto";
import { UserSchema } from "../models/user";
import { BadRequestError } from "../errors/bad-request-error";
import { TokenSchema } from "../models/token";
import "dotenv/config";
import { handleErrorResponse } from "../middlewares/error-handler";

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function createAsync(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const randomToken = generateRandomNumericToken();
    const existingUser = await UserSchema.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(`No user exists with email: ${email}`);
    }

    const existingToken = await TokenSchema.findOne({ email });

    if (existingToken) {
      await existingToken.delete();
    }

    const token = TokenSchema.build({
      email,
      token: randomToken
    });

    await token.save();

    const dynamicTemplateData = {
      token: token.token,
      username: existingUser.userName
    };

    const templateId = "d-211ec0876afb4e45b24871613d6391c9";

    const message = {
      to: { email },
      from: "oladotunlawal7@gmail.com",
      subject: "Your Verification code",
      templateId: templateId,
      dynamic_template_data: dynamicTemplateData
    };

    try {
      await sgMail.send(message);
      res.status(201).json({
        status: "success"
      });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({
        errors: [
          {
            message:
              err.message || "failure to send mail" || "Internal Server Error",
            status: err.statusCode || 500
          }
        ]
      });
    }
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function verifyAsync(req: Request, res: Response) {
  try {
    const { email, token } = req.body;
    const existingToken = await TokenSchema.findOne({ email, token });

    if (!existingToken) {
      throw new BadRequestError(
        `Invalid token or token must have expired for: ${email}`
      );
    }

    res.status(201).json({
      status: "success"
    });
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

function generateRandomNumericToken() {
  const length = 4;
  const max = Math.pow(10, length) - 1;
  const randomBytes = Crypto.randomBytes(Math.ceil(length / 2));
  const token = (parseInt(randomBytes.toString("hex"), 16) % max) + 1;
  return token.toString().padStart(length, "0");
}
export { createAsync, verifyAsync };
