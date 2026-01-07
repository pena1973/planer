import { Dispatch } from "redux";
import { TCardItem, TemplateItem, TeamItem, UserItem } from "./../../types/types";
import { setTemplates } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveTemplate = async (
  tCards: TCardItem[],
  tCardIndex: number,
  templates: TemplateItem[],
  team: TeamItem,
  user: UserItem,
  token: string,
  dispatch: Dispatch,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
) => {

  const tCard = tCards[tCardIndex]

  try {
    // запрос получение текста из БД вместе со словами     textId: number, userId:number
    const res = await fetch(`api/catalogs/template-api`,
      {
        method: 'post',
        headers: {
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        },
        body: JSON.stringify({
          teamId: team.id,
          userId: user.id,
          tCard: tCard,
        }),
      }
    );
    if (res.status !== 200) {
      const receivedData = await res.json();
      const error = receivedData.error;
      setMessage(`${t('service.serverUnavailable')} ${error}`);
      //  logger
      void ulogger.error({
        userId: user.id,
        location: "services/templates/saveTemplate",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const saveTemplate = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        //   Обновим текущую карту
        const template = receivedData.template as TemplateItem
        const updatedTemplate = [...templates, template];
        dispatch(setTemplates(updatedTemplate));
        setMessage("Шаблон удочно записан");
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: user.id,
          location: "services/templates/saveTemplate",
          event: "error",
          message: `success=false запрос api/catalogs/template-api`,
          context: "export const saveTemplate = async (",
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
      userId: user.id,
      location: "services/templates/saveTemplate",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const saveTemplate = async (",
    }).catch(() => { console.error("logger error") });
  }

};