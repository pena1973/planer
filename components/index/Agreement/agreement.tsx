
import React, {useState } from 'react';
import styles from "./agreement.module.scss";
import {UserItem } from "@/types/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { useTranslation } from 'react-i18next';


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

  const { t  } = useTranslation();
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
          {t('agreement.agree')}
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
