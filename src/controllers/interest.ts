import { Request, Response } from "express";
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

      return res.json(updatedInterest);
    }

    const interestToBeCreated = InterestsSchema.build({
      userId,
      leagueIds,
      clubIds
    });

    await interestToBeCreated.save();
    res.status(201).json(interestToBeCreated);
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

export { createOrUpdateAsync };
