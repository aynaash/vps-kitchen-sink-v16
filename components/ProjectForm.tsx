'use client';

import { useActionState, useState } from 'react';
import { createProjectAction, ActionState } from '@/app/projects/actions';
import { Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: ActionState = {};

export function ProjectForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">New Project</CardTitle>
          <CardDescription className="text-xs">
            Add a new service or fullstack web app to SQLite.
          </CardDescription>
        </div>
        <Button
          variant={isOpen ? 'ghost' : 'outline'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Close' : 'Add Project'}
        </Button>
      </CardHeader>

      {isOpen && (
        <form action={formAction}>
          <CardContent className="space-y-4 pt-2">
            {state.error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {state.success && state.message && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{state.message}</span>
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
                  type="text"
                  required
                  placeholder="e.g. Marketing Website"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="id" className="text-xs font-medium text-foreground">
                  Slug ID (Optional)
                </label>
                <Input
                  id="id"
                  name="id"
                  type="text"
                  placeholder="e.g. marketing-site"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="domain" className="text-xs font-medium text-foreground">
                  Domain / URL
                </label>
                <Input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="e.g. marketing.yourdomain.com"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="environment" className="text-xs font-medium text-foreground">
                  Environment
                </label>
                <select
                  id="environment"
                  name="environment"
                  defaultValue="production"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
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
                type="text"
                placeholder="Brief summary of this application service..."
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
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
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Save Project
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
