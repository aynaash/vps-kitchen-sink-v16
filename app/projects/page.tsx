import { getAllProjects } from '@/lib/db';
import { ProjectManager } from '@/components/ProjectManager';
import { connection } from 'next/server';

export const instant = false;

export default async function ProjectsPage() {
  await connection();
  const projects = getAllProjects();

  return <ProjectManager initialProjects={projects} />;
}
