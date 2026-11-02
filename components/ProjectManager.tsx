'use client';

import { useOptimistic, useActionState, startTransition, useState } from 'react';
import Link from 'next/link';
import { Project, ProjectData } from '@/lib/db';
import { 
  createProjectAction, 
  deleteProjectBoundAction, 
  toggleProjectStatusBoundAction,
  ActionState 
} from '@/app/projects/actions';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Loader2, 
  Folder,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProjectManagerProps {
  initialProjects: Project[];
}

export function ProjectManager({ initialProjects }: ProjectManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formState, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const res = await createProjectAction(prev, formData);
      if (res.success) {
        setShowAddForm(false);
      }
      return res;
    },
    {}
  );

  const [optimisticProjects, setOptimistic] = useOptimistic(
    initialProjects,
    (state, update: { type: 'delete'; id: string } | { type: 'toggle'; id: string }) => {
      if (update.type === 'delete') {
        return state.filter((p) => p.id !== update.id);
      }
      if (update.type === 'toggle') {
        return state.map((p) => {
          if (p.id !== update.id) return p;
          let data: ProjectData = { status: 'active' };
          try {
            data = JSON.parse(p.metrics);
          } catch {
            // ignore
          }
          const nextStatus = data.status === 'completed' ? 'active' : 'completed';
          return {
            ...p,
            metrics: JSON.stringify({ ...data, status: nextStatus }),
          };
        });
      }
      return state;
    }
  );

  const activeCount = optimisticProjects.filter((p) => {
    try {
      return JSON.parse(p.metrics).status === 'active';
    } catch {
      return true;
    }
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Controls & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} active • {optimisticProjects.length} total stored in SQLite WAL
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
        >
          <Plus className="mr-1.5 size-4" />
          {showAddForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {/* Add Project Form (Collapsible) */}
      {showAddForm && (
        <Card className="shadow-none border-dashed bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Create Project</CardTitle>
            <CardDescription className="text-xs">
              Directly commits a new record to the SQLite database.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {formState.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {formState.error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-foreground">
                    Project Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Next.js Documentation Site"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-xs font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    defaultValue="Frontend"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Fullstack">Fullstack</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-xs font-medium text-foreground">
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Short note about what this project does..."
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm">
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Projects List */}
      {optimisticProjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed shadow-none">
          <Folder className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first project above to see it stored in SQLite WAL.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {optimisticProjects.map((project) => {
            let data: ProjectData = { status: 'active', category: 'General' };
            try {
              data = JSON.parse(project.metrics);
            } catch {
              // ignore
            }

            const isCompleted = data.status === 'completed';
            const boundDelete = deleteProjectBoundAction.bind(null, project.id);
            const boundToggle = toggleProjectStatusBoundAction.bind(null, project.id);

            return (
              <Card
                key={project.id}
                className={`shadow-none transition-colors ${
                  isCompleted ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/30'
                }`}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  {/* Left: Checkbox toggle + Title & Description */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <form
                      action={async () => {
                        startTransition(() => {
                          setOptimistic({ type: 'toggle', id: project.id });
                        });
                        await boundToggle();
                      }}
                      className="mt-0.5"
                    >
                      <button
                        type="submit"
                        className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        title={isCompleted ? 'Mark as active' : 'Mark as completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                      </button>
                    </form>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/projects/${project.id}`}
                          className={`text-sm font-medium hover:underline ${
                            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {project.name}
                        </Link>
                        {data.category && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 font-normal">
                            {data.category}
                          </Badge>
                        )}
                      </div>

                      {data.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {data.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link href={`/projects/${project.id}`}>
                        <span className="hidden sm:inline">Details</span>
                        <ArrowRight className="sm:ml-1 size-3 text-muted-foreground" />
                      </Link>
                    </Button>

                    <form
                      action={async () => {
                        startTransition(() => {
                          setOptimistic({ type: 'delete', id: project.id });
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
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
