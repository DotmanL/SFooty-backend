import express, { Request, Response } from 'express';
import { json } from 'body-parser';

const app = express();
app.set('trust proxy', true);
app.use(json());




app.get('/', (req: Request, res: Response) => {
  res.send('Hello Big Man, lol')
})

export { app };