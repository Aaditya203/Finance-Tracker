import { api } from "./axios";
import {
  WorkspaceUser,
  LoginPayload,
  LoginResponse,
  ForgotPasswordResponse,
  ResetPasswordPayload,
} from "@/types";

export async function getCurrentUserApi(): Promise<WorkspaceUser | null> {
  const response = await api.get<WorkspaceUser>("/auth/me");
  return response.data;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function logoutApi(): Promise<{ message?: string }> {
  const response = await api.post<{ message?: string }>("/auth/logout");
  return response.data;
}

export async function forgotPasswordApi(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<{ message?: string }> {
  const response = await api.post<{ message?: string }>("/auth/reset-password", payload);
  return response.data;
}
