export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

export interface RegisterRequest {
  username: string;
  firstname: string;
  lastname: string;
  age: number | null;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthenticationData {
  token: string;
  authenticated: boolean;
}

