'use server';

import { createMonitor, deleteMonitor, pingMonitor } from '@/lib/monitors';
import { pool } from '@/lib/postgres';
import { revalidatePath } from 'next/cache';

export interface ActionState {
  error?: string;
  success?: boolean;
}

async function getDefaultUserId(): Promise<string> {
  const res = await pool.query('SELECT id FROM "users" LIMIT 1');
  return res.rows[0]?.id || 'demo-user';
}

export async function createMonitorAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim();
  const url = (formData.get('url') as string)?.trim();
  const method = (formData.get('method') as string)?.trim() || 'GET';
  const intervalSeconds = Number(formData.get('interval')) || 60;

  if (!name || !url) {
    return { error: 'Please enter both monitor name and target URL.', success: false };
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return { error: 'Please enter a valid URL (including http:// or https://).', success: false };
  }

  try {
    const userId = await getDefaultUserId();
    await createMonitor({
      userId,
      name,
      url,
      method,
      intervalSeconds,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return { error: msg, success: false };
  }
}

export async function deleteMonitorBoundAction(id: string): Promise<void> {
  if (!id) return;
  await deleteMonitor(id);
  revalidatePath('/');
}

export async function pingMonitorBoundAction(id: string): Promise<void> {
  if (!id) return;
  await pingMonitor(id);
  revalidatePath('/');
}
