import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export const PollingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Интервал из переменных окружения (в минутах)
    const intervalMinutes = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_MINUTES || '5', 10);
    const intervalMs = intervalMinutes * 60 * 1000;

    const pollData = async () => {
      console.log('Polling server data...');      
      // TODO: вызов API и обновление store
      // dispatch(fetchSomeData());
    };

    pollData(); // Первый вызов сразу при монтировании
    const interval = setInterval(pollData, intervalMs);

    return () => clearInterval(interval);
  }, [dispatch]);

  return <>{children}</>;
};
