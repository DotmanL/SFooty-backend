import { app } from "./app";
import { connectDB } from "./config/database";
const admin = require("firebase-admin");
const neo4j = require("neo4j-driver");
const serviceAccount = require("../firebaseServiceAccountKey.json");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const neo4jUri = process.env.Neo4J_Uri;
const neo4jUser = process.env.Neo4J_User;
const neo4jPassword = process.env.Neo4J_Password;

// Create a Neo4j driver instance
const driver = neo4j.driver(
  neo4jUri,
  neo4j.auth.basic(neo4jUser, neo4jPassword)
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

connectDB();

const testNodeCreation = false;

/// TODO: add code to create constraint on USER Node model one time before actually creaating node

if (testNodeCreation) {
  const session = driver.session();

  const username = "ola";
  async function createUser() {
    try {
      const result = await session.run(
        `CREATE (u:User {name: "${username}"}) RETURN u`
      );

      const createdUser = result.records[0].get("u").properties;

      console.log(createdUser, "created");
      // res.json({ user: createdUser, message: 'User created successfully' });
    } catch (error) {
      console.error("Error executing Neo4j query:", error);
    } finally {
      await session.close();
    }
  }

  createUser();
}

app.listen(process.env.PORT || 3001, () => {
  console.log("Listening on port 3001");
});

process.on("exit", () => {
  driver.close();
});
