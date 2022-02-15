declare global {
  namespace NodeJS {
    interface ProcessEnv {
      mongoURI: string;
      NODE_ENV: 'development' | 'production';
  
    }
  }
}

export {}