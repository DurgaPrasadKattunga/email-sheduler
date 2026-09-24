export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface UserJwtPayload {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  googleId?: string;
  iat?: number;
  exp?: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email?: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}
