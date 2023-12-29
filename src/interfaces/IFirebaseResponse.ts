export interface IFireBaseResponse {
  data: {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    registered?: boolean;
    localId?: string;
  };
}
