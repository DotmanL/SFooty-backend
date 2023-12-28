import express, { Request, Response } from "express";
import { json } from "body-parser";
import cookiesession from "cookie-session";
import { errorHandler } from "./middlewares/error-handler";
// import { NotFoundError } from './errors/not-found-error';
import cors from "cors";

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(json());
app.use(
  cookiesession({
    signed: false //disabled encryption since out jwt are encrypted already
    // secure: `${process.env.NODE_ENV}` !== 'test',
    //we are setting the secure value of sending cookie via https to be true if not in a test environment
  })
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/onboarding", require("./routes/onboarding"));
app.use("/api/interest", require("./routes/interest"));
app.use("/api/club", require("./routes/club"));
app.use("/api/league", require("./routes/league"));
app.use("/api/user", require("./routes/user"));
app.use("/api/token", require("./routes/token"));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello Big Man, lol");
});

// app.all('*', async () => {
//   throw new NotFoundError();
// });

app.use(errorHandler);
export { app };
