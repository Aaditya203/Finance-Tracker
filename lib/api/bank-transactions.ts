import { api } from "./axios";
import type { BankTransactionRecord, CreateBankTransactionPayload, UploadAttachmentResponse } from "@/types";

export interface BankTransactionsPageResponse {
  items: BankTransactionRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: { credits: number; debits: number; count: number };
}

export interface BankTransactionListParams {
  page?: number;
  scope?: "all" | "parents" | "teachers";
  query?: string;
  type?: string;
  date?: string;
}

export async function getBankTransactionsApi(params: BankTransactionListParams = {}): Promise<BankTransactionsPageResponse> {
  const response = await api.get<BankTransactionsPageResponse>("/bank-transactions", { params });
  return response.data;
}

export async function createBankTransactionApi(payload: CreateBankTransactionPayload): Promise<BankTransactionRecord> {
  const response = await api.post<BankTransactionRecord>("/bank-transactions", payload);
  return response.data;
}

export async function uploadBankTransactionAttachment(transactionId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<UploadAttachmentResponse>(
    `/bank-transactions/${transactionId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.attachment;
}
