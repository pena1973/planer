import { Dispatch } from "redux";
import { TemplateItem, TeamItem, UserItem } from "./../../types/types";
import { setTemplates } from "./../../store/slices";

export const saveTemplates = async (
    templatesValue: TemplateItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setModified: (val: boolean) => void,
) => {

    setMessage("");
    let todoReturn = false;
    let message = "";
    templatesValue.forEach((elem, index) => {
        if (!elem.name) {
            message = message.concat(`${t('templates.fillTitle')} ${index + 1}! `);
            todoReturn = true;
        }
        if (!elem.fileContent) {
            message = message.concat(`${t('templates.uploadTemplate')} ${index + 1}!`);
            todoReturn = true;
        }
    })

    if (todoReturn) {
        setMessage(message);
        return;
    }

    // запрос на сохранение
    try {

        const res = await fetch(`api/templates-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: user.id,
                    teamId: team.id,
                    templates: templatesValue
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
                const templates_ = receivedData.templates as TemplateItem[]
                dispatch(setTemplates(templates_));
                setModified(false);
                setMessage(t('templates.templatesUpdated'));
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
};
