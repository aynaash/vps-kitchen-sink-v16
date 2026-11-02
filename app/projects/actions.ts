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
  const name = (formData.get('name') as string)?.trim();
  const customId = (formData.get('id') as string)?.trim();
  const domain = (formData.get('domain') as string)?.trim();
  const environment = (formData.get('environment') as 'production' | 'staging' | 'development') || 'production';
  const description = (formData.get('description') as string)?.trim() || '';

  if (!name || name.length === 0) {
    return {
      error: 'Project name is required.',
      success: false,
    };
  }

  const id =
    customId && customId.length > 0
      ? customId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `${name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now().toString(36)}`;

  try {
    createProject({
      id,
      name,
      metrics: {
        domain: domain || `${id}.example.com`,
        environment,
        status: 'active',
        version: 'v1.0.0',
        memory_mb: Number((Math.random() * 30 + 30).toFixed(1)),
        description,
      },
    });

    revalidatePath('/projects');
    revalidatePath('/');
    return {
      success: true,
      message: `Project "${name}" was created successfully.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
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
