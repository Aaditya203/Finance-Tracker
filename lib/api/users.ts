import { api } from "./axios";
import { WorkspaceUser } from "@/types";

export async function getUsersApi(): Promise<WorkspaceUser[]> {
  const response = await api.get<WorkspaceUser[]>("/users");
  return response.data;
}
