import { Dispatch } from "redux";
import { TCardItem, TemplateItem, TeamItem, UserItem } from "@/types/types";
import { setTemplates } from "@/store/slices";

export const saveTemplate = async (
  tCards: TCardItem[],
  tCardIndex: number,
  templates: TemplateItem[],
  team: TeamItem,
  user: UserItem,
  token: string,
  dispatch: Dispatch,
  t: (key: string) => string,
  setMessage: (msg: string) => void,

) => {

    const tCard = tCards[tCardIndex]

    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/template-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            teamId: team.id,
            userId: user.id,
            tCard: tCard,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        setMessage(receivedData.error);        
      } else {
        const receivedData = await res.json();        
        if (receivedData.success) {
          //   Обновим текущую карту
          const template = receivedData.template as TemplateItem
          const updatedTemplate = [...templates, template];
          dispatch(setTemplates(updatedTemplate));
          setMessage("Шаблон удочно записан");
        }
      }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }

  };