import type { PaginatedResponse, StudentItem } from "@/types";

export interface FetchStudentsParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function fetchStudentsApi(params: FetchStudentsParams = {}): Promise<PaginatedResponse<StudentItem>> {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const res = await fetch(`/api/students?${search.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch students");
  }
  return res.json();
}

export async function createStudentApi(payload: {
  name: string;
  studentId: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<{ student: StudentItem }> {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create student");
  }
  return res.json();
}

export async function updateStudentApi(
  id: string,
  payload: {
    name?: string;
    studentId?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }
): Promise<{ student: StudentItem }> {
  const res = await fetch(`/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update student");
  }
  return res.json();
}

export async function deleteStudentApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/students/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete student");
  }
  return res.json();
}
