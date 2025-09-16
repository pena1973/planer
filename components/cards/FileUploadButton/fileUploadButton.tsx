// Файл загрузка
import React, { useState, } from "react";
import styles from './fileUploadButton.module.scss';
import { generateUniqueId, calculateMaxIdc, validateFileContent } from "@/lib/client/utils.client"
import { getCurrentDateInString } from "@/lib/client/timezone.client"
import {
  TCardItem, TCardContent, StatusEnum, ActionItem, UOMItem, ProductContent, TProductContent,
  ProductItem, TCardProductItem
} from "@/types/types"; // Импортируем нужные типы

import { useTranslation } from 'react-i18next';

export interface FileUploadButtonProps {
  onCardUpload: (tCard: TCardItem) => void,
  uoms: UOMItem[],
  actions: ActionItem[],
  timezone: string, // Необязательное свойство timezone
}

const FileUploadButton = ({
  onCardUpload,
  uoms,
  actions,
  timezone
}: FileUploadButtonProps) => {

  const { t } = useTranslation();

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
      alert(t('fileUpload.alert')
        // 'Пожалуйста, загрузите файл в формате JSON'
      );
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
    // const currentDate = new Date().toLocaleDateString("en-CA"); // формат YYYY-MM-DD
    const currentDate = getCurrentDateInString(timezone); // формат YYYY-MM-DD
    
    const tCard: TCardItem = {
      id: -tempId,
      date: currentDate,
      idc: 0,
      // Заполняем products
      products: content.products.map((product: ProductContent) => {
        const uom = uoms.find(uom => uom.code === product.uom.code);
        return ({
          idc: product.idc,
          title: product.title,
          uom: (uom) ? uom : undefined,
          sync: product.sync,
        } as ProductItem)
      }),
      tCardProducts: content.tCardProducts ? content.tCardProducts.map((tProduct: TProductContent) => {
        const product = content.products.find(product => product.idc === tProduct.productIdc);
        return {
          code: tProduct.code,
          qtu: tProduct.qtu,
          product: product
        } as TCardProductItem
      }) : [],
      tCardWastes: content.tCardWastes ? content.tCardWastes.map(
        (waste: TProductContent) => {
          const product = content.products.find(product => product.idc === waste.productIdc);
          return {
            code: waste.code,
            qtu: waste.qtu,
            product: product
          } as TCardProductItem
        }) : [],

      tCardOperations: content.tCardOperations ? content.tCardOperations.map((operation, index) => {
        let action = actions.find(act => act.code === operation.action.code);
        action = (action) ? action : { id: NaN, code: "", title: "", interruptible: false }
        return {
          ...operation,
          order: index + 1,
          action: action,
          status: StatusEnum.draft,

          out: operation.out.map((outItem) => {
            const product = content.products.find(product => product.idc === outItem.productIdc);
            return {
              code: outItem.code,
              qtu: outItem.qtu,
              product: product
            } as TCardProductItem
          }),
          inn: operation.inn.map((innItem) => {
            const product = content.products.find(product => product.idc === innItem.productIdc);
            return {
              code: innItem.code,
              qtu: innItem.qtu,
              product: product
            } as TCardProductItem
          }),
        };
      }) : [],
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
            // Отсутствуют обязательные поля:
            errorMessage += `${t('fileUpload.alert1')} Отсутствуют обязательные поля: ${missingFields.join(', ')}. `;
          }
          if (invalidFields.length > 0) {
            // Некорректные значения в полях:
            errorMessage += `${t('fileUpload.alert2')} ${invalidFields.join(', ')}.`;
          }

          alert(errorMessage);
        } else {
          // Преобразуем содержимое в карту, если ошибок нет
          const tCard = transformToTCard(content);
          onCardUpload(tCard);
        }
      } catch (err) {
        // alert('Невозможно прочитать или распарсить файл.');
        alert(t('fileUpload.alert3'));

      }
    };
    reader.readAsText(file);
  };

  // Загрузите файл JSON сюда 
  return (<div
    className={`${styles.container_card_load} ${isDragging ? 'dragover' : ''}`}
    onDragOver={handleDragOverFile}
    onDragLeave={handleDragLeaveFile}
    onDrop={handleDropFile}
    onClick={handleFileClick}
  > {t('fileUpload.json')} </div>)

}
export default FileUploadButton;