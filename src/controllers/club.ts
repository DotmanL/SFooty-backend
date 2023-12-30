import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { ClubsSchema } from "../models/clubs";
import { handleErrorResponse } from "../middlewares/error-handler";

async function createAsync(req: Request, res: Response) {
  try {
    const { name, leagueId } = req.body;
    const existingClub = await ClubsSchema.findOne({ name });

    if (existingClub) {
      throw new BadRequestError(`Club already exists with name: ${name}`);
    }

    const clubToBeCreated = ClubsSchema.build({ name, leagueId });
    await clubToBeCreated.save();

    res.status(201).json(clubToBeCreated);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listAsync(req: Request, res: Response) {
  try {
    const clubs = await ClubsSchema.find().sort({ createdAt: "asc" });

    if (!clubs) {
      return res.status(404).json({ message: "No clubs found" });
    }
    return res.status(200).json(clubs);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listByLeaguesAsync(req: Request, res: Response) {
  try {
    const clubs = await ClubsSchema.aggregate([
      {
        $lookup: {
          from: "leagues",
          localField: "leagueId",
          foreignField: "_id",
          as: "leagues"
        }
      },
      {
        $unwind: "$leagues"
      },
      {
        $sort: {
          "leagues.createdAt": 1
        }
      },
      {
        $group: {
          _id: "$leagues._id",
          leagueName: { $first: "$leagues.name" },
          clubs: { $push: "$$ROOT" }
        }
      }
    ]);
    return res.status(200).json(clubs);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

export { createAsync, listAsync, listByLeaguesAsync };
