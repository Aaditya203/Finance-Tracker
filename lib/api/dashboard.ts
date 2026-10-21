import { DashboardDataResponse, WorkspaceUser, DashboardBalanceItem, MonthlyExpenseAggregate, PartnerSettlementSuggestion } from "@/types";
import { api } from "./axios";

export interface SummaryResponse {
  totalSpent: number;
  balance: DashboardBalanceItem[];
  monthlyExpenses: MonthlyExpenseAggregate[];
  settlementPlan: PartnerSettlementSuggestion[];
}

export async function getDashboardDataApi(): Promise<DashboardDataResponse> {
  const response = await api.get<DashboardDataResponse>("/dashboard");
  return response.data;
}

export async function getSummaryApi(): Promise<SummaryResponse> {
  const response = await api.get<SummaryResponse>("/summary");
  return response.data;
}

export async function getUsersApi(): Promise<WorkspaceUser[]> {
  const response = await api.get<WorkspaceUser[]>("/users");
  return response.data;
}
