
import React, { useEffect, useState, useMemo } from 'react';
import styles from "./billing.module.scss";
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getInvoices } from '@/services/billing/getInvoices';

import { ClientItem, InvoiceItem, UsageItem } from "@/types/service-types";
import { TeamItem, UserItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import download from "@/public/download2-rem.png";
import galb from "@/public/arrow-gray-up.png"; // галочка вниз
import galt from "@/public/arrow-gray-down.png"; // галочка вверх

import { generateTeamNumber } from '@/lib/client/utils.client'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import DropdownSelectCountry from "@/components/DropdownSelectCountry/dropdownSelectCountry";
import { countriesEurope } from "@/components/DropdownSelectCountry/countries-europe";

import { saveClient } from '@/services/billing/saveClient';
import { getClient } from '@/services/billing/getClient';
import { getAttachedTeams } from '@/services/billing/getAttachedTeams';
import { getTeamActivity } from '@/services/billing/getTeamActivity';
import { getBalance } from '@/services/billing/getBalance';
import { getUsage } from '@/services/billing/getUsage';

import { changeStateTeam } from '@/services/billing/changeStateTeam';
import { createCheckoutSession } from '@/services/billing/payments';

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
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  // const [billsValue, setBillsValue] = useState<BillItem[]>([]);
  const [invoicesValue, setInvoicesValue] = useState<InvoiceItem[]>([]);
  const [usageValue, setUsageValue] = useState<UsageItem[]>([]);
  const [clientForm, setClientForm] = useState({} as ClientItem);
  const [attachedTeams, setAttachedTeams] = useState<TeamItem[]>([]);
  const [teamActivity, setTeamActivity] = useState<{ teamId: number, active: boolean }[]>([]);
  const [balance, setBalance] = useState<number>(0);
  // const [VAT, setVAT] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [loaderButtonSaveClient, setLoaderButtonSaveClient] = useState(false);
  const [loaderButtonActivate, setLoaderButtonActivate] = useState(NaN);

  // свернуть развернуть

  const [expandForm, setExpandForm] = useState(false);
  const [expandBalance, setExpandBalance] = useState(false);
  const [expandTeams, setExpandTeams] = useState(false);
  const [expandInvoices, setExpandInvoices] = useState(false);
  const [expandUsage, setExpandUsage] = useState(false);

  const mainTeam = useMemo(() => generateTeamNumber(team.prefix, team.id), [team]);
  const active = useMemo(() => teamActivity?.find(a => a.teamId === team.id)?.active ?? false, [team, teamActivity]);

  //  меняем активность команды
  const onStateTeam = async (teamIdToChange: number, state: boolean) => {
    setLoaderButtonActivate(teamIdToChange);
    await changeStateTeam(user.id, team.id, teamIdToChange, state, teamActivity, token, t, i18n.language, setMessage, setTeamActivity, dispatch)
    setLoaderButtonActivate(NaN);
  };

  // сохранить реквизиты
  const onSaveClient = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)) {
      setMessage("Некорректный email"); // тут своя нотификация
      return
    }
    setLoaderButtonSaveClient(true);
    await saveClient(user.id, team.id, clientForm, token, t, i18n.language, setMessage, setClientForm)
    setLoaderButtonSaveClient(false);
  };

  const getClientHandler = async () => {
    await getClient(user.id, team.id, token, t, i18n.language, setMessage, setClientForm);
  };

  const getinvoicesHandler = async () => {
    await getInvoices(user.id, team.id, token, t, i18n.language, setMessage, setInvoicesValue);
  };
  const getAttachedTeamsHandler = async () => {
    await getAttachedTeams(user.id, mainTeam, token, t, i18n.language, setMessage, setAttachedTeams);
  };
  // возвращает информацию в каком состоянии команда активна или заморожена
  const getTeamActivityHandler = async () => {
    await getTeamActivity(user.id, mainTeam, token, t, i18n.language, setMessage, setTeamActivity);
  }
  const getBalanceHandler = async () => {
    await getBalance(user.id, team.id, token, t, i18n.language, setMessage, setBalance);
  };
const getUsageHandler = async () => {
    await getUsage(user.id, team.id, token, t, i18n.language, setMessage, setUsageValue);
  };
  useEffect(() => {
    getClientHandler();
    getinvoicesHandler()

    getAttachedTeamsHandler();
    getTeamActivityHandler();
    getBalanceHandler();
    getUsageHandler();

  }, [])

  const onDownloadInvoicePdf = async (invoiceId: number, token: string, locale: string) => {
    const res = await fetch(`/api/billing/invoice-pdf?invoiceId=${invoiceId}&teamId=${team.id}&userId=${user.id}`, {
      method: 'GET',      
      headers: {
        Authorization: 'Basic ' + token,
        'Content-Type': 'application/json',
        'X-Lang': locale,
      },
    });

    if (!res.ok) {
      // тут можешь setMessage / toast
      throw new Error(`PDF download failed: ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // форсируем скачивание
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const invoicesReactNodes = invoicesValue.map((invoice, index) => {
    return (
      <tr key={index}>
        <td>{invoice.date}</td>
        <td>{invoice.invoice}</td>
        <td>{invoice.amount}</td>
        <td>{invoice.currency}</td>
        <td>
          <Image
            className={styles.icon_bill}
            src={download}
            alt="invoice"
            width={20}
            height={20}
            role="button"
            // onClick={() => invoice.link && window.open(invoice.link, '_blank')}
            onClick={() => invoice.id && onDownloadInvoicePdf(invoice.id, token, i18n.language)}
          />
        </td>
      </tr>
    );
  });

  
  const usageReactNodes = usageValue.map((usage, index) => {
    return (
      <tr key={index}>
        <td>{usage.date}</td>                              
        <td>{usage.coment}</td> 
        <td>{usage.amount}</td>                
      </tr>
    );
  });

  const attachedTeamsReactNodes = attachedTeams.map((team, index) => {
    const active = teamActivity?.find(a => a.teamId === team.id)?.active ?? false;
    return (
      <tr key={index}>
        <td>{generateTeamNumber(team.prefix, team.id)}</td>
        <td>{team.title}</td>        
        <td>{active ? t('bills.active') : "-"}</td>
        <td>
          <button className={styles.bt} onClick={(e) => onStateTeam(team.id, !active)}>
            {loaderButtonActivate === team.id && <ButtonLoader />}
            {loaderButtonActivate !== team.id && (active ? t('bills.deactivate') : t('bills.activate'))}
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
        userId,
        teamId,
        i18n.language,
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

  return (<>
    {/* // Форма реквизитов клиента */}
    {team && isMainTeam && <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.section_title}>{t('bills.client_requisites')}
          <Image
            className={styles.icon_bill}
            src={expandForm ? galb : galt} alt="invoice" width={20} height={20}
            onClick={(e) => { setExpandForm(!expandForm); }}
          />
        </div>
        {expandForm && <form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); onSaveClient(); }}
        >
          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.title')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.title ?? ""}
              onChange={e => setClientForm({ ...clientForm, title: e.target.value })}
            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.vat')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.reg_n ?? ""}
              onChange={e => setClientForm({ ...clientForm, reg_n: e.target.value })}

            />
          </div>

          <div className={styles.form_row}>

            <label className={styles.form_label}>
              {t('client.country')}
            </label>
            <DropdownSelectCountry
              options={countriesEurope}
              selectedValue={clientForm?.country ?? null}
              onSelect={(opt) => setClientForm({ ...clientForm, country: opt?.code ?? "" })}
            />
          </div>

          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.postal_code')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.postal_code ?? ""}
              onChange={e => setClientForm({ ...clientForm, postal_code: e.target.value })}

            />
          </div>
          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.city')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.city ?? ""}
              onChange={e => setClientForm({ ...clientForm, city: e.target.value })}

            />
          </div>
          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.address_line1')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.address_line1 ?? ""}
              onChange={e => setClientForm({ ...clientForm, address_line1: e.target.value })}

            />
          </div>
          <div className={styles.form_row}>
            <label className={styles.form_label}>{t('client.address_line2')}</label>
            <input
              className={styles.input}
              type="text"
              value={clientForm?.address_line2 ?? ""}
              onChange={e => setClientForm({ ...clientForm, address_line2: e.target.value })}

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


          <div className={styles.form_actions}>
            <button className={styles.bt} type="submit">
              {loaderButtonSaveClient && <ButtonLoader />}
              {!loaderButtonSaveClient && t('client.save')}
            </button>
          </div>
        </form>}
      </div>
    </div>}
    {/* === Оплата === */}
    {team && isMainTeam && <div className={styles.container}>
      <div className={styles.section_title}>{t('bills.payment')}
        <Image
          className={styles.icon_bill}
          src={expandBalance ? galb : galt} alt="invoice" width={20} height={20}
          onClick={(e) => { setExpandBalance(!expandBalance); }}
        />
      </div>
      {expandBalance && <div>
        <pre />
        <div className={styles.notice}>
          {t('bills.notification')}
        </div>
        <pre />
        <div className={styles.pay_row}>
          <div className={styles.balance}>
            {t('bills.balance')}: <b>{balance}</b>  {t('bills.point')}
          </div>
        </div>
        <div className={styles.pay_controls}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={t('bills.amount')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          /> EUR
          <button className={styles.bt} onClick={() => onPay(Number(amount), user.id, team.id)}>
            {t('bills.pay')}
          </button>
        </div>

      </div>}
    </div>}
    {/* === Перечень прикрепленных команд (только для основной) === */}
    {team && isMainTeam && <div className={styles.container}>
      <div className={styles.section_title}>{t('bills.attached_teams')}
        <Image
          className={styles.icon_bill}
          src={expandTeams ? galb : galt} alt="invoice" width={20} height={20}
          onClick={(e) => { setExpandTeams(!expandTeams); }}
        />

      </div>
      {expandTeams && <table className={styles._table}>
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
            <td className={styles.td_mainTeam}>{active ? t('bills.active') : "-"}</td>
            <td className={styles.td_mainTeam}>

              <button className={styles.bt}
                onClick={(e) => onStateTeam(team.id, !active)}>

                {loaderButtonActivate === team.id && <ButtonLoader />}
                {loaderButtonActivate !== team.id && (active ? t('bills.deactivate') : t('bills.activate'))}

              </button>
            </td>
          </tr>
          {attachedTeamsReactNodes}
        </tbody>
      </table>}

    </div>}
    {/* === Таблица счетов === */}
    {team && isMainTeam && <div className={styles.container}>

      <div className={styles.section_title}>{t('bills.invoises')}
        <Image
          className={styles.icon_bill}
          src={expandInvoices ? galb : galt} alt="invoice" width={20} height={20}
          onClick={(e) => { setExpandInvoices(!expandInvoices); }}
        />

      </div>
      <pre />
      {expandInvoices && <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('bills.date')}</th>
            <th>{t('bills.title')}</th>
            <th>{t('bills.amount1')}</th>
            <th>{t('bills.currency')}</th>
            <th>{t('bills.download')}</th>

          </tr>
        </thead>
        <tbody>{invoicesReactNodes}</tbody>
      </table>}

    </div>}
    {/* === Usage === */}
    {team && isMainTeam && <div className={styles.container}>

      <div className={styles.section_title}>{t('bills.usage')}
        <Image
          className={styles.icon_bill}
          src={expandUsage ? galb : galt} alt="usage" width={20} height={20}
          onClick={(e) => { setExpandUsage(!expandUsage); }}
        />

      </div>
      <pre />
      {expandUsage && <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('bills.date')}</th> 
            <th>{t('bills.coment')}</th>           
            <th>{t('bills.qty')}</th>
           
          </tr>
        </thead>
        <tbody>{usageReactNodes}</tbody>
      </table>}

    </div>}
  </>
  );
};
