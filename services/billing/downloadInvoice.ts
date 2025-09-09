import type { BillItem } from '@/types/service-types';

export async function downloadFile(
  bill: BillItem,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,) {

  if (!bill?.id || !bill?.teamId) {
    setMessage('Не хватает bill.id или teamId');
  }
  
  const res = await fetch('/api/billing/render-inv-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Basic ${token}` } : {}),
    },
    body: JSON.stringify({
      billId: bill.id,
      teamId: bill.teamId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${bill.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

