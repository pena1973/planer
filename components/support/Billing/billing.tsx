
import React, { useEffect, useState } from 'react';
import styles from "./billing.module.scss";
import { getBills } from '@/services/billing/getBills';
import { downloadFile } from '@/services/billing/downloadInvoice';
import { BillItem, ClientItem } from "@/types/service-types";
import { TeamItem, UserItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import download from "@/public/download2-rem.png";
import del from "@/public/del2-rem.png";

import { generateTeamNumber } from '@/lib/utils'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { saveClient } from '@/services/billing/saveClient';
import { getClient } from '@/services/billing/getClient';
import { getAttachedTeams } from '@/services/billing/getAttachedTeams';
import { getTeamActivity } from '@/services/billing/getTeamActivity';
import { getBalance } from '@/services/billing/getBalance';
import { getForecast } from '@/services/billing/getForecast';
import { deactiveAttachedTeam } from '@/services/billing/deactiveAttachedTeam';
import { payByStripe } from '@/services/billing/payByStripe';


interface BillingProps {
  setMessage: (message: string) => void,
  team: TeamItem,
  user: UserItem,
  token: string,
  isMainTeam: boolean
}

export const Billing: React.FC<BillingProps> = ({
  setMessage,
  team,
  user,
  token,
  isMainTeam
}) => {
  const { t } = useTranslation();

  const [billsValue, setBillsValue] = useState<BillItem[]>([]);
  const [clientForm, setClientForm] = useState({} as ClientItem);
  const [attachedTeams, setAttachedTeams] = useState<TeamItem[]>([]);
  const [teamActivity, setTeamActivity] = useState<{teamId:number,active:boolean}[]>([]);

  const [balance, setBalance] = useState<number>(0);
  const [forecast, setForecast] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [loaderButtonSave, setLoaderButtonSave] = useState(false);

  // сохранить реквизиты
  const onDeactiveAttachedTeam = async (attachedTeamId: number) => {

    await deactiveAttachedTeam(
      user.id,
      attachedTeamId,
      attachedTeams,
      token,
      t,
      setMessage,
      setAttachedTeams
    )
  };

  // сохранить реквизиты
  const onSaveClient = async () => {

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)) {
      setMessage("Некорректный email"); // тут своя нотификация
      return
    }

    setLoaderButtonSave(true);
    const tt = await saveClient(
      user.id,
      team.id,
      clientForm,
      token,
      t,
      setMessage,
      setClientForm)

    setLoaderButtonSave(false);
  };

  const getClientHandler = async () => {
    await getClient(user.id, team.id, token, t, setMessage, setClientForm);
  };
  const getBillsHandler = async () => {
    await getBills(user.id, team.id, token, t, setMessage, setBillsValue);
  };
  const getAttachedTeamsHandler = async () => {
    const mainTeam = generateTeamNumber(team.prefix, team.id);
    await getAttachedTeams(user.id, mainTeam, token, t, setMessage, setAttachedTeams);
  };
  // возвращает информацию в каком состоянии команда активна или заморожена
  const getTeamActivityHandler = async () => {  
    await getTeamActivity(user.id, team.id, token, t, setMessage, setTeamActivity);
  }
  const getBalanceHandler = async () => {
    await getBalance(user.id, team.id, token, t, setMessage, setBalance);
  };
  const getForecastHandler = async () => {
    await getForecast(user.id, team.id, token, t, setMessage, setForecast);
  };
  useEffect(() => {
    getClientHandler();
    getBillsHandler();
    getAttachedTeamsHandler();
    getTeamActivityHandler();
    getBalanceHandler();
    getForecastHandler();

  }, [])

  const billsReactNodes = billsValue.map((bill, index) => {
    return (
      <tr key={index}>
        <td>{bill.date}</td>
        <td>{bill.title}</td>
        <td>         
          <Image
            className={styles.icon_bill}
            src={download}
            alt="Скачать инвойс"
            width={20}
            height={20}
            role="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadFile(bill, token, t, setMessage).catch((err) => {
                console.error(err);
                setMessage('Не удалось скачать инвойс');
              });
            }}
          />
        </td>
      </tr>
    );
  });
  const attachedTeamsReactNodes = attachedTeams.map((team, index) => {
    return (
      <tr key={index}>
        <td>{generateTeamNumber(team.prefix, team.id)}</td>
        <td>{team.title}</td>
        <td>           
          <Image
            className={styles.icon_bill}
            src={del}
            alt="deactive"
            width={20}
            height={20}
            role="button"
            onClick={(e) => onDeactiveAttachedTeam(team.id)}
          />
        </td>
      </tr>
    );
  });
  const onPay = async () => {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setMessage("Введите корректную сумму оплаты.");
      return;
    }
    try {
      const resp = await payByStripe(team.id, val, token);
      if (resp.ok) {
        setMessage("Переходим к оплате…");
        // тут дальше редирект в Stripe (когда реализуешь)
      } else {
        setMessage("Оплата не выполнена.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при инициализации оплаты.");
    }
  };

  return (<>
    {team && isMainTeam && <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.section_title}>{t('bills.client_requisites') || 'Invoice details'}</div>
        {/* // Форма реквизитов клиента */}

        <form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); onSaveClient(); }}
        >
          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.title') || 'Client'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.title ?? ""}
              onChange={e => setClientForm({ ...clientForm, title: e.target.value })}
            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.vat') || 'VAT'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.reg_n ?? ""}
              onChange={e => setClientForm({ ...clientForm, reg_n: e.target.value })}

            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.address') || 'Address'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.adress ?? ""}
              onChange={e => setClientForm({ ...clientForm, adress: e.target.value })}

            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.email') || 'Email'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.email ?? ""}
              onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
              onBlur={e => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  alert("Некорректный email"); // тут своя нотификация
                }
              }}
            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.phone') || 'Phone'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.phone ?? ""}
              onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}

            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.person') || 'Contact person'}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.person ?? ""}
              onChange={e => setClientForm({ ...clientForm, person: e.target.value })}

            />
          </div>

          <div className={styles.form_actions}>
            <button type="submit">
              {loaderButtonSave && <ButtonLoader />}
              {!loaderButtonSave && t('client.save')}
            </button>
          </div>
        </form>


      </div>
    </div>}
    {team && isMainTeam && <div className={styles.container}>
      {/* === Оплата === */}
      <div className={styles.section_title}>{t('bills.payment') || 'Payment'}</div>
      <div className={styles.pay_row}>
        <div className={styles.balance}>
          {t('bills.balance') || 'Balance'}: <b>{balance}</b> EUR
        </div>
        <div className={styles.balance}>
          {t('bills.forecast') || 'Forecast'}: <b>{forecast}</b> EUR
        </div>
        <div className={styles.pay_controls}>
          <input

            type="number"
            min="0"
            step="0.01"
            placeholder={t('bills.amount') || 'Amount'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          /> EUR
          <button className={styles.btn} onClick={onPay}>
            {t('bills.pay') || 'Pay'}
          </button>
        </div>
      </div>

    </div>}
    {/* === Перечень прикрепленных команд (только для основной) === */}
    {attachedTeams.length > 0 && team && isMainTeam && <div className={styles.container}>
      <div className={styles.section_title}>{t('bills.attached_teams') || 'Attached teams'}</div>
      <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('bills.teamNumber')}</th>
            <th>{t('bills.teamTitle')}</th>
            <th>{t('bills.teamDeactive')}</th>
          </tr>
        </thead>
        <tbody>{attachedTeamsReactNodes}</tbody>
      </table>

    </div>}

    {team && isMainTeam && <div className={styles.container}>
      {/* === Таблица счетов === */}
      <div className={styles.section_title}>{t('bills.invoises') || 'Invoices'}</div>
      <div className={styles.section_title}>{t('bills.invoises_notice') || 'Invoices'}</div>
      <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('bills.date')}</th>
            <th>{t('bills.title')}</th>
            <th>{t('bills.download')}</th>

          </tr>
        </thead>
        <tbody>{billsReactNodes}</tbody>
      </table>
    </div>}
  </>
  );
};
