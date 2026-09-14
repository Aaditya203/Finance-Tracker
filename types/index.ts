import { SettlementStatus } from "@/app/generated/prisma/enums";

export interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface FeatureItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
}

export interface TrustLogo {
  name: string;
  logoUrl?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  driveFileId?: string;
  fileUrl: string;
  expenseId?: string | null;
  settlementId?: string | null;
  createdAt: string;
}
export type AuthPayload = {
    userId:string;
    email:string;
    name:string
}

export interface DashboardBalanceItem{
  userId:string;
  name:string;
  totalPaid:number;
  totalShare:number;
  moneySpent:number;
  moneyReceived:number;
  balance:number;
}

export interface MonthlyExpenseAggregate{
  month:string;
  amount:number;
}

export interface DashboardSummary{
  totalSpent:number;
  userContribution:number;
  balance:DashboardBalanceItem[];
  monthlyExpenses:MonthlyExpenseAggregate[];
}
export interface DashboardRecentExpense{
  id:string;
  description:string;
  amountPaid:number;
  transactionId:string;
  category:string | null;
  expenseDate:Date;
  paidBy:{id:string,name:string,email:string};
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    driveFileId?: string;
    fileUrl: string;
    createdAt: Date;
  }[];
}
export interface DashboardRecentSettlement{
  id:string;
  amountPaid:number;
  status:SettlementStatus,
  settledAt: Date | null;
  createdAt:Date;
  fromUser:{id:string,name:string,email:string};
  toUser:{id:string,name:string,email:string};
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    driveFileId?: string;
    fileUrl: string;
    createdAt: Date;
  }[];
}

export interface DashboardDataResponse{
  summary:DashboardSummary;
  expenses:DashboardRecentExpense[];
  settlements:DashboardRecentSettlement[];
  pendingSettlements:DashboardRecentSettlement[];
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  telegramUserID?: string | null;
}

export interface CreateExpensePayload {
  amountPaid: number;
  transactionId: string;
  description: string;
  category?: string | null;
  paidById: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amountPaid: number;
  isSettled: boolean;
  user: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreatedExpenseResponse {
  id: string;
  amountPaid: number;
  transactionId: string;
  description: string;
  category: string | null;
  paidById: string;
  expenseDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  paidBy: {
    id: string;
    name: string;
    email?: string;
  };
  splits: ExpenseSplit[];
  attachments?: Attachment[];
}

export interface UploadAttachmentResponse {
  message: string;
  attachment: Attachment;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  user?: WorkspaceUser;
  error?: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  resetToken?: string;
  error?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword?: string;
  password?: string;
}

export interface CreateSettlementPayload {
  toUserId: string;
  amountPaid: number;
}

export interface SettlementRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountPaid: number;
  status: SettlementStatus;
  settledAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  fromUser?: WorkspaceUser;
  toUser?: WorkspaceUser;
  attachments?: Attachment[];
}