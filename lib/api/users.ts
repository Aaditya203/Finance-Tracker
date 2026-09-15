import { api } from "./axios";
import { WorkspaceUser } from "@/types";

export async function getUsersApi(): Promise<WorkspaceUser[]> {
  const response = await api.get<WorkspaceUser[]>("/users");
  return response.data;
}

export async function updateProfileApi(payload: {
  name?: string;
  telegramUserID?: string | null;
}): Promise<WorkspaceUser> {
  const response = await api.patch<WorkspaceUser>("/users/profile", payload);
  return response.data;
}
