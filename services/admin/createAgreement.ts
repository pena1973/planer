// services/admin/createAgreement.ts
import { AgreementItem } from '@/types/service-types';

export async function createAgreement(
  userId: number,
  token: string,
  payload: { date: string; locale: string; text: string },
  t: any,
  uiLang: string,
  setMessage: (m: string) => void,
  setAgreements: (items: AgreementItem[]) => void
) {
  try {
    const res = await fetch(`/api/admin/agreements-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        userId,
        uiLang,
        ...payload,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data?.message ?? t('sermes.server_error', 'SERVER ERROR'));
      return;
    }

    // ожидаю, что сервер вернет обновленный список (как у тебя часто бывает)
    if (Array.isArray(data?.items)) {
      setAgreements(data.items);
    } else {
      setMessage(t('sermes.saved', 'SAVED'));
    }
  } catch (e: any) {
    setMessage(e?.message ?? t('sermes.server_error', 'SERVER ERROR'));
  }
}
