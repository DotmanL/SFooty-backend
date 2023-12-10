import { app } from "./app";
import { connectDB } from "./config/database";
const admin = require("firebase-admin");
const serviceAccount = require("../firebaseServiceAccountKey.json");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

connectDB();

app.listen(process.env.PORT || 3001, () => {
  console.log("Listening on port 3001");
});
