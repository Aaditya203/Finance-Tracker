import { google } from "googleapis";
import { Readable } from "stream";

export const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

oauth2Client.setCredentials({
  refresh_token:process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({version:"v3",auth:oauth2Client});

type FolderType = "expenses" | "settlements";

type uploadFileParams = {
  fileName:string;
  mimeType:string;
  buffer:Buffer;
  folderType:FolderType;
}

export async function getOrCreateFolder(folderName:string){
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if(!parentFolderId){
    throw new Error("GOOGLE_DRIVE_FOLDER_ID not set");
  }
  const existingFolders = await drive.files.list({
    q: `
            name='${folderName}'
            and mimeType='application/vnd.google-apps.folder'
            and '${parentFolderId}' in parents
            and trashed=false
        `,
        fields: "files(id,name)",
  })

  const existingFolder = existingFolders.data.files?.[0];

  if(existingFolder){
    return existingFolder.id;
  }

  const newFolder = await drive.files.create({
    requestBody:{
      name:folderName,
      mimeType:"application/vnd.google-apps.folder",
      parents:[parentFolderId],
    },
    fields:"id",
  });

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

export async function uploadToDrive({fileName,mimeType,buffer,folderType}:uploadFileParams){
  try{
    const folderName = folderType === "expenses" ? "Expenses" : "Settlements";
    const folderId = await getOrCreateFolder(folderName);
    const response = await drive.files.create({
      requestBody:{
        name:`${Date.now()}-${fileName}`,
        parents:[folderId!],
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
      fileName:response.data.name,
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