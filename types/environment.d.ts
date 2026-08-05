declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    NODE_ENV?: "development" | "test" | "production";
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_APP_URL?: string;
  }
}
