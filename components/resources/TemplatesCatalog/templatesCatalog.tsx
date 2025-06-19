
import styles from "./templatesCatalog.module.scss";

import { TemplateItem } from '@/types/types'
import Image from 'next/image';

import { useEffect, useState } from "react";

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setTemplates } from '@/store/slices'

import { validateFileContent } from "@/lib/utils"

import { useTranslation } from 'react-i18next';

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

import download from "@/public/download2-rem.png";
import upload from "@/public/upload2-rem.png";

export interface UOMSCatalogProps {
    setMessage: (message: string) => void,
    token: string
}

export default function TemplatesCatalog({
    setMessage,
    token
}: UOMSCatalogProps) {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const templates = useSelector((state: RootState) => {
        return state.dataSlice.templates;
    })

    const team = useSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [templatesValue, setTemplatesValue] = useState([] as TemplateItem[]);

// eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setTemplatesValue(templates);
    }, []);

    // колбеки кнопки
    const deleteTemplateHandler = (indexToRemove: number) => {
        const uomsValueUpdated = [...templatesValue]
        uomsValueUpdated.splice(indexToRemove, 1)
        setTemplatesValue(uomsValueUpdated)
        setModified(true);
    };

    const changeTemplateHandler = (indexToChange: number, value: string) => {
        setModified(true);
        let updateTemplate = templatesValue[indexToChange];
        updateTemplate = { ...updateTemplate, name: value }
        const templatesValueUpdated = [...templatesValue]
        templatesValueUpdated.splice(indexToChange, 1, updateTemplate)
        setTemplatesValue(templatesValueUpdated)

    };

    const saveTemplatesHandler = async () => {
        setMessage("");
        let todoReturn = false;
        let message = "";
        templatesValue.forEach((elem, index) => {
            if (!elem.name) {
                // {t('teamSchedule.additonalTime')}
                // message = message.concat(`Заполните название шаблона строка ${index + 1}! `);
                message = message.concat(`${t('templates.fillTitle')} ${index + 1}! `);
                todoReturn = true;
            }
            if (!elem.fileContent) {
                // message = message.concat(`Загрузите шаблон строка ${index + 1}!` );
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
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
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
                const error = receivedData.error;
                // setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                setMessage(t('service.serverUnavailable') + error);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)

                if (receivedData.success) {
                    // //   Обновим текущую карту
                    const templates_ = receivedData.templates as TemplateItem[]
                    dispatch(setTemplates(templates_));
                    setModified(false);
                    // setMessage("Обновлен список шаблонов карт");
                    setMessage(t('templates.templatesUpdated'));

                } else setMessage(receivedData.error);
            }

        // } catch (e: any) {
        //     setMessage(t('service.serverUnavailable') + e.message)
        // }
        } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}


        setModified(false);
    };

    const addTemplateHandler = () => {

        const newTemplate = { name: "new", fileContent: "" } as TemplateItem;
        setTemplatesValue([...templatesValue, newTemplate])
        setModified(true);
    };
    const cancelTemplateHandler = () => {
        setTemplatesValue([...templates]);
        setModified(false)
    };

    const downloadTemplateHandler = (indexTo: number) => {
        const fileName = `${templatesValue[indexTo].name}.json`;
        const exportData = templatesValue[indexTo].fileContent;
        // если ничего нет
        if ((!exportData))
            return;

        // Convert data to JSON
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });

        // Also, you can save it to the system default download folder by triggering the download process
        const link = document.createElement('a');
        link.href = URL.createObjectURL(jsonBlob);
        link.download = fileName;
        link.click();
    }
    const uploadTemplateHandler = (indexTo: number) => {
        const templatesValue_ = [...templatesValue];
        // Создаем элемент input для загрузки файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json'; // Ограничиваем выбор файла только JSON

        // Когда файл выбран
        input.onchange = (event) => {
            const fileInput = event.target as HTMLInputElement; // Приводим к типу HTMLInputElement
            const file = fileInput?.files?.[0];  // Получаем первый выбранный файл

            if (file && file.type === 'application/json') {
                const reader = new FileReader();

                // Чтение содержимого файла
                reader.onload = (e) => {
                    try {
                        // Парсим содержимое файла как JSON
                        const jsonData = JSON.parse(e.target?.result as string);
                        // валидация
                        // Проверяем содержание файла на наличие отсутствующих или некорректных полей
                        const { missingFields, invalidFields } = validateFileContent(jsonData);

                        if (missingFields.length > 0 || invalidFields.length > 0) {
                            let errorMessage = '';

                            if (missingFields.length > 0) {
                                // errorMessage += `Отсутствуют обязательные поля: ${missingFields.join(', ')}.                                 
                                // Загрузка сделана не будет!`;
                                errorMessage += `${t('templates.errorMessage1')} ${missingFields.join(', ')}.                                 
                                ${t('templates.errorMessage1')}`;
                            }
                            if (invalidFields.length > 0) {
                                // errorMessage += `Некорректные значения в полях: ${invalidFields.join(', ')}.
                                // Загрузка сделана не будет!`;
                                errorMessage += `${t('templates.errorMessage3')} ${invalidFields.join(', ')}.
                                ${t('templates.errorMessage1')}`;
                            }

                            alert(errorMessage);
                        } else {
                            // Обновляем данные шаблона для выбранного индекса
                            const template_ = { ...templatesValue_[indexTo], fileContent: jsonData };

                            templatesValue_.splice(indexTo, 1, template_)
                            setTemplatesValue(templatesValue_);
                            // Можно обновить интерфейс или отправить данные на сервер
                            console.log('Загруженный шаблон:', jsonData);
                        }
                        // Дополнительная логика, например, отправка на сервер или обновление состояния
                        // Возможно, нужно отправить jsonData в API для сохранения в базе данных
                    } catch (err) {
                        console.error('Ошибка при парсинге файла:', err);

                        // alert('Ошибка при загрузке шаблона. Файл поврежден или некорректный.');
                        alert(t('templates.alert1'));
                    }
                };

                // Чтение содержимого файла как строки
                reader.readAsText(file);
            } else {
                // alert('Пожалуйста, выберите файл в формате JSON.');
                alert(t('templates.alert2'));
            }
        };

        // Открываем диалог выбора файла
        input.click();
    };



    const templatesValueReactNodes = templatesValue.map((template, index) => (

        <tr key={index}>
            <td>
                <Image
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteTemplateHandler(index)}
                />
            </td>
            <td>
                <input
                    className={styles.templates_input}
                    id={"code" + template.name}
                    autoComplete="off"
                    value={template.name} type="text"
                    maxLength={20}
                    onChange={e => {
                        setModified(true);
                        changeTemplateHandler(index, e.target.value)
                    }} />
            </td>
            <td>
                <button className={styles.button_download}>
                    <Image className={styles.icon_edit_save}
                        src={download}
                        alt="arrow" width={20} height={20}
                        onClick={() => { downloadTemplateHandler(index) }}
                    />
                </button>

            </td>
            <td>
                <button className={styles.button_download}>
                    <Image className={styles.icon_edit_save}
                        src={upload}
                        alt="arrow" width={20} height={20}
                        onClick={() => { uploadTemplateHandler(index) }}
                    />
                </button>
            </td>
            <td>
                {/* {(!template.fileContent) ?"": "загружен" } */}
                {(!template.fileContent) ? "" : t('templates.downloaded')}
            </td>

        </tr>

    ))
    return (
        <div className={styles.container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelTemplateHandler() }}
            />
            <table className={styles._table}>
                <thead>
                    <tr>
                        <th></th>
                        <th>{t('templates.title')}</th>
                        <th></th>
                        <th></th>
                        <th>{t('templates.template')}</th>

                    </tr>
                </thead>
                <tbody>
                    {templatesValueReactNodes}
                </tbody>
            </table>
            <div className={styles.container_buttons_row_table}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={add}
                        alt="arrow" width={20} height={20}
                        onClick={() => { addTemplateHandler() }}
                    />
                </div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveTemplatesHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>
        </div>


    )
}