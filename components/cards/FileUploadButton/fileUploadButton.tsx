// Файл загрузка
import React, { useState, } from "react";
import styles from './fileUploadButton.module.scss';
import { generateUniqueId } from "@/utils"
import { TCardItem, TCardProductItem, TCardOperationItem, StatusEnum, ActionItem, UOMItem } from "@/types"; // Импортируем нужные типы

export interface FileUploadButtonProps<T> {
  onCardUpload: (tCard: TCardItem) => void,
  uoms: UOMItem[],
  actions: ActionItem[],
}

const FileUploadButton = <T extends {}>({
  onCardUpload,
  uoms,
  actions,
}: FileUploadButtonProps<T>) => {
  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания drag&drop


  // Обработчики для drag&drop
  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeaveFile = () => {
    setIsDragging(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      readFile(file);
    } else {
      alert('Пожалуйста, загрузите файл в формате JSON');
    }
  };

  const handleFileClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && file.type === 'application/json') {
        readFile(file);
      }
    };
    fileInput.click();
  };

  ///////////////////////
  // Функция для проверки содержимого файла на наличие отсутствующих или некорректных полей
  const validateFileContent = (content: any) => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    // Проверяем обязательные поля
    if (!content.date) missingFields.push("date");
    if (!content.idc) missingFields.push("idc");
    if (!Array.isArray(content.tCardProducts)) missingFields.push("tCardProducts");
    if (!Array.isArray(content.tCardOperations)) missingFields.push("tCardOperations");

    // Проверка на корректность значений
    if (content.tCardProducts) {
      content.tCardProducts.forEach((product: any, index: number) => {
        if (!product.codeS) invalidFields.push(`tCardProducts[${index}].codeS`);
        if (!product.title) invalidFields.push(`tCardProducts[${index}].title`);
        if (typeof product.qtu !== 'number') invalidFields.push(`tCardProducts[${index}].qtu`);
        if (!product.uom || !product.uom.code || !product.uom.title) invalidFields.push(`tCardProducts[${index}].uom`);
      });
    }

    if (content.tCardOperations) {
      content.tCardOperations.forEach((operation: any, index: number) => {
        if (!operation.idc) invalidFields.push(`tCardOperations[${index}].idc`);
        if (!operation.stage || !operation.stage.idc || !operation.stage.code) invalidFields.push(`tCardOperations[${index}].stage`);
        if (!Array.isArray(operation.out)) invalidFields.push(`tCardOperations[${index}].out`);
        if (!Array.isArray(operation.inn)) invalidFields.push(`tCardOperations[${index}].inn`);
      });
    }

    return { missingFields, invalidFields };
  };

  // Функция для преобразования данных из файла в формат TCardItem
  const transformToTCard = (content: any): TCardItem => {
    const tempId = generateUniqueId();
    const tCard: TCardItem = {
      id: -tempId,
      date: content.date,
      idc: content.idc,
      tCardProducts: content.tCardProducts.map((product: any) => {

        const uom = uoms.find(uom => uom.code === product.uom.code);

        return (
          {
            idc: product.idc,
            codeS: product.codeS,
            title: product.title,
            qtu: product.qtu,
            uom: {
              id: uom?.id,
              code: uom?.code,
              title: uom?.title
            }
          })
      }),
      tCardWastes: content.tCardWastes ? content.tCardWastes.map((waste: any) => {
        const uom = uoms.find(uom => uom.code === waste.uom.code);
        return ({
          idc: waste.idc,
          codeS: waste.codeS,
          title: waste.title,
          qtu: waste.qtu,
          uom: {
            id: uom?.id,
            code: uom?.code,
            title: uom?.title
          }
        })
      }) : [],
      tCardOperations: content.tCardOperations.map((operation: any) => {
        const action = actions.find(act => act.code === operation.action.code);
        return ({
          idc: operation.idc,
          stage: {
            idc: operation.stage.idc,
            code: operation.stage.code
          },
          out: operation.out.map((outItem: any) => {
            const uom = uoms.find(uom => uom.code === outItem.uom.code);
            return ({
              idc: outItem.idc,
              codeS: outItem.codeS,
              title: outItem.title,
              qtu: outItem.qtu,
              uom: {
                id: uom?.id,
                code: uom?.code,
                title: uom?.title
              }
            })
          }),
          inn: operation.inn.map((innItem: any) => {
            const uom = uoms.find(uom => uom.code === innItem.uom.code);
            return ({
              idc: innItem.idc,
              codeS: innItem.codeS,
              title: innItem.title,
              qtu: innItem.qtu,
              uom: {
                id: uom?.id,
                code: uom?.code,
                title: uom?.title
              }
            })
          }),
          action: {
            id: action?.id,
            code: action?.code,
            title: action?.title
          },
          duration: operation.duration,
          status: operation.status,
          coment: operation.coment
        })
      }),
      tCardStages: content.tCardStages.map((stage: any) => ({
        idc: stage.idc,
        code: stage.code
      })),
      maxIdc: content.maxIdc, // Может быть вычислено отдельно, если нужно
      coment: content.coment,
      status: content.status as StatusEnum,
      modified: true // Так как карта новая, она считается измененной
    };
    return tCard;
  };

  // Обработчик для чтения файла
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = JSON.parse(reader.result as string);

        // Проверяем содержание файла на наличие отсутствующих или некорректных полей
        const { missingFields, invalidFields } = validateFileContent(content);

        if (missingFields.length > 0 || invalidFields.length > 0) {
          let errorMessage = '';

          if (missingFields.length > 0) {
            errorMessage += `Отсутствуют обязательные поля: ${missingFields.join(', ')}. `;
          }
          if (invalidFields.length > 0) {
            errorMessage += `Некорректные значения в полях: ${invalidFields.join(', ')}.`;
          }

          alert(errorMessage);
        } else {
          // Преобразуем содержимое в карту, если ошибок нет
          const tCard = transformToTCard(content);
          onCardUpload(tCard);
        }
      } catch (err) {
        alert('Невозможно прочитать или распарсить файл.');
      }
    };
    reader.readAsText(file);
  };


  return (<div
    className={`${styles.container_card_load} ${isDragging ? 'dragover' : ''}`}
    onDragOver={handleDragOverFile}
    onDragLeave={handleDragLeaveFile}
    onDrop={handleDropFile}
    onClick={handleFileClick}
  > Загрузите файл JSON сюда </div>)
}
export default FileUploadButton;