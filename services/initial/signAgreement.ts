
import { setSignedAgreement, setStep } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Подпись соглашения
export const signAgreement = async (
  userId: number,
  agreementId: number,
  agreement_text_snapshot:string,
  agreement_locale:string,
  signedAgreement: boolean,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessageLogin: (msg: string) => void,
  // setStep: (step: number) => void,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {

  // обращаемся к базе и подписываем соглашение
  // после этого переходим к загрузке начальных таблиц
  // после этого вываливаемся на начальные настройки
  try {

    const res = await fetch(`api/user-agreement-api`,
      {
        method: 'post',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        }),
        body: JSON.stringify({
          userId: userId,
          signedAgreement: signedAgreement,
          agreementId: agreementId,
          agreement_text_snapshot:agreement_text_snapshot,
          agreement_locale:agreement_locale
        }),
      }
    );
    if (res.status !== 200) {
      const receivedData = await res.json();
      const error = receivedData.error;
      setMessage(`${t('service.serverUnavailable')} ${error}`);
      //  logger
      void ulogger.error({
        userId: userId,
        location: "services/initial/signAgreement",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const signAgreement = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const signed_ = receivedData.signed as boolean;
        if (!signed_) {
          setMessageLogin(receivedData.message);
           dispatch(setStep(2));
          return;
        }
        //   Обновим настройки          
        dispatch(setSignedAgreement(signed_));
        dispatch(setStep(4));
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/initial/signAgreement",
          event: "error",
          message: `success=false запрос api/user-agreement-api`,
          context: "export const signAgreement = async (",
        }).catch(() => { console.error("logger error") });
      }
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    setMessage(`${t('service.serverUnavailable')} ${error}`);
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/initial/signAgreement",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const signAgreement = async (",
    }).catch(() => { console.error("logger error") });
  }
}