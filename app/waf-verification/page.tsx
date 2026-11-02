'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  Play, 
  Loader2, 
  Code 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';

interface TestCase {
  id: string;
  name: string;
  category: 'XSS' | 'SQLi' | 'LFI' | 'Benign';
  payload: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'xss-script',
    name: 'XSS Script Tag',
    category: 'XSS',
    payload: "<script>alert('test')</script>",
  },
  {
    id: 'xss-onerror',
    name: 'XSS Inline Handler',
    category: 'XSS',
    payload: '<img src=x onerror=alert(1)>',
  },
  {
    id: 'sqli-tautology',
    name: 'SQLi Boolean Tautology',
    category: 'SQLi',
    payload: "' OR 1=1 --",
  },
  {
    id: 'sqli-union',
    name: 'SQLi UNION Query',
    category: 'SQLi',
    payload: "' UNION SELECT id, name FROM projects--",
  },
  {
    id: 'lfi-passwd',
    name: 'Path Traversal /etc/passwd',
    category: 'LFI',
    payload: '../../../../etc/passwd',
  },
  {
    id: 'benign-query',
    name: 'Standard Benign Query',
    category: 'Benign',
    payload: 'NextDeploy standard request',
  },
];

interface TestResult {
  statusCode: number;
  blockedByWaf: boolean;
  latencyMs: number;
  message: string;
}

export default function WafVerificationPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [customPayload, setCustomPayload] = useState("<script>alert('custom')</script>");
  const [customLoading, setCustomLoading] = useState(false);

  const runTest = async (test: TestCase): Promise<TestResult> => {
    const start = performance.now();
    try {
      const url = `/api/waf-test?type=${encodeURIComponent(test.category)}&q=${encodeURIComponent(test.payload)}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      const latencyMs = Number((performance.now() - start).toFixed(1));
      const blockedByWaf = res.status === 403;

      const result: TestResult = {
        statusCode: res.status,
        blockedByWaf,
        latencyMs,
        message: blockedByWaf
          ? 'Blocked by Coraza WAF (HTTP 403)'
          : res.status === 200
          ? test.category === 'Benign'
            ? 'Allowed (Benign request)'
            : 'Allowed by host (WAF disabled on local dev)'
          : `HTTP ${res.status}`,
      };

      setResults((prev) => ({ ...prev, [test.id]: result }));
      return result;
    } catch {
      const latencyMs = Number((performance.now() - start).toFixed(1));
      const result: TestResult = {
        statusCode: 0,
        blockedByWaf: false,
        latencyMs,
        message: 'Network error',
      };
      setResults((prev) => ({ ...prev, [test.id]: result }));
      return result;
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of TEST_CASES) {
      await runTest(test);
    }
    setIsRunningAll(false);
  };

  const runCustomTest = async () => {
    setCustomLoading(true);
    await runTest({
      id: 'custom',
      name: 'Custom Query',
      category: 'XSS',
      payload: customPayload,
    });
    setCustomLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Coraza WAF Verification
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              OWASP CRS v4
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Test how Coraza Web Application Firewall inspects and drops malicious query payloads at the Caddy ingress layer.
          </p>
        </div>

        <Button
          onClick={runAllTests}
          disabled={isRunningAll}
          size="sm"
        >
          {isRunningAll ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="mr-1.5 size-3.5" />
              Run All Checks
            </>
          )}
        </Button>
      </div>

      {/* Tests Table */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Predefined Payloads</CardTitle>
          <CardDescription className="text-xs">
            Standard OWASP attack patterns tested against <code className="font-mono text-foreground">/api/waf-test</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Attack Vector</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[35%]">Payload</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEST_CASES.map((test) => {
                const res = results[test.id];

                return (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium text-foreground">
                      {test.name}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        {test.category}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate block max-w-[280px]">
                        {test.payload}
                      </code>
                    </TableCell>

                    <TableCell>
                      {res ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={res.blockedByWaf ? 'destructive' : res.statusCode === 200 ? 'secondary' : 'outline'}
                            className="text-[11px] font-mono"
                          >
                            {res.blockedByWaf ? '403 BLOCKED' : `HTTP ${res.statusCode}`}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {res.latencyMs}ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runTest(test)}
                        className="h-8 text-xs px-2"
                      >
                        Run Check
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custom Test */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Custom Query Probe</CardTitle>
          <CardDescription className="text-xs">
            Test any custom payload against the WAF endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="Enter test payload..."
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              onClick={runCustomTest}
              disabled={customLoading}
            >
              {customLoading ? <Loader2 className="size-3.5 animate-spin" /> : 'Test'}
            </Button>
          </div>

          {results['custom'] && (
            <div className="p-3 rounded-md bg-muted/40 border border-border text-xs font-mono flex items-center justify-between text-muted-foreground">
              <span>Result: {results['custom'].message}</span>
              <span>{results['custom'].latencyMs} ms</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
