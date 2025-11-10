
import { LeadItem,LeadSource,LeadStatus } from "./../../types/leads-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const changeStatusLead = async (
    userId: number,
    leadId: number,
    status: LeadStatus,
    leads: LeadItem[],
    setleads: (val: LeadItem[]) => void,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,

) => {

    // try {
    //     const res = await fetch(`api/admin/mail-status-api`,
    //         {
    //             method: 'POST',
    //             headers: new Headers({
    //                 'Authorization': 'Basic ' + token,
    //                 'Content-Type': 'application/json',
    //                 "X-Lang": locale,
    //             }),
    //             body: JSON.stringify({
    //                 mailId: mailId,
    //                 status: status,
    //             }),
    //         }
    //     );
    //     if (res.status !== 200) {
    //         const receivedData = await res.json();
    //         const error = receivedData.error;
    //         setMessage(`${t('service.serverUnavailable')} ${error}`);
    //         //  logger
    //         void ulogger.error({
    //             userId: userId,
    //             location: "services/admin/changeStatusMail",
    //             event: "endpoint_error",
    //             message: `res.status=${res.status} error=${error}`,
    //             context: "export const changeStatusMail = async (",
    //         }).catch(() => { console.error("logger error") });
    //     } else {
    //         const receivedData = await res.json();
    //         if (receivedData.success) {
    //             const supportMails_ = supportMails.map(mes => (mes.id === mailId) ? { ...mes, status: status } : mes)
    //             setSupportMails(supportMails_);
    //             setMessage("Успешно обработан мейл");
    //         } else {
    //             setMessage(receivedData.message);
    //             //  logger
    //             void ulogger.error({
    //                 userId: userId,
    //                 location: "services/admin/changeStatusMail",
    //                 event: "error",
    //                 message: `success=false запрос api/admin/mail-status-api`,
    //                 context: "export const changeStatusMail = async (",
    //             }).catch(() => { console.error("logger error") });
    //         }
    //     }

    // } catch (e: unknown) {
    //     let error = "";
    //     if (e instanceof Error) {
    //         error = e.message;
    //     }
    //     setMessage(`${t('service.serverUnavailable')} ${error}`);
    //     //  logger
    //     void ulogger.error({
    //         userId: userId,
    //         location: "services/admin/changeStatusMail",
    //         event: "endpoint_error",
    //         message: `catch: ${error}`,
    //         context: "export const changeStatusMail = async (",
    //     }).catch(() => { console.error("logger error") });
    // }


};