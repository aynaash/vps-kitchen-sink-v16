'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Lock, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('dev@pingpulse.io');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Login failed');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-4">
      <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
        <Link href="/">
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="shadow-none">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Better Auth Login</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              PostgreSQL
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Authenticate via Better Auth with email and password sessions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Authenticated with Better Auth! Redirecting...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="developer@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="p-3 rounded-md bg-muted/40 border border-border text-xs space-y-1">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-emerald-500" />
                <span>Seeded Demo Credentials:</span>
              </div>
              <div className="font-mono text-muted-foreground">
                Email: <span className="text-foreground">dev@pingpulse.io</span>
              </div>
              <div className="font-mono text-muted-foreground">
                Password: <span className="text-foreground">password123</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={isLoading} className="w-full" size="sm">
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Verifying with Better Auth...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
