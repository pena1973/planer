import { Dispatch } from "redux";
import { TemplateItem, TeamItem, UserItem } from "./../../types/types";
import { setTemplates } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveTemplates = async (
    templatesValue: TemplateItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
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

    try {

        const res = await fetch(`api/catalogs/templates-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/templates/saveTemplates",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveTemplates = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //   Обновим текущую карту
                const templates_ = receivedData.templates as TemplateItem[]
                dispatch(setTemplates(templates_));
                setMessage(t('templates.templatesUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/templates/saveTemplates",
                    event: "error",
                    message: `success=false запрос api/catalogs/templates-api`,
                    context: "export const saveTemplates = async (",
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
            location: "services/templates/saveTemplates",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveTemplates = async (",
        }).catch(() => { console.error("logger error") });
    }
};
