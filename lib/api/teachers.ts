import type { PaginatedResponse, TeacherItem } from "@/types";

export interface FetchTeachersParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function fetchTeachersApi(params: FetchTeachersParams = {}): Promise<PaginatedResponse<TeacherItem>> {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const res = await fetch(`/api/teachers?${search.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch teachers");
  }
  return res.json();
}

export async function createTeacherApi(payload: {
  name: string;
  teacherId: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<{ teacher: TeacherItem }> {
  const res = await fetch("/api/teachers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create teacher");
  }
  return res.json();
}

export async function updateTeacherApi(
  id: string,
  payload: {
    name?: string;
    teacherId?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }
): Promise<{ teacher: TeacherItem }> {
  const res = await fetch(`/api/teachers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update teacher");
  }
  return res.json();
}

export async function deleteTeacherApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/teachers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete teacher");
  }
  return res.json();
}
