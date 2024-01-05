import { Session } from "neo4j-driver";
import { app } from "./app";
import { connectDB } from "./config/database";
const admin = require("firebase-admin");
const neo4j = require("neo4j-driver");
const serviceAccount = require("../firebaseServiceAccountKey.json");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const neo4jUri = process.env.Neo4J_Uri;
const neo4jUser = process.env.Neo4J_User;
const neo4jPassword = process.env.Neo4J_Password;

export const driver = neo4j.driver(
  neo4jUri,
  neo4j.auth.basic(neo4jUser, neo4jPassword)
);

export function createSession(): Session {
  return driver.session();
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

connectDB();

app.listen(process.env.PORT || 3001, () => {
  console.log("Listening on port 3001");
});

process.on("exit", () => {
  driver.close();
});
