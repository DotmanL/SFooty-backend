import axios from "axios";
import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { User } from "../models/user";
import { IFireBaseResponse } from "interfaces/IFirebaseResponse";

async function signUp(req: Request, res: Response) {
  try {
    const { userName, email, password, club } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError(`User already exists with email: ${email}`);
    }
    const firebaseSignUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.firebase_apiKey}`;
    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignUpUrl,
      {
        userName: userName,
        email: email,
        password: password,
        returnSecureToken: true
      }
    );

    const user = User.build({ userName, email, password, club });
    await user.save();

    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    res.status(201).json({ idToken: fireBaseResponse.data.idToken });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

//set up frontend first and ensure, I can send IdTokena and IdProvider for Google,
// for Apple, send rawNonce also
async function signUpWithIdp(req: Request, res: Response) {}

export { signUp };
