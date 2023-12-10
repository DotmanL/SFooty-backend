import axios from "axios";
import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { OnboardingStatus, User } from "../models/user";
import { IFireBaseResponse } from "interfaces/IFirebaseResponse";
import { calculateExpirationTime } from "../utility/dateTime";

async function signUpAsync(req: Request, res: Response) {
  try {
    const { userName, email, password } = req.body;
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

    const user = User.build({
      userName,
      email,
      password,
      onboardingStatus: OnboardingStatus.None
    });
    await user.save();

    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(201).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime
    });
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

// Example: Find a user and populate the club and leagues
// use to find
// User.findOne({ username: 'exampleUser' })
//   .populate({
//     path: 'club',
//     populate: { path: 'leagues' },
//   })
//   .exec((err, user) => {
//     if (err) throw err;
//     console.log(user);
//   });

//create endpoint to track onboarding progress of user

//set up frontend first and ensure, I can send IdTokena and IdProvider for Google,
// for Apple, send rawNonce also
async function signUpWithIdp(req: Request, res: Response) {}

export { signUpAsync };
