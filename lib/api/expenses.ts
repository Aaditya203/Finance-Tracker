import { api } from "./axios";
import {
  CreateExpensePayload,
  CreatedExpenseResponse,
  UploadAttachmentResponse,
  Attachment,
} from "@/types";

export interface ExpensesPageResponse {
  items: CreatedExpenseResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  months: string[];
  summary: { amount: number; count: number; currentMonthAmount: number };
}

export interface ExpenseListParams {
  page?: number;
  query?: string;
  paidBy?: string;
  category?: string;
  month?: string;
}

export async function getExpensesApi(params: ExpenseListParams = {}): Promise<ExpensesPageResponse> {
  const response = await api.get<ExpensesPageResponse>("/expenses", { params });
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

export async function updateExpenseApi(
  expenseId: string,
  payload: {
    description?: string;
    amountPaid?: number;
    category?: string;
    expenseDate?: string;
    bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  }
): Promise<{ message: string; expense: CreatedExpenseResponse }> {
  const response = await api.patch<{ message: string; expense: CreatedExpenseResponse }>(
    `/expenses/${expenseId}`,
    payload
  );
  return response.data;
}

export async function deleteExpenseApi(expenseId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/expenses/${expenseId}`);
  return response.data;
}
