// pages/billing/success.tsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
export default function Success() {
  const { t, i18n } = useTranslation();
  const { query } = useRouter();
  const { push } = useRouter();
  return (
    <div>
      <h1>Оплата принята 🎉</h1>
      <p>Session: {query.session_id as string}</p>
      <p>Баланс будет обновлён в течение пары секунд после вебхука.</p>
      <button style={{'backgroundColor':'#d9d7c2','color':'#5f5f5f'}} onClick={() => push('/support')}>Возврат</button>
       <Link href="/support" className="btn">Возврат</Link>
    </div>
  );
}
