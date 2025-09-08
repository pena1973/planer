
import React, { useEffect, useState, useMemo } from 'react';
import styles from "./billing.module.scss";

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { getBills } from '@/services/billing/getBills';
import { downloadFile } from '@/services/billing/downloadInvoice';
import { BillItem, ClientItem, MainItem } from "@/types/service-types";
import { TeamItem, UserItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import download from "@/public/download2-rem.png";

import { generateTeamNumber } from '@/lib/utils'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { saveClient } from '@/services/billing/saveClient';
import { getClient } from '@/services/billing/getClient';
import { getAttachedTeams } from '@/services/billing/getAttachedTeams';
import { getTeamActivity } from '@/services/billing/getTeamActivity';
import { getBalance } from '@/services/billing/getBalance';
import { getForecast } from '@/services/billing/getForecast';
import { changeStateTeam } from '@/services/billing/changeStateTeam';
import { createCheckoutSession } from '@/services/billing/payments';
import { string } from 'zod';


interface BillingProps {
  setMessage: (message: string) => void,
  team: TeamItem,
  user: UserItem,
  token: string,
  isMainTeam: boolean
  timezone: string,

}

export const Billing: React.FC<BillingProps> = ({
  setMessage,
  team,
  user,
  token,
  isMainTeam,
  timezone,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [billsValue, setBillsValue] = useState<BillItem[]>([]);
  const [clientForm, setClientForm] = useState({} as ClientItem);
  const [attachedTeams, setAttachedTeams] = useState<TeamItem[]>([]);
  const [teamActivity, setTeamActivity] = useState<{ teamId: number, active: boolean }[]>([]);

  const [balance, setBalance] = useState<number>(0);
  const [forecast, setForecast] = useState<number>(0);
  const [VAT, setVAT] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [loaderButtonSave, setLoaderButtonSave] = useState(false);
  const [loaderButtonChangeStateTeam, setLoaderButtonChangeStateTeam] = useState(NaN);

  const mainTeam = useMemo(() => generateTeamNumber(team.prefix, team.id), [team]);
  const active = useMemo(() => teamActivity?.find(a => a.teamId === team.id)?.active ?? false, [team, teamActivity]);

  //  меняем активность команды
  const onStateTeam = async (teamIdToChange: number, state: boolean) => {
    setLoaderButtonChangeStateTeam(teamIdToChange);
    await changeStateTeam(user.id, team.id, teamIdToChange, state, teamActivity, token, t, setMessage, setTeamActivity, dispatch)
    setLoaderButtonChangeStateTeam(NaN);
  };

  // сохранить реквизиты
  const onSaveClient = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)) {
      setMessage("Некорректный email"); // тут своя нотификация
      return
    }
    setLoaderButtonSave(true);
    await saveClient(user.id, team.id, clientForm, token, t, setMessage, setClientForm)
    setLoaderButtonSave(false);
  };

  const getClientHandler = async () => {
    await getClient(user.id, team.id, token, t, setMessage, setClientForm);
  };
  const getBillsHandler = async () => {
    await getBills(user.id, team.id, token, t, setMessage, setBillsValue);
  };
  const getAttachedTeamsHandler = async () => {
    await getAttachedTeams(user.id, mainTeam, token, t, setMessage, setAttachedTeams);
  };
  // возвращает информацию в каком состоянии команда активна или заморожена
  const getTeamActivityHandler = async () => {
    await getTeamActivity(user.id, mainTeam, token, t, setMessage, setTeamActivity);
  }
  const getBalanceHandler = async () => {
    await getBalance(user.id, team.id, token, t, setMessage, setBalance);
  };
  const getForecastHandler = async () => {
    await getForecast(timezone, user.id, team.id, token, t, setMessage, setForecast, setVAT);
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
            alt="invoice"
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
    const active = teamActivity?.find(a => a.teamId === team.id)?.active ?? false;
    return (
      <tr key={index}>
        <td>{generateTeamNumber(team.prefix, team.id)}</td>
        <td>{team.title}</td>
        <td>{active ? "активная" : "-"}</td>
        <td>
          <button className={styles.bt} onClick={(e) => onStateTeam(team.id, !active)}>
            {loaderButtonSave && <ButtonLoader />}
            {!loaderButtonChangeStateTeam && active ? "деактивировать" : "активировать"}
          </button>
        </td>
      </tr>
    );
  });



  const onPay = async (amountEUR: number, userId: number, teamId: number) => {
    // const [url, setURL] = useState("");

    const amount = Number(amountEUR);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Введите корректную сумму оплаты.");
      return;
    }

    try {

      const { redirectUrl } = await createCheckoutSession(
        amount,
        VAT,
        userId,
        teamId,
        token,
        t,
        setMessage,
      );
      window.location.href = redirectUrl; // переходим на Stripe Checkout

    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message || 'Payment init failed');
      } else {
        alert('Payment init failed');
      }
    }

  }
  const totalWithVAT = (forecast: number, VAT: number): number => {
    const cents = Math.round(forecast * 100);       // приводим к копейкам/центам
    const vatBp = Math.round(VAT * 100);            // VAT в б.п. (21% -> 2100)
    const totalCents = Math.round(cents * (10000 + vatBp) / 10000);
    return totalCents / 100;                        // обратно в валюту
  }
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
      <pre />
      <div className={styles.notice}>
        Списание денег производится каждое 1 число за прошлый месяц.
      </div>
      <pre />
      <div className={styles.notice}>
        Когда расход превысит баланс все команды перейдут в неактивное состояние.
      </div>
      <pre />
      <div className={styles.pay_row}>
        <div className={styles.balance}>
          {t('bills.balance') || 'Balance'}: <b>{balance}</b>  {t('bills.point')}
        </div>

        <div className={styles.balance}>
          {t('bills.forecast') || 'Forecast'}: <b>{forecast}</b> {t('bills.point')}
        </div>
      </div>
      <div className={styles.pay_row}>
        <div className={styles.balance}>
          {t('bills.price') || 'Price'}: <b>1</b> EUR + VAT({VAT}%) = <b>{totalWithVAT(1, VAT)}</b> EUR

        </div>


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
        <button className={styles.btn} onClick={() => onPay(Number(amount), user.id, team.id)}>
          {t('bills.pay') || 'Pay'}
        </button>
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
            <th>{t('bills.stateActive')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>

          <tr key={0}>
            <td className={styles.td_mainTeam}>{generateTeamNumber(team.prefix, team.id)}</td>
            <td className={styles.td_mainTeam}>{team.title}</td>
            <td className={styles.td_mainTeam}>{active ? "активная" : "-"}</td>
            <td className={styles.td_mainTeam}>

              <button className={styles.bt} onClick={(e) => onStateTeam(team.id, !active)}>
                {loaderButtonSave && <ButtonLoader />}
                {!loaderButtonChangeStateTeam && active ? "деактивировать" : "активировать"}
              </button>
            </td>
          </tr>
          {attachedTeamsReactNodes}
        </tbody>
      </table>

    </div>}

    {team && isMainTeam && <div className={styles.container}>
      {/* === Таблица счетов === */}
      <div className={styles.section_title}>{t('bills.invoises') || 'Invoices'}</div>
      <pre />
      <div className={styles.notice}>{t('bills.invoises_notice') || 'Invoices'}</div>
      <pre />
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
