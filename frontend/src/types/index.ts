export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experienceLevel: "student" | "entry" | "mid" | "senior" | "lead";
  preferredRole: string;
}

export interface AuthResponse extends ApiResponse<{ user: User; token: string }> {
  success: true;
  data: { user: User; token: string };
}

export interface ProfileResponse extends ApiResponse<{ user: User; token?: string }> {
  success: true;
  data: { user: User; token?: string };
}
