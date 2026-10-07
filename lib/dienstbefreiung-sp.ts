import "server-only";

import * as httpntlm from "httpntlm";

import { getAuthenticatedIdentity } from "./authenticatedIdentity";
import type {
  AuthenticatedEmployee,
  DienstbefreiungFormData,
} from "../types/dienstbefreiung";

type SharePointResponse = {
  statusCode: number;
  body: string;
};

type UserDirectoryItem = {
  Id?: number;
  WFUserID?: {
    Id?: number;
    Name?: string;
    EMail?: string;
  };
  WFVorname?: string;
  WFName?: string;
  WFOrganisationseinheit?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const baseUrl = getRequiredEnv("SHAREPOINT_BASE_URL");
const userDirectoryListId = getRequiredEnv(
  "SHAREPOINT_USER_DIRECTORY_LIST_ID",
);
const dienstbefreiungListId = getRequiredEnv(
  "SHAREPOINT_DIENSTBEFREIUNG_LIST_ID",
);

const ntlmUser = process.env.SHAREPOINT_NTLM_USER;
const ntlmPass = process.env.SHAREPOINT_NTLM_PASS;
const ntlmDomain = process.env.SHAREPOINT_NTLM_DOMAIN ?? "";
const ntlmWorkstation = process.env.SHAREPOINT_NTLM_WORKSTATION ?? "";

const ignoreTlsErrors =
  process.env.SHAREPOINT_IGNORE_TLS_ERRORS === "true";

function requireNtlmCredentials(): void {
  if (!ntlmUser || !ntlmPass) {
    throw new Error(
      "Missing NTLM credentials. Set SHAREPOINT_NTLM_USER and SHAREPOINT_NTLM_PASS.",
    );
  }
}

function escapeODataValue(value: string): string {
  return encodeURIComponent(value.replace(/'/g, "''"));
}

async function get(requestUrl: string): Promise<string> {
  requireNtlmCredentials();

  const response = await new Promise<SharePointResponse>(
    (resolve, reject) => {
      httpntlm.get(
        {
          url: requestUrl,
          username: ntlmUser,
          password: ntlmPass,
          domain: ntlmDomain,
          workstation: ntlmWorkstation,
          rejectUnauthorized: !ignoreTlsErrors,
          headers: {
            Accept: "application/json;odata=nometadata",
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            statusCode: result.statusCode,
            body: result.body,
          });
        },
      );
    },
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `SharePoint GET failed with status ${response.statusCode}: ${response.body}`,
    );
  }

  return response.body;
}

async function getDigest(): Promise<string> {
  requireNtlmCredentials();

  const response = await new Promise<SharePointResponse>(
    (resolve, reject) => {
      httpntlm.post(
        {
          url: `${baseUrl}/_api/contextinfo`,
          username: ntlmUser,
          password: ntlmPass,
          domain: ntlmDomain,
          workstation: ntlmWorkstation,
          rejectUnauthorized: !ignoreTlsErrors,
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
          },
          body: "",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            statusCode: result.statusCode,
            body: result.body,
          });
        },
      );
    },
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `SharePoint contextinfo failed with status ${response.statusCode}.`,
    );
  }

  const parsed = JSON.parse(response.body) as {
    d?: {
      GetContextWebInformation?: {
        FormDigestValue?: string;
      };
    };
  };

  const digest =
    parsed.d?.GetContextWebInformation?.FormDigestValue;

  if (!digest) {
    throw new Error("SharePoint did not return a request digest.");
  }

  return digest;
}

async function post(
  requestUrl: string,
  body: string,
): Promise<string> {
  requireNtlmCredentials();

  const digest = await getDigest();

  const response = await new Promise<SharePointResponse>(
    (resolve, reject) => {
      httpntlm.post(
        {
          url: requestUrl,
          username: ntlmUser,
          password: ntlmPass,
          domain: ntlmDomain,
          workstation: ntlmWorkstation,
          rejectUnauthorized: !ignoreTlsErrors,
          headers: {
            Accept: "application/json;odata=nometadata",
            "Content-Type": "application/json;odata=nometadata",
            Prefer: "return=representation",
            "X-RequestDigest": digest,
          },
          body,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            statusCode: result.statusCode,
            body: result.body,
          });
        },
      );
    },
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `SharePoint POST failed with status ${response.statusCode}: ${response.body}`,
    );
  }

  return response.body;
}

async function resolveAuthenticatedEmployee(): Promise<AuthenticatedEmployee> {
  const { email } = await getAuthenticatedIdentity();

  const requestUrl =
    `${userDirectoryListId}/items` +
    `?$filter=WFUserID/EMail eq '${escapeODataValue(email)}'` +
    `&$expand=WFUserID` +
    `&$select=Id,WFUserID/Name,WFUserID/EMail,WFVorname,WFName,WFOrganisationseinheit` +
    `&$top=1`;

  const result = await get(requestUrl);

  const parsed = JSON.parse(result) as {
    value?: UserDirectoryItem[];
  };

  const item = parsed.value?.[0];

  const userId = item?.WFUserID?.Name?.trim();
  const firstName = item?.WFVorname?.trim() ?? "";
  const lastName = item?.WFName?.trim() ?? "";
  const department = item?.WFOrganisationseinheit?.trim() ?? "";

  if (!userId) {
    throw new Error(
      "No UserID found in the user directory for the authenticated user.",
    );
  }

  return {
    firstName,
    lastName,
    department,
    userId,
  };
}

function buildSharePointFields(
  employee: AuthenticatedEmployee,
  form: DienstbefreiungFormData,
): Record<string, string> {
  return {
    WFVorname: employee.firstName,
    WFName: employee.lastName,
    WFOrganisationseinheit: employee.department,
    WFUserID: employee.userId,

    DB_Dienstgrad: form.dienstgrad,
    DB_AnlassDisziplin: form.anlassDisziplin,
    DB_AndererAnlass: form.andererAnlass,
    DB_AnlassVon: form.anlassVon,
    DB_AnlassBis: form.anlassBis,
    DB_Dienstbefreiung1: form.dienstbefreiung1,
    DB_Dienstbefreiung2: form.dienstbefreiung2,
    DB_Dienstbefreiung3: form.dienstbefreiung3,
    DB_Dienst: form.dienst.join("; "),
    DB_AndererDienst: form.andererDienst,
    DB_AntragstellerBemerkungen: form.antragstellerBemerkungen,
    DB_DienstVorangehendeStufe1: form.dienstVorangehendeStufe1,
    DB_DienstVorangehendeStufe1Bemerkung:
      form.dienstVorangehendeStufe1Bemerkung,
    DB_DienstVorangehendeStufe2: form.dienstVorangehendeStufe2,
    DB_DienstVorangehendeStufe2Bemerkung:
      form.dienstVorangehendeStufe2Bemerkung,
    DB_BegruendungSportler: form.begruendungSportler,
    DB_StatusTest: form.statusTest,
    DB_Anhaenge: form.anhaenge,
  };
}

export async function getAuthenticatedEmployee(): Promise<AuthenticatedEmployee> {
  return resolveAuthenticatedEmployee();
}

export async function saveDienstbefreiung(
  form: DienstbefreiungFormData,
): Promise<void> {
  // Never trust the four employee fields from the browser.
  // Resolve the authenticated employee again on the server.
  const employee = await resolveAuthenticatedEmployee();

  await post(
    `${dienstbefreiungListId}/items`,
    JSON.stringify(buildSharePointFields(employee, form)),
  );
}
