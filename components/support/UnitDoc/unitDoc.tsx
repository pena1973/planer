


import React, { useState } from "react";
import styles from "./unitDoc.module.scss";
import { Trans, useTranslation } from "react-i18next";


interface UnitDocProps {

}

const UnitDoc: React.FC<UnitDocProps> = ({ }) => {
  const { t } = useTranslation();

  return (
    // <div className={styles.сontainer}>
    //       <h3>1. План</h3>
    //       <p>
    //         В этом разделе отображается план работ на текущий день, с указанием времени выполнения каждой задачи.
    //       </p>
    //       <p>
    //         Чтобы посмотреть детали задачи, нажмите на неё. Внутри вы увидите:
    //       </p>
    //       <ul>
    //         <li><strong>Результат</strong> — то, что вы должны получить после выполнения.</li>
    //         <li><strong>Источник</strong> — материалы и инструменты, необходимые для выполнения.</li>
    //       </ul>
    //       <p>
    //         Каждому источнику и результату присваивается уникальный код:
    //       </p>
    //       <ul>
    //         <li><strong>Код с «М»</strong> — материал со склада.</li>
    //         <li><strong>Код с «А»</strong> — результат другой задачи.</li>
    //       </ul>
    //       <p>
    //         <strong>Описание задачи</strong> содержит инструкцию по выполнению.
    //       </p>
    //       <p>
    //         В зависимости от вашей роли:
    //       </p>
    //       <ul>
    //         <li>
    //           <strong>Исполнитель</strong> видит одну кнопку <em>«Выполнено»</em>, или две — <em>«Готов»</em> и <em>«Брак»</em>, если нет контролёра.
    //         </li>
    //         <li>
    //           Если в команде есть <strong>контролёр</strong>, то у исполнителя только кнопка <em>«Выполнено»</em>, после чего задача переходит к контролёру.
    //         </li>
    //         <li>
    //           Контролёр проверяет задачу и нажимает <em>«Готов»</em> или <em>«Брак»</em>.
    //         </li>
    //       </ul>
    //       <p>
    //         Если контролёра нет, исполнитель сам принимает решение о статусе задачи.
    //       </p>        
    //       <h3>2. Справка</h3>
    //       <p>
    //         Этот раздел содержит инструкции и пояснения по работе с приложением.
    //       </p>        
    //       <h3>3. Профиль</h3>
    //       <p>
    //         Здесь хранится информация о пользователе. Вы можете изменить имя и пароль.
    //       </p>
    //       <p>
    //         <strong>Важно:</strong> смена e-mail и логина недоступна из профиля. Удаление пользователя может выполнить только администратор команды.
    //       </p>

    // </div>
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
