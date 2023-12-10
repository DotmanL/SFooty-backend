import { connectDB } from "../config/database";
import { ILeague, LeaguesSchema } from "../models/leagues";
import { connection } from "mongoose";

connectDB();

export const leagues: ILeague[] = [
  {
    name: "Premier League",
    country: "England"
  },
  { name: "La Liga", country: "Spain" },
  { name: "Bundesliga", country: "Germany" },
  { name: "Ligue 1", country: "France" },
  { name: "Serie A", country: "Italy" }
];

const runMigration = false;

if (runMigration) {
  connection.once("open", async () => {
    console.log("Connected to MongoDB for league migration");

    for (const league of leagues) {
      const leagueToBeCreated = LeaguesSchema.build({
        name: league.name,
        country: league.country
      });
      await leagueToBeCreated.save();
    }

    console.log("Migration complete");
    process.exit();
  });
}
