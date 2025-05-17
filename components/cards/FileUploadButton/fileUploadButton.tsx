// Файл загрузка
import React, { useState, } from "react";
import styles from './fileUploadButton.module.scss';
import { generateUniqueId,calculateMaxIdc,validateFileContent } from "@/utils"
import { TCardItem, TCardContent,ProductContent,OperationContent, TCardOperationItem, StatusEnum, ActionItem, UOMItem } from "@/types"; // Импортируем нужные типы

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

  const transformToTCard = (content: TCardContent): TCardItem => {
    const tempId = generateUniqueId();
    const currentDate = new Date().toLocaleDateString("en-CA"); // формат YYYY-MM-DD
    const tCard: TCardItem = {
      id: -tempId,      
      date: currentDate,
      idc: 0,
      tCardProducts: content.tCardProducts.map((product) => ({
        ...product,
        uom: {
          id: uoms.find(uom => uom.code === product.uom.code)?.id ?? -1,
          code: product.uom.code,
          title: product.uom.title,
        }
      })),
      tCardWastes: content.tCardWastes ? content.tCardWastes.map((waste) => ({
        ...waste,
        uom: {
          id: uoms.find(uom => uom.code === waste.uom.code)?.id ?? -1,
          code: waste.uom.code,
          title: waste.uom.title,
        }
      })) : [],
      tCardOperations: content.tCardOperations.map((operation, index) => {
        let action = actions.find(act => act.code === operation.action.code);
        action = (action) ? action : { id: NaN, code: "", title: "", interruptible: false }
        return {
          ...operation,
          order: index + 1,
          action: action,
          status:StatusEnum.draft,
          out: operation.out.map((outItem) => ({
            ...outItem,
            uom: {
              id: uoms.find(uom => uom.code === outItem.uom.code)?.id ?? -1,
              code: outItem.uom.code,
              title: outItem.uom.title,
            }
          })),
          inn: operation.inn.map((innItem) => ({
            ...innItem,
            uom: {
              id: uoms.find(uom => uom.code === innItem.uom.code)?.id ?? -1,
              code: innItem.uom.code,
              title: innItem.uom.title,
            }
          }))
        };
      }),
      tCardStages: content.tCardStages.map((stage) => ({
        idc: Number(stage.idc),
        code: stage.code
      })),
      maxIdc: calculateMaxIdc(content),
      coment: content.coment ?? '',
      status: StatusEnum.draft,
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