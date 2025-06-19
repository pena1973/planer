
import React, { useEffect, useState, useRef } from 'react';
import styles from "./agreement.module.scss";
import { UnitKPIItem, StatusEnum, TCardTermsItem, UnitItem,UserItem } from "@/types/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import { padNumberToFourDigits, convertMinutesToTime1 } from "@/lib/utils"
import { useTranslation } from 'react-i18next';
import { text } from 'stream/consumers';

interface AgreementProps {
  user:UserItem,
  textAgreement: string, 
  agreementId:number,
  signAgreement: (signedAgreement: boolean,agreementId:number) => void,
  cancelSignAgreement: () => void,  
  setMessage: (message: string) => void,
}


const Agreement: React.FC<AgreementProps> = ({
  user,
  textAgreement,
  agreementId,  
  signAgreement,
  cancelSignAgreement,
  setMessage,
}) => {

  const { t, i18n } = useTranslation();
  const [signedAgreementValue, setSignedAgreementValue] = useState(false);
  const [loaderButtonAgree, setLoaderButtonAgree] = useState(false);

  return (
    <div className={styles.container}>


      <div className={styles.container_block}>
        <textarea
          id='agreement'
          className={styles.textAgreement}
          value={textAgreement}
          readOnly />
      </div>

      <div className={styles.container_block}>
        <div className={styles.label}>
          {t('payment.agreement')}
          <input 
          className={styles.checkbox} 
          type="checkbox" 
          checked={signedAgreementValue} 
          onChange={() => setSignedAgreementValue(!signedAgreementValue)} 
          autoComplete="off" />
          </div>      
      </div>

      <div className={styles.button_container}>
        <button onClick={(e) => signAgreement(signedAgreementValue,agreementId)}>
          {loaderButtonAgree && <ButtonLoader />}
          {!loaderButtonAgree && t('agreement.signAgreement')}

        </button>
        <button onClick={(e) => cancelSignAgreement()}>
          {loaderButtonAgree && <ButtonLoader />}
          {!loaderButtonAgree && t('agreement.cancelSignAgreement')}

        </button>
      </div>
     
    </div >
  )
};

export default Agreement;
