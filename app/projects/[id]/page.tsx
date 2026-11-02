import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById, ProjectData } from '@/lib/db';
import { deleteProjectBoundAction } from '@/app/projects/actions';
import { ArrowLeft, Clock, Trash2, Calendar, Tag } from 'lucide-react';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await connection();
  
  // Next.js 16 dynamic async params
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  let data: ProjectData = { status: 'active', category: 'General' };
  try {
    data = JSON.parse(project.metrics);
  } catch {
    // ignore
  }

  const boundDelete = async () => {
    'use server';
    await deleteProjectBoundAction(project.id);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Link href="/">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Detail Card */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {project.name}
                </CardTitle>
                <Badge
                  variant={data.status === 'completed' ? 'secondary' : 'default'}
                  className="capitalize text-xs font-normal"
                >
                  {data.status === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono mt-1">
                ID: {project.id}
              </CardDescription>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono" suppressHydrationWarning>
              <Clock className="size-3.5" />
              <span suppressHydrationWarning>{new Date(project.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </h3>
            <p className="text-sm text-foreground">
              {data.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border text-xs">
            <div>
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium text-foreground mt-0.5">{data.category || 'General'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Storage</div>
              <div className="font-medium text-foreground mt-0.5 font-mono">/data/app.db (WAL)</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium text-foreground mt-0.5 capitalize">{data.status}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border pt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Close</Link>
          </Button>

          <form action={boundDelete}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-1.5 size-3.5" />
              Delete Project
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
