

import { ClientItem } from "./../../types/service-types";

export const getClient = async (
    userId:number,
    teamId: number,    
    token: string,    
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setClientForm: (val: ClientItem) => void,) => {

    try {

             const res = await fetch(`api/billing/client-api?userId=${userId}&teamId=${teamId}`,
                 {
                     method: 'get',
                     headers: new Headers({
                         'Authorization': 'Basic ' + token,
                         'Content-Type': 'application/json'
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