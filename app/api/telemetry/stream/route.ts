export async function GET(request: Request) {
  let timer: NodeJS.Timeout | null = null;
  let tick = 0;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = () => {
        tick += 1;
        const memoryUsage = process.memoryUsage();
        
        const payload = {
          tick,
          timestamp: Date.now(),
          uptime: process.uptime(),
          memory: {
            rss_mb: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
            heap_total_mb: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
            heap_used_mb: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
            external_mb: Number((memoryUsage.external / 1024 / 1024).toFixed(2)),
          },
          system: {
            node_version: process.version,
            arch: process.arch,
            platform: process.platform,
            pid: process.pid,
          },
          status: 'streaming',
        };

        const message = `event: telemetry\ndata: ${JSON.stringify(payload)}\n\n`;

        try {
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream was closed by consumer
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      };

      // Emit initial event immediately
      sendEvent();

      // Emit telemetry every 1 second
      timer = setInterval(sendEvent, 1000);
    },
    cancel() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
