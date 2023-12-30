import { Request, Response } from "express";
import { handleErrorResponse } from "../middlewares/error-handler";
import { InterestsSchema } from "../models/interests";

async function createOrUpdateAsync(req: Request, res: Response) {
  try {
    const { userId, leagueIds, clubIds } = req.body;
    const existingInterest = await InterestsSchema.findOne({ userId });

    if (existingInterest) {
      const updatedInterest = await InterestsSchema.findOneAndUpdate(
        { userId },
        { $set: { leagueIds, clubIds } },
        { new: true }
      );

      return res.status(201).json(updatedInterest);
    }

    const interestToBeCreated = InterestsSchema.build({
      userId,
      leagueIds,
      clubIds
    });

    await interestToBeCreated.save();
    res.status(201).json(interestToBeCreated);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

export { createOrUpdateAsync };
