declare global {
  namespace NodeJS {
    interface ProcessEnv {
      mongoURI: string;
      SENDGRID_API_KEY: string;
      NODE_ENV: "development" | "production";
    }
  }
}

export {};
