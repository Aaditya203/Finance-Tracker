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
  bankTransactionId?: string | null;
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
  extraFunds:number;
  totalShare:number;
  moneySpent:number;
  moneyReceived:number;
  companyDue:number;
  balance:number;
}

export interface MonthlyExpenseAggregate {
  month: string;
  amount: number;
  count?: number;
}

export interface TeacherLiabilitiesSummary {
  totalStudentFees: number;
  totalTeacherCommitted: number;
  totalTeacherPaid: number;
  pendingTeacherPayable: number;
  totalTaxCollected: number;
  totalExtraCharges: number;
  overallCourseProfit: number;
  safeSpendableCash: number;
  byMonth?: Record<string, TeacherLiabilitiesSummary>;
}

export interface DashboardSummary{
  totalSpent:number;
  totalInvestment:number;
  bankPaidExpenses:number;
  companyReceivables:number;
  extraFundsRemaining:number;
  otherBankCredits:number;
  otherBankDebits:number;
  userContribution:number;
  balance:DashboardBalanceItem[];
  settlementPlan: PartnerSettlementSuggestion[];
  monthlyExpenses:MonthlyExpenseAggregate[];
  teacherLiabilities?: TeacherLiabilitiesSummary;
  totalSpentByMonth?: Record<string, number>;
  totalInvestmentByMonth?: Record<string, number>;
}
export interface PartnerSettlementSuggestion {
  fromUserId: string;
  from: string;
  toUserId: string;
  to: string;
  amount: number;
}
export interface DashboardRecentExpense{
  id:string;
  description:string;
  amountPaid:number;
  transactionId:string;
  category:string | null;
  isExtraFund?: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  fundAppliedToCurrentUser?: number;
  expenseDate:Date;
  createdAt?: Date | string;
  paidBy:{id:string,name:string,email:string};
  splits: Array<{ userId: string; amountPaid: number; user: { id: string; name: string } }>;
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
  isExtraFund?: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  expenseDate?: string;
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
  isExtraFund?: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  fundAppliedToCurrentUser?: number;
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

export type BankTransactionType = "CREDIT" | "DEBIT";
export type BankTransactionReason = "STUDENT" | "TEACHER" | "EMPLOYEE" | "DIRECTOR_LOAN_REPAYMENT" | "OTHER";

export interface BankTransactionRecord {
  id: string;
  invoiceNumber: string;
  utrNumber: string;
  transactionDate: string;
  counterpartyName: string;
  type: BankTransactionType;
  reason: BankTransactionReason;
  studentId: string | null;
  teacherId: string | null;
  amount: number;
  teacherShare: number;
  taxAmount: number;
  extraCharges: number;
  profitAmount: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  attachments: Attachment[];
}

export interface CreateBankTransactionPayload {
  invoiceNumber: string;
  utrNumber: string;
  transactionDate: string;
  counterpartyName: string;
  type: BankTransactionType;
  reason: BankTransactionReason;
  studentId?: string;
  teacherId?: string;
  amount: number;
  teacherShare?: number;
  taxAmount?: number;
  extraCharges?: number;
  profitAmount?: number;
  note?: string;
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

export interface TeacherItem {
  id: string;
  teacherId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StudentItem {
  id: string;
  studentId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

