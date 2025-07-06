


import React, { useState } from "react";
import styles from "./unitDoc.module.scss";
import { Trans, useTranslation } from "react-i18next";



const UnitDoc: React.FC = ({ }) => {
  const { t } = useTranslation();

  return (
 
    <div className={styles.сontainer}>
      <h3>{t('manual.section1Title')}</h3>
      <p>{t('manual.section1Text1')}</p>
      <p>{t('manual.section1Text2')}</p>

      <ul>
        <li><strong>{t('manual.result')}</strong></li>
        <li><strong>{t('manual.source')}</strong></li>
      </ul>

      <p>{t('manual.codesExplanation')}</p>
      <ul>
        <li><strong>{t('manual.codeM')}</strong></li>
        <li><strong>{t('manual.codeA')}</strong></li>
      </ul>

      <p><strong>{t('manual.taskDescription')}</strong></p>
      <p>{t('manual.roleDependant')}</p>
      <ul>
        <li>{t('manual.executorOneOrTwoButtons')}</li>
        <li>{t('manual.executorWithControl')}</li>
        <li>{t('manual.controllerDecision')}</li>
      </ul>
      <p>{t('manual.noController')}</p>

      <h3>{t('manual.section2Title')}</h3>
      <p>{t('manual.section2Text')}</p>

      <h3>{t('manual.section3Title')}</h3>
      <p>{t('manual.section3Text1')}</p>
      <p><strong>{t('manual.section3Text2')}</strong></p>
    </div>
  );
};


export default UnitDoc;
