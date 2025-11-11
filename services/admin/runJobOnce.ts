// services/admin/runJobOnce.ts

import { ulogger } from "@/lib/common/universal-logger";

type RunJobResponse = {
  success: boolean;
  message?: string;
  // опционально сервер может вернуть полезный payload
  data?: unknown;
  error?: string;
};

/**
 * Принудительный разовый запуск регламентной job на сервере.
 * @param jobKey ключ job (например, 'cleanup:core' или 'billing:charge')
 * @param token JWT/Basic токен авторизации 
 * @param setMessage показать пользователю статус/ошибку
 * @param params произвольные параметры для конкретной job (опционально)
 * @param userId для логгера
 *
 */
export const runJobOnce = async (
  jobKey: string,
  token: string,  
  setMessage: (msg: string) => void,
  userId: number,
  params?: Record<string, any> | null,  
) => {
  try {
    // Лучше POST, чтобы спокойно передавать сложные params и не мучаться с encodeURIComponent
    const res = await fetch(`/api/jobs/run`, {
      method: "POST",
      headers: new Headers({
        Authorization: "Basic " + token,
        "Content-Type": "application/json",
        "X-Lang": "ru",
      }),
      body: JSON.stringify({
        job: jobKey,
        params: params ?? null,
      }),
    });

    if (res.status !== 200) {
      // сервер вернул ошибку/не 200
      let errorText = "";
      try {
        const received: RunJobResponse = await res.json();
        errorText = received?.error || received?.message || `HTTP ${res.status}`;
        setMessage(`Сервер недоступен ${errorText}`);
      } catch {
        errorText = `HTTP ${res.status}`;
        setMessage(`Сервер недоступен ${errorText}`);
      }

      // logger
      void ulogger
        .error({
          userId: userId ?? null,
          location: "services/jobs/runJobOnce",
          event: "endpoint_error",
          message: `res.status=${res.status} job=${jobKey} error=${errorText}`,
          context: "export const runJobOnce = async (",
        })
        .catch(() => {
          console.error("logger error");
        });

      return;
    }

    // 200 OK
    const received: RunJobResponse = await res.json();

    if (received.success) {
      setMessage(
        received.message ||
         "Задание выполнено"
      );
   
      // logger (как info)
      void ulogger
        .info({
          userId: userId ?? null,
          location: "services/jobs/runJobOnce",
          event: "ok",
          message: `job=${jobKey} success`,
          context: "export const runJobOnce = async (",
        })
        .catch(() => {
          console.error("logger error");
        });
    } else {
      const msg =
        received.message ||
        received.error ||
        "Ошибка выполнения задания";
      setMessage(msg);

      void ulogger
        .error({
          userId: userId ?? null,
          location: "services/jobs/runJobOnce",
          event: "error",
          message: `job=${jobKey} success=false message=${msg}`,
          context: "export const runJobOnce = async (",
        })
        .catch(() => {
          console.error("logger error");
        });
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);
    setMessage(`Сервер недоступен ${err}`);

    void ulogger
      .error({
        userId: userId ?? null,
        location: "services/jobs/runJobOnce",
        event: "catch_error",
        message: `catch: ${err} job=${jobKey}`,
        context: "export const runJobOnce = async (",
      })
      .catch(() => {
        console.error("logger error");
      });
  }
};
