'use server';

import { createProject, deleteProjectById, toggleProjectStatus } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createProjectAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const category = (formData.get('category') as string)?.trim() || 'General';

  if (!name || name.length === 0) {
    return {
      error: 'Please enter a project name.',
      success: false,
    };
  }

  const id = `${name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now().toString(36)}`;

  try {
    createProject({
      id,
      name,
      data: {
        description: description || 'No description provided.',
        status: 'active',
        category,
      },
    });

    revalidatePath('/');
    revalidatePath('/projects');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return { error: message, success: false };
  }
}

export async function deleteProjectBoundAction(id: string): Promise<void> {
  if (!id) return;
  deleteProjectById(id);
  revalidatePath('/');
  revalidatePath('/projects');
}

export async function toggleProjectStatusBoundAction(id: string): Promise<void> {
  if (!id) return;
  toggleProjectStatus(id);
  revalidatePath('/');
  revalidatePath('/projects');
}
