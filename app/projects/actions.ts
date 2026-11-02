'use server';

import { createProject, deleteProjectById } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function createProjectAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get('name') as string;
  const customId = formData.get('id') as string;
  const rps = Number(formData.get('rps')) || 10000;
  const latency = Number(formData.get('latency')) || 1.5;
  const memory = Number(formData.get('memory')) || 45;
  const notes = (formData.get('notes') as string) || 'Standard NextDeploy VPS microservice';

  if (!name || name.trim().length === 0) {
    return {
      error: 'Project name is required.',
      success: false,
    };
  }

  // Generate a clean slug id if not explicitly provided
  const id =
    customId && customId.trim().length > 0
      ? customId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `${name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now().toString(36)}`;

  try {
    createProject({
      id,
      name: name.trim(),
      metrics: {
        rps,
        latency_p99: latency,
        memory_mb: memory,
        waf_blocked_attacks: 0,
        status: 'healthy',
        notes,
      },
    });

    revalidatePath('/projects');
    revalidatePath('/');
    return {
      success: true,
      message: `Project "${name.trim()}" created successfully with ID "${id}".`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database write error';
    return {
      error: `Failed to create project: ${message}`,
      success: false,
    };
  }
}

// Bound Server Action for deleting projects without client-side JS overhead
export async function deleteProjectBoundAction(id: string): Promise<void> {
  if (!id) return;
  deleteProjectById(id);
  revalidatePath('/projects');
  revalidatePath('/');
}
