export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse extends ApiResponse<{ user: User; token: string }> {
  success: true;
  data: { user: User; token: string };
}
