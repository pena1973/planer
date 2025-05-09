// Файл загрузка
import React, { useState, } from "react";
import styles from './fileUploadButton.module.scss';
import { generateUniqueId } from "@/utils"
import { TCardItem, TCardProductItem, TCardOperationItem, StatusEnum, ActionItem, UOMItem } from "@/types"; // Импортируем нужные типы

export interface FileUploadButtonProps<T> {
    onCardUpload: (tCard: TCardItem) => void; // Колбэк для передачи данных в родительский компонент

}

const FileUploadButton = <T extends {}>({
    onCardUpload,
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


    // Функция для валидации содержимого файла
const validateFileContent = (content: any) => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];
  
    // Проверяем обязательные поля (кроме id и maxIdc)
    if (!content.date) {
      missingFields.push('date');
    } else {
      // Проверяем, что дата в формате YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(content.date)) {
        invalidFields.push('date');
      }
    }
    if (!content.tCardOperations) {
      missingFields.push('tCardOperations');
    }
  
    // Проверяем корректность типа для каждого поля (например, idc должно быть числом)
    if (content.idc && typeof content.idc !== 'number') {
      invalidFields.push('idc');
    }
  
    // Дополнительные проверки для других вложенных объектов (например, tCardOperations)
    if (content.tCardOperations && Array.isArray(content.tCardOperations)) {
      content.tCardOperations.forEach((operation: any, index: number) => {
        if (!operation.idc) {
          missingFields.push(`tCardOperations[${index}].idc`);
        }
        // if (!operation.status) {
        //   missingFields.push(`tCardOperations[${index}].status`);
        // }
        if (operation.idc && typeof operation.idc !== 'number') {
          invalidFields.push(`tCardOperations[${index}].idc`);
        }
        // if (operation.status && operation.status !== 'draft') {
        //   invalidFields.push(`tCardOperations[${index}].status`);
        // }
      });
    }
  
    return { missingFields, invalidFields };
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
  
 
    // Функция для преобразования данных из файла в формат TCardItem
    const transformToTCard = (content: any): TCardItem => {
       const tempId = generateUniqueId();
      
        const tCard: TCardItem = {
            id: -tempId,
            date: content.date || '',
            idc: content.idc || 0,
            modified: true,
            maxIdc: content.maxIdc || 0,
            status: StatusEnum.draft,
            tCardOperations: content.tCardOperations.map((operation: any) => {
                return {
                    id: operation.id,
                    idc: operation.idc,
                    stage: {
                        id: operation.stage.id,
                        idc: operation.stage.idc,
                        code: operation.stage.code,
                    },
                    out: operation.out.map((prod: any) => ({
                        id: prod.id,
                        codeS: prod.code,
                        qtu: prod.qtu,
                        uom: { id: prod.uom.id, title: prod.uom.title } as UOMItem,
                    })),
                    inn: operation.inn.map((prod: any) => ({
                        id: prod.id,
                        codeS: prod.code,
                        qtu: prod.qtu,
                        uom: { id: prod.uom.id, title: prod.uom.title } as UOMItem,
                    })),
                    action: { id: operation.action.id, title: operation.action.title } as ActionItem,
                    duration: operation.duration,
                    mode: operation.mode,
                    status: StatusEnum.draft,
                    coment: operation.coment || '',
                };
            }),
            tCardProducts: [],
            tCardWastes: [],
            tCardMaterials: [],
            tCardStages: [],
        };

        return tCard;
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