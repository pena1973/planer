// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState, useAppDispatch } from "@/pages/_app";
// import { useTranslation } from 'react-i18next';


// import { downloadUoms } from '@/services/initial/downloadUoms';
// import { downloadActions } from '@/services/initial/downloadActions';
// import { downloadUnutActions } from '@/services/initial/downloadUnut-Actions';
// import { downloadUnutExceptions } from '@/services/initial/downloadUnut-Exceptions';
// import { downloadSchedule } from '@/services/initial/downloadSchedule';

// import { downloadLoads } from '@/services/initial/downloadLoads';
// import { downloadTCards } from '@/services/initial/downloadTCards';
// import { downloadLoadsStatuses } from '@/services/process/downloadLoadsStatuses';
// import { downloadBaner } from '@/services/process/downloadBaner';


// export const PollingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { t, i18n } = useTranslation();
//   const dispatch = useDispatch();

//   const team = useSelector((state: RootState) => {
//     return state.catalogSlice.team;
//   })
//   const token = useSelector((state: RootState) => {
//     return state.authSlice.token;
//   })
//   const user = useSelector((state: RootState) => {
//     return state.authSlice.user;
//   })
//   const unit = useSelector((state: RootState) => {
//     return state.authSlice.unit;
//   })
//   const unitsLoads = useSelector((state: RootState) => {
//     return state.planSlice.unitLoads;
//   })

//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     // Интервал из переменных окружения (в минутах)
//     const intervalMinutes = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_MINUTES || '1', 10);
//     const intervalMs = intervalMinutes * 60 * 1000;

//     const pollData = async () => {
//       console.log('Polling server data...');
//       if (!token) return
//       // Юниты кроме настроек и лоадов ничего изменять не могут но они должны их получать
//       if (!user.isAdmin) {
//         await downloadUoms(user.id, team.id, token, t, setMessage, dispatch);
//         await downloadActions(user.id, team.id, token, t, setMessage, dispatch);
//         await downloadUnutActions(unit?.id, user.id, team.id, token, t, setMessage, dispatch);
//         await downloadUnutExceptions(unit?.id, user.id, team.id, token, t, setMessage, dispatch);
//         await downloadSchedule(user.id, team.id, token, t, setMessage, dispatch);
//         await downloadTCards(user.id, team.id, token, t, setMessage, dispatch);
//         await downloadLoads(user.id, team.id, token, t, setMessage, dispatch);
//       }

//       //  Здесь обновлять только статусы  поскольку на клиенте идет оперативная работа
//       await downloadLoadsStatuses(user.id, team.id, token, unitsLoads, t, setMessage, dispatch);
//       await downloadBaner(undefined, undefined, token, t, setMessage, dispatch);       
//       // console.log('time', new Date().toLocaleTimeString());
//       console.log('Polling server data...successful');
//     };

//     pollData(); // Первый вызов сразу при монтировании
//     const interval = setInterval(pollData, intervalMs);

//     return () => clearInterval(interval);
//   }, [dispatch]);

//   return <>{children}</>;
// };


import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { RootState, useAppDispatch } from '@/pages/_app';
import { useTranslation } from 'react-i18next';

import { downloadUoms } from '@/services/initial/downloadUoms';
import { downloadActions } from '@/services/initial/downloadActions';
import { downloadUnutActions } from '@/services/initial/downloadUnut-Actions';
import { downloadUnutExceptions } from '@/services/initial/downloadUnut-Exceptions';
import { downloadSchedule } from '@/services/initial/downloadSchedule';
import { downloadLoads } from '@/services/initial/downloadLoads';
import { downloadTCards } from '@/services/initial/downloadTCards';
import { downloadLoadsStatuses } from '@/services/process/downloadLoadsStatuses';
import { downloadBaner } from '@/services/process/downloadBaner';

export const PollingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const team       = useSelector((s: RootState) => s.catalogSlice.team, shallowEqual);
  const token      = useSelector((s: RootState) => s.authSlice.token);
  const user       = useSelector((s: RootState) => s.authSlice.user, shallowEqual);
  const unit       = useSelector((s: RootState) => s.authSlice.unit, shallowEqual);
  const unitsLoads = useSelector((s: RootState) => s.planSlice.unitLoads, shallowEqual);

  const [message, setMessage] = useState('');

  // вычисляем готовность входных данных
  const ready = useMemo(() => Boolean(token && user?.id && team?.id), [token, user?.id, team?.id]);

  // DIAGNOSTICS: отслеживаем смену ready
  const prevReadyRef = useRef<boolean>(false);
  useEffect(() => {
    if (ready !== prevReadyRef.current) {
      console.log('[poll] ready changed ->', ready, {
        token: !!token, userId: user?.id, teamId: team?.id, unitId: unit?.id,
      });
      prevReadyRef.current = ready;
    }
  }, [ready, token, user?.id, team?.id, unit?.id]);

  // хранить актуальные значения внутри таймера
  const tokenRef = useRef(token);
  const userRef  = useRef(user);
  const teamRef  = useRef(team);
  const unitRef  = useRef(unit);
  const loadsRef = useRef(unitsLoads);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { userRef.current  = user;  }, [user]);
  useEffect(() => { teamRef.current  = team;  }, [team]);
  useEffect(() => { unitRef.current  = unit;  }, [unit]);
  useEffect(() => { loadsRef.current = unitsLoads; }, [unitsLoads]);

  useEffect(() => {
    if (!ready) {
      console.log('[poll] skip start: not ready');
      return;
    }

    const intervalMinutes = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_MINUTES || '1', 10);
    const intervalMs = (Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes : 1) * 60 * 1000;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;

      const curToken = tokenRef.current;
      const curUser  = userRef.current;
      const curTeam  = teamRef.current;
      const curUnit  = unitRef.current;
      const curLoads = loadsRef.current;

      if (!curToken || !curUser?.id || !curTeam?.id) {
        console.warn('[poll] skip tick: missing ids', { token: !!curToken, userId: curUser?.id, teamId: curTeam?.id });
        scheduleNext();
        return;
      }

      console.log('[poll] tick', { userId: curUser.id, teamId: curTeam.id, unitId: curUnit?.id });

      try {
        if (!curUser.isAdmin) {
          await downloadUoms(curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
          await downloadActions(curUser.id, curTeam.id, curToken, t, setMessage, dispatch);

          if (curUnit?.id) {
            await downloadUnutActions(curUnit.id, curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
            await downloadUnutExceptions(curUnit.id, curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
          }

          await downloadSchedule(curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
          await downloadTCards(curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
          await downloadLoads(curUser.id, curTeam.id, curToken, t, setMessage, dispatch);
        }

        await downloadLoadsStatuses(curUser.id, curTeam.id, curToken, curLoads, t, setMessage, dispatch);
        await downloadBaner(undefined, undefined, curToken, t, setMessage, dispatch);

        console.log('[poll] tick done');
      } catch (e) {
        console.error('[poll] error', e);
      } finally {
        scheduleNext();
      }
    };

    const scheduleNext = () => {
      if (!cancelled) {
        timer = setTimeout(tick, intervalMs);
      }
    };

    // первый запуск сразу
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };

    // завязываемся только на готовность и стабильные скаляры
  }, [ready /* <- главное */, user?.isAdmin, unit?.id, dispatch]);

  return <>{children}</>;
};
