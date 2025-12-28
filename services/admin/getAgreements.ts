// services/admin/getAgreements.ts
import { AgreementItem } from '@/types/service-types';

export async function getAgreements(
  userId: number,
  token: string,
  t: any,
  locale: string,
  setMessage: (m: string) => void,
  setAgreements: (items: AgreementItem[]) => void
) {
    
  try {
    const res = await fetch(`/api/admin/agreements-api?userId=${userId}&locale=${encodeURIComponent(locale)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data?.message ?? t('sermes.server_error', 'SERVER ERROR'));
      return;
    }

    setAgreements(Array.isArray(data?.items) ? data.items : []);
  } catch (e: any) {
    setMessage(e?.message ?? t('sermes.server_error', 'SERVER ERROR'));
  }
}
