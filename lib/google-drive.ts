import { google } from "googleapis";
import { Readable } from "stream";

export const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
  clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
  redirectUri: process.env.GOOGLE_REDIRECT_URI?.trim(),
});

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim(),
});

const drive = google.drive({version:"v3",auth:oauth2Client});

type FolderType = "expenses" | "settlements" | "bank-transactions" | "teachers" | "parents" | "employees" | string;

type uploadFileParams = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folderType?: FolderType;
  folderName?: string;
};

const folderAliases: Record<string, string[]> = {
  Teachers: ["Teachers", "Teacher", "teachers", "teacher"],
  Parents: ["Parents", "Parent", "parents", "parent", "Students", "Student", "students", "student"],
  Employees: ["Employees", "Employee", "employees", "employee"],
  Expenses: ["Expenses", "Expense", "expenses", "expense"],
  Settlements: ["Settlements", "Settlement", "settlements", "settlement"],
  "Bank Transactions": ["Bank Transactions", "Bank Activity", "bank-transactions", "bank transactions"],
  "Director Loan Repayments": ["Director Loan Repayments", "Director Loans", "Loans", "director loan repayments"],
};

export function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim();
}

export async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
  const parentFolderId = parentId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID not set");
  }

  const aliases = folderAliases[folderName] || [folderName];
  const nameQueries = aliases.map((alias) => `name='${alias.replace(/'/g, "\\'")}'`).join(" or ");

  // 1. Check directly under parentFolderId
  const existingFolders = await drive.files.list({
    q: `(${nameQueries}) and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: "files(id,name)",
  });

  const existingFolder = existingFolders.data.files?.[0];
  if (existingFolder?.id) {
    return existingFolder.id;
  }

  // 2. If searching for a specialized category folder, also check if it exists inside "Bank Transactions"
  if (["Teachers", "Parents", "Employees", "Director Loan Repayments"].includes(folderName)) {
    try {
      const bankSearch = await drive.files.list({
        q: `(name='Bank Transactions' or name='Bank Activity') and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
        fields: "files(id,name)",
      });
      const bankFolderId = bankSearch.data.files?.[0]?.id;
      if (bankFolderId) {
        const subSearch = await drive.files.list({
          q: `(${nameQueries}) and mimeType='application/vnd.google-apps.folder' and '${bankFolderId}' in parents and trashed=false`,
          fields: "files(id,name)",
        });
        const existingSub = subSearch.data.files?.[0];
        if (existingSub?.id) {
          return existingSub.id;
        }
      }
    } catch {
      // Non-fatal, fallback to creating at parentFolderId
    }
  }

  // 3. Create folder under parentFolderId if not found
  const newFolder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  if (!newFolder.data.id) {
    throw new Error(`Failed to create Google Drive folder: ${folderName}`);
  }

  return newFolder.data.id;
}

export async function grantViewerAccess(fileId: string) {
  const allowedEmailsEnv = process.env.DRIVE_ALLOWED_EMAILS;
  if (!allowedEmailsEnv) {
    return;
  }

  const emails = allowedEmailsEnv
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (emails.length === 0) {
    return;
  }

  await Promise.all(
    emails.map((email) =>
      drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "user",
          emailAddress: email,
        },
        sendNotificationEmail: false,
      }).catch((err) => {
        console.warn(`Failed to grant Drive access to ${email}:`, err);
      })
    )
  );
}

export async function uploadToDrive({fileName, mimeType, buffer, folderType, folderName}: uploadFileParams){
  try{
    let targetFolder = folderName;
    if (!targetFolder) {
      if (folderType === "expenses") targetFolder = "Expenses";
      else if (folderType === "settlements") targetFolder = "Settlements";
      else if (folderType === "teachers") targetFolder = "Teachers";
      else if (folderType === "parents" || folderType === "students") targetFolder = "Parents";
      else if (folderType === "employees") targetFolder = "Employees";
      else targetFolder = "Bank Transactions";
    }

    const folderId = await getOrCreateFolder(targetFolder);
    const response = await drive.files.create({
      requestBody:{
        name: fileName,
        parents:[folderId],
      },
      media:{
        mimeType,
        body:Readable.from(buffer),
      },
      fields:"id,name,mimeType,webViewLink,webContentLink"
    });

    await grantViewerAccess(response.data.id!);
    return {
      fileId:response.data.id,
      fileName:response.data.name || fileName,
      mimeType:response.data.mimeType,
      webViewLink:response.data.webViewLink,
      webContentLink:response.data.webContentLink,
    }
  }
  catch(error){
    console.error("Upload failed",error);
    throw new Error("Upload Failed")
  }
}

export async function deleteFromDrive(fileId: string) {
  await drive.files.delete({ fileId });
}
