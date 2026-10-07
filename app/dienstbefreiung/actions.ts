"use server";

import {
  getAuthenticatedEmployee,
  saveDienstbefreiung,
} from "../../lib/dienstbefreiung-sp";
import type { DienstbefreiungFormData } from "../../types/dienstbefreiung";

export async function loadDienstbefreiungEmployee() {
  return getAuthenticatedEmployee();
}

export async function submitDienstbefreiung(
  form: DienstbefreiungFormData,
) {
  await saveDienstbefreiung(form);

  return { success: true };
}
