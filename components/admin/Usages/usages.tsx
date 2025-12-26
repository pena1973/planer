

import React, { useEffect, useState, useMemo } from 'react';
import styles from "./usages.module.scss";
import { getUsage } from '@/services/billing/getUsage';
import { createUsage } from '@/services/admin/createUsage';


import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';


import { UsageItem } from '@/types/service-types';
import { TeamItem } from '@/types/types';
import { useTranslation } from 'react-i18next';
import DropdownSelectTeam from '@/components/DropdownSelectTeam/dropdownSelectTeam';


interface UsagesProps {
  setMessage: (message: string) => void,
  userId: number,
  token: string,
}

export const Usages: React.FC<UsagesProps> = ({
  setMessage,
  userId,
  token,
}) => {

  const { t, i18n } = useTranslation();
  const [usageValue, setUsageValue] = useState<UsageItem[]>([]);

  const [teamValue, setTeamValue] = useState<TeamItem | null>(null);

  const teams = useAppSelector((state: RootState) => {
    return state.adminSlice.teams;
  })

  // --- UI добавления ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState<UsageItem>({
    teamId: teamValue?.id ?? 0,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    amount: 0.00,
    coment: '',
    direction: '+',
    is_gift: true,
  });


  const handleSelectTeam = async (team: TeamItem | null) => {
    if (team?.id === teamValue?.id) return;
    setTeamValue(team);
    if (team) await getUsage(userId, team.id, token, t, i18n.language, setMessage, setUsageValue);
    else setUsageValue([]);
  };


  // TODO: сюда подключишь свой API (createUsage / adminAddUsage / etc.)
  const addUsageHandler = async () => {
    if (!teamValue) {
      setMessage('Сначала выбери команду');
      return;
    }

    const cleanAbs = Math.abs(Number(draft.amount) || 0);

    if (!draft.date) {
      setMessage('Укажи дату');
      return;
    }
    if (!draft.coment.trim()) {
      setMessage('Укажи комментарий');
      return;
    }
    if (cleanAbs <= 0) {
      setMessage('Сумма должна быть больше 0');
      return;
    }

    // --- тут будет реальный запрос ---
    await createUsage(userId, teamValue.id, draft.date, cleanAbs, draft.direction ?? "+", draft.coment, token, t, i18n.language, setMessage, setUsageValue);

    // закроем и сбросим форму
    setIsAddOpen(false);
    setDraft(d => ({
      ...d,
      teamId: teamValue.id,
      date: new Date().toISOString().slice(0, 10),
      amount: 0.00,
      coment: '',
      direction: '+',
      is_gift: true,
    }));
  };

  const normalizeAmount2 = (v: string | number) => {
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n)) throw new Error('Invalid amount');
    return n.toFixed(2);
  };

  let total = 0;
  const usageReactNodes = usageValue.map((usage, index) => {
    total += Number(usage.amount);
    return (
      <tr key={index}>
        <td>{usage.date}</td>
        <td>{usage.coment}</td>
        <td>{normalizeAmount2(usage.amount)}</td>
      </tr>
    );
  });

  const canAdd = !!teamValue;
  const sanitizeMoney = (raw: string) => {
    // разрешаем цифры + одну точку/запятую, максимум 2 знака после
    let v = raw.replace(',', '.').replace(/[^\d.]/g, '');

    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      // оставляем только первую точку
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
      // обрезаем дробную часть до 2 знаков
      const [i, f] = v.split('.');
      v = `${i}.${(f ?? '').slice(0, 2)}`;
    }

    return v;
  };
  return (

    <div className={styles.container}>

      <div className={styles.filters} style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        Команда <DropdownSelectTeam
          options={teams}
          onSelect={handleSelectTeam}
          selectedValue={teamValue ? teamValue.id : null}
        />
        <button
          type="button"
          className={styles.addBtn}
          disabled={!canAdd}
          onClick={() => {
            if (!teamValue) return;
            setIsAddOpen(v => !v);
            setDraft(d => ({ ...d, teamId: teamValue.id }));
          }}
          title={!canAdd ? 'Сначала выбери команду' : 'Добавить строку использования'}
        >
          Добавить единицы
        </button>
      </div>
      {/* <БлокДобавления */}
      {isAddOpen && (
        <div className={styles.addBlock}>
          <div className={styles.addRow}>
            <label className={styles.field}>
              <span>Дата</span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
              />

            </label>

            <label className={styles.field}>
              <span>Сумма</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={t('bills.amount')}
                value={draft.amount}

                onChange={(e) => setDraft(d => ({ ...d, amount: Number(e.target.value) }))}
              />

              <span>Направление</span>
              <select
                value={draft.direction ?? '+'}
                onChange={(e) => setDraft(d => ({ ...d, direction: e.target.value as '+' | '-' }))}
              >
                <option value="+">+</option>
                <option value="-">-</option>
              </select>
            </label>


          </div>

          <div className={styles.addRow}>
            <label className={styles.field} style={{ flex: 1 }}>
              <span>Комментарий</span>
              <textarea className={styles.coment}
                placeholder="Например: корректировка, подарок, возврат…"
                value={draft.coment}
                onChange={(e) => setDraft(d => ({ ...d, coment: e.target.value }))}
              />
            </label>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setIsAddOpen(false)}>
                Отмена
              </button>
              <button type="button" className={styles.primaryBtn} onClick={addUsageHandler}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      {/* таблица */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('bills.date')}</th>
            <th>{t('bills.coment')}</th>
            <th>{t('bills.qty')}</th>

          </tr>
        </thead>
        <tbody>{usageReactNodes}
          {/* Итого */}
          {usageReactNodes.length > 0 &&
            <tr key={"total"}>
              <td></td>
              <td>Итого</td>
              <td>{normalizeAmount2(total)}</td>
            </tr>}

        </tbody>
      </table>
    </div>
  );
};
