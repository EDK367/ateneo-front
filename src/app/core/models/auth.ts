export interface LoginRequest {
  user: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  role: string;
}