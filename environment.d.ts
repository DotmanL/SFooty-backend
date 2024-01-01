declare global {
  namespace NodeJS {
    interface ProcessEnv {
      mongoURI: string;
      SENDGRID_API_KEY: string;
      NODE_ENV: "development" | "production";
      Neo4J_Uri: string;
      Neo4J_User: string;
      Neo4J_Password: string;
    }
  }
}

export {};
