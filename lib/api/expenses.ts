import { api } from "./axios";
import {
  CreateExpensePayload,
  CreatedExpenseResponse,
  UploadAttachmentResponse,
  Attachment,
} from "@/types";

export async function getExpensesApi(): Promise<CreatedExpenseResponse[]> {
  const response = await api.get<CreatedExpenseResponse[]>("/expenses");
  return response.data;
}

export async function createExpense(
  payload: CreateExpensePayload
): Promise<CreatedExpenseResponse> {
  const response = await api.post<CreatedExpenseResponse>("/expenses", payload);
  return response.data;
}

export async function uploadExpenseAttachment(
  expenseId: string,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<UploadAttachmentResponse>(
    `/expenses/${expenseId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.attachment;
}