import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'generic';

  // If this code executes, the request passed through ingress and reached the application layer.
  // On a live NextDeploy VPS with Coraza WAF mode: enforce, malicious payloads are dropped
  // at the Caddy reverse proxy layer with HTTP 403 Forbidden before reaching Node.js.
  return NextResponse.json(
    {
      reached_application: true,
      status: 'allowed_by_host',
      message:
        'Request reached the Next.js runtime. On NextDeploy VPS with Coraza WAF in enforce mode, OWASP CRS drops this at Caddy ingress with HTTP 403.',
      payload: q,
      attack_type: type,
      headers: {
        host: request.headers.get('host'),
        'user-agent': request.headers.get('user-agent'),
      },
      timestamp: Date.now(),
    },
    {
      status: 200,
    }
  );
}
