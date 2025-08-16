import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useTranslation } from 'react-i18next';


import { downloadUoms } from '@/services/initial/downloadUoms';
import { downloadActions } from '@/services/initial/downloadActions';
import { downloadUnutActions } from '@/services/initial/downloadUnut-Actions';
import { downloadUnutExceptions } from '@/services/initial/downloadUnut-Exceptions';
import { downloadSchedule } from '@/services/initial/downloadSchedule';

import { downloadLoads } from '@/services/initial/downloadLoads';
import { downloadTCards } from '@/services/initial/downloadTCards';
import { downloadLoadsStatuses } from '@/services/process/downloadLoadsStatuses';


export const PollingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const unit = useSelector((state: RootState) => {
    return state.authSlice.unit;
  })
  const unitsLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })

  const [message, setMessage] = useState('');

  useEffect(() => {
    // Интервал из переменных окружения (в минутах)
    const intervalMinutes = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_MINUTES || '1', 10);
    const intervalMs = intervalMinutes * 60 * 1000;

    const pollData = async () => {
      console.log('Polling server data...');
      if (!token) return
      // Юниты кроме настроек и лоадов ничего изменять не могут но они должны их получать
      if (!user.isAdmin) {
        await downloadUoms(user.id, team.id, token, t, setMessage, dispatch);
        await downloadActions(user.id, team.id, token, t, setMessage, dispatch);
        await downloadUnutActions(unit?.id, user.id, team.id, token, t, setMessage, dispatch);
        await downloadUnutExceptions(unit?.id, user.id, team.id, token, t, setMessage, dispatch);
        await downloadSchedule(user.id, team.id, token, t, setMessage, dispatch);
        await downloadTCards(user.id, team.id, token, t, setMessage, dispatch);
        await downloadLoads(user.id, team.id, token, t, setMessage, dispatch);
      }

      //  Здесь обновлять только статусы  поскольку на клиенте идет оперативная работа
      await downloadLoadsStatuses(user.id, team.id, token, unitsLoads, t, setMessage, dispatch);
      console.log('time', new Date().toLocaleTimeString());
      console.log('Polling server data...successful');
    };

    pollData(); // Первый вызов сразу при монтировании
    const interval = setInterval(pollData, intervalMs);

    return () => clearInterval(interval);
  }, [dispatch]);

  return <>{children}</>;
};
