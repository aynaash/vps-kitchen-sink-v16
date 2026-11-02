import { getMonitors } from '@/lib/monitors';
import { MonitorManager } from '@/components/MonitorManager';
import { connection } from 'next/server';

export const instant = false;

export default async function HomePage() {
  await connection();
  const monitors = await getMonitors();

  return <MonitorManager initialMonitors={monitors} />;
}
