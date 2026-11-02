'use client';

import { useOptimistic, startTransition } from 'react';
import Link from 'next/link';
import { Project, ParsedProjectMetrics } from '@/lib/db';
import { deleteProjectBoundAction } from '@/app/projects/actions';
import { 
  Trash2, 
  ExternalLink, 
  Globe,
  ArrowRight,
  FolderGit2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectListProps {
  initialProjects: Project[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [optimisticProjects, removeOptimistic] = useOptimistic(
    initialProjects,
    (currentProjects, idToRemove: string) =>
      currentProjects.filter((p) => p.id !== idToRemove)
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Projects ({optimisticProjects.length})</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live records fetched from SQLite WAL. Deletions execute via bound server actions.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {optimisticProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No projects found. Click &quot;Add Project&quot; above to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Project</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticProjects.map((project) => {
                let metrics: ParsedProjectMetrics = {};
                try {
                  metrics = JSON.parse(project.metrics);
                } catch {
                  metrics = {};
                }

                const boundDelete = deleteProjectBoundAction.bind(null, project.id);
                const env = metrics.environment || 'production';

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {project.name}
                        </Link>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {project.id}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={env === 'production' ? 'default' : 'secondary'}
                        className="text-[11px] capitalize font-normal"
                      >
                        {env}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Globe className="size-3 text-muted-foreground/70" />
                        <span>{metrics.domain || `${project.id}.example.com`}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                      {new Date(project.updated_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <Link href={`/projects/${project.id}`}>
                            View
                            <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>

                        <form
                          action={async () => {
                            startTransition(() => {
                              removeOptimistic(project.id);
                            });
                            await boundDelete();
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            title="Delete project"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
