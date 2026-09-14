import { api } from "./axios";
import {
  CreateSettlementPayload,
  SettlementRecord,
  UploadAttachmentResponse,
  Attachment,
} from "@/types";

export interface PendingSettlementsResponse {
  count: number;
  settlements: SettlementRecord[];
}

export async function getSettlementsApi(): Promise<SettlementRecord[]> {
  const response = await api.get<SettlementRecord[]>("/settlements");
  return response.data;
}

export async function getPendingSettlementsApi(
  userId: string
): Promise<PendingSettlementsResponse> {
  const response = await api.get<PendingSettlementsResponse>(
    `/settlements/pending/${userId}`
  );
  return response.data;
}

export async function createSettlementApi(
  payload: CreateSettlementPayload
): Promise<SettlementRecord> {
  const response = await api.post<SettlementRecord>("/settlements", payload);
  return response.data;
}

export async function confirmSettlementApi(
  settlementId: string
): Promise<SettlementRecord> {
  const response = await api.patch<SettlementRecord>(
    `/settlements/${settlementId}/confirm`
  );
  return response.data;
}

export async function rejectSettlementApi(
  settlementId: string
): Promise<SettlementRecord> {
  const response = await api.patch<SettlementRecord>(
    `/settlements/${settlementId}/reject`
  );
  return response.data;
}

export async function uploadSettlementAttachmentApi(
  settlementId: string,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<UploadAttachmentResponse>(
    `/settlements/${settlementId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.attachment;
}
