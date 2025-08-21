import type { BillItem } from '@/types/service-types';

export async function downloadFile(bill: BillItem, token?: string) {
  if (!bill?.id || !bill?.teamId) {
    throw new Error('Не хватает bill.id или teamId');
  }

  // Передаём на сервер минимум — billId, teamId и (опционально) buyer,
  // т.к. в твоей схеме BillTable нет явной связи с ClientTable
  const payload = {
    billId: bill.id,
    teamId: bill.teamId,
    buyer: bill.client ?? undefined, // если есть клиент в строке — отправим как override
  };

  const res = await fetch('/api/invoices/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Basic ${token}` } : {}),
    },
    body: JSON.stringify(payload),
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

