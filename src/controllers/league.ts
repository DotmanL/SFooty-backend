import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { LeaguesSchema } from "../models/leagues";

async function createAsync(req: Request, res: Response) {
  try {
    const { name, country } = req.body;
    const existingLeague = await LeaguesSchema.findOne({ name });

    if (existingLeague) {
      throw new BadRequestError(`League already exists with name: ${name}`);
    }

    const leagueToBeCreated = LeaguesSchema.build({ name, country });
    await leagueToBeCreated.save();
    res.status(201).json(leagueToBeCreated);
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

async function listAsync(req: Request, res: Response) {
  try {
    const leagues = await LeaguesSchema.find().sort({ createdAt: "asc" });

    if (!leagues) {
      return res.status(404).json({ msg: "No leagues found" });
    }
    return res.status(200).json(leagues);
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

export { createAsync, listAsync };
