
import { ClientItem } from "./../../types/service-types";

export const saveClient = async (
    userId:number,
    teamId: number,
    client: ClientItem,
    token: string,    
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setClientForm: (val: ClientItem) => void,) => {

    try {

             const res = await fetch(`api/invoices/client-api`,
                 {
                     method: 'post',
                     headers: new Headers({
                         'Authorization': 'Basic ' + token,
                         'Content-Type': 'application/json'
                     }),
                     body: JSON.stringify({
                         userId: userId,
                         teamId: teamId,
                         client: client
                     }),
                 }
             );
             if (res.status !== 200) {
                 const receivedData = await res.json();
                 setMessage(receivedData.error);
             } else {
                 const receivedData = await res.json();
                 if (receivedData.success) {
                     const client_ = receivedData.client as ClientItem
                    
                     setClientForm(client_);
        
                     setMessage("Обновлены реквизиты клиента");
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