import Layout from "@/components/Layout/layout";
import TCardOper from "@/components/cards/TCardOper/tCardOper";
import TCardOperNew from "@/components/cards/TCardOperNew/tCardOperNew";
import TCardProducts from "@/components/cards/TCardProducts/tCardProducts";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { formatDate, padNumberToFourDigits } from "@/utils"
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { useRouter } from 'next/navigation';

import { } from '@/store/slices';
import { UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, TCardStageItem, StatusEnum } from "@/types";
import { checkReconcilation } from "@/cardsHandlers";

import { setTCards, setTCardCurrent, setTCardCurrentMaterials, setTCardCurrentOperations, setTCardCurrentProducts, settCardCurrentWastes, setTCardCurrentStages, setTCardCurrentMaxIdc } from '@/store/slices'

import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface CardsProps { }

export default function Cards({ }: CardsProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // const [fileContent, setFileContent] = useState(null); // Состояние для хранения прочитанного JSON из файла
  const [currentDraggingElement, setCurrentDraggingElement] = useState("");
  // const [droppedOn, setDroppedOn] = useState('');

  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [loaderCard, setLoaderCard] = useState(NaN); // состояние это id категории  
  const [modified, setModified] = useState(false); // Текущая карта изменена  
  // счетчик новых уникальных id   -  временное использование до записи в базу 
  // все id отрицательные  в базу пишутся как есть 


  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  const tCardCurrent = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrent;
  })
  const tCardCurrentMaxIdc = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentMaxIdc;
  })
  const tCardCurrentProducts = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentProducts;
  })
  const tCardCurrentWastes = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentWastes;
  })
  const tCardCurrentOperations = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentOperations;
  })
  const tCardCurrentMaterials = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentMaterials;
  })
  const tCardCurrentStages = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrentStages;
  })

  const useUniqueId = () => {
    let currentId = (tCardCurrentMaxIdc >= 0) ? tCardCurrentMaxIdc + 1 : 0; // увеличиваем значение ID на 1
    dispatch(setTCardCurrentMaxIdc(currentId))
    return currentId;  // Возвращаем новый уникальный ID    
  };

  // ПЕРЕТАСКИВАНИЕ
  //  handleMouseDown — обработчик события, который вызывается при нажатии кнопки мыши на элементе:
  // Срабатывает, когда пользователь начинает перетаскивание.
  // В нем вызывается функция setIsDragging(true), которая устанавливает состояние, что элемент в данный момент перетаскивается.
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // копируем элемент и его уэже тащим
    setIsDragging(true)
  }
  // handleDrop — обработчик события сброса перетаскиваемого элемента:
  // Срабатывает, когда пользователь отпускает элемент на другом месте.
  // e.preventDefault() используется для того, чтобы предотвратить стандартное поведение браузера (например, попытку открыть перетаскиваемый элемент в новом окне).
  // Функция setDroppedOn(target) устанавливает состояние droppedOn на тот элемент, на который был сброшен перетаскиваемый элемент.
  // console.log() выводит в консоль информацию о том, на какой элемент был сброшен объект.
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: string) => {
    setModified(true);
    e.preventDefault(); // Предотвращаем стандартное поведение
    // setDroppedOn(target); // Устанавливаем, на какой элемент был сброшен перетаскиваемый элемент
    let updatedProducts = [...tCardCurrentProducts];
    let updatedOperations = [...tCardCurrentOperations];

    if (currentDraggingElement.includes("P") && target === "W") {
      const indexProduct = Number(currentDraggingElement.replace("P", ""));
      updatedProducts.splice(indexProduct, 1)
      // dispatch(setTCardCurrentProducts(updatedProducts)); // Обновляем массив продуктов  
    }

    if (currentDraggingElement.includes("P") && target === "M") {
      // перетаскиваем из продуктов в материалы
    }
    if (currentDraggingElement.includes("W") && target === "P") {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      const indexWaste = Number(currentDraggingElement.replace("W", ""));
      // перетаскиваем из отходов в продукт            
      // Найдем элемент в waste по index
      const productToMove = tCardCurrentWastes[indexWaste];

      if (productToMove) {
        // Добавляем элемент в tCardCurrentProducts
        updatedProducts = [...tCardCurrentProducts, productToMove];
        // Обновляем состояния через dispatch
        dispatch(setTCardCurrentProducts(updatedProducts)); // Обновляем массив продуктов
      }
    }
    if (currentDraggingElement.includes("M") && target === "P") {
      // перетаскиваем из материалов в продукт нереально
    }

    // ok
    if (currentDraggingElement.includes("P") && target.includes("O")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      const indexProduct = Number(currentDraggingElement.replace("P", ""));
      const idOper = Number(target.replace("O", ""));
      // код источник в продукте и код результат в операции
      let product = tCardCurrentProducts[indexProduct]
      let code = `C${idOper}O${product.idc}`;
      let productToUpdate = { ...product, codeS: code } as TCardProductItem;

      // ищем операцию и вставляем в выход
      updatedOperations = tCardCurrentOperations.map((oper) => {
        if (oper.idc === idOper) {
          let outUpdated = [...oper.out, productToUpdate]
          // добавим предмет на выходе
          return { ...oper, out: outUpdated };
        }
        return oper; // Если id не совпадает, оставляем элемент без изменений
      })
      // Обновляем состояния через dispatch      
      dispatch(setTCardCurrentOperations(updatedOperations)); // Обновляем массив операций
    }

    // ok
    if (currentDraggingElement.includes("I") && target.includes("O")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      // const indexProduct = Number(currentDraggingElement.replace("I", ""));
      const regex = /C(\d+)I(\d+)/;
      // Применяем регулярное выражение
      const match = currentDraggingElement.match(regex);

      if (match) {
        const idOperInn = parseInt(match[1], 10); // id операции откуда
        const indexProductInn = parseInt(match[2], 10); // индекс входа тащим в выход
        const idOperOut = Number(target.replace("O", "")); // id операции куда
        // код источник в продукте и код результат в операции
        let operInn = tCardCurrentOperations.find(oper => oper.idc === idOperInn)
        let product = operInn?.inn[indexProductInn]
        if (!product) return;

        let code = `C${idOperOut}O${product.idc}`;
        let productToUpdate = { ...product, codeS: code } as TCardProductItem;

        // обновляем операции
        updatedOperations = tCardCurrentOperations.map((oper) => {

          // выход
          if (oper.idc === idOperOut) {
            // добавим предмет на выходе
            let outUpdated = [...oper.out, productToUpdate]
            return { ...oper, out: outUpdated };
          }
          // вход
          if (oper.idc === idOperInn) {
            // заменим codeS предмета на входе
            let innUpdated = [...oper.inn];
            innUpdated.splice(indexProductInn, 1, productToUpdate)
            return { ...oper, inn: innUpdated };
          }
          return oper; // Если id не совпадает, оставляем элемент без изменений
        })

        // Обновляем состояния через dispatch      
        dispatch(setTCardCurrentOperations(updatedOperations)); // Обновляем массив операций
      }
    }

    // ok
    if (currentDraggingElement.includes("O") && target.includes("I")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      // const indexProduct = Number(currentDraggingElement.replace("I", ""));
      const regex = /C(\d+)O(\d+)/;
      // Применяем регулярное выражение
      const match = currentDraggingElement.match(regex);

      if (match) {
        const idOperOut = parseInt(match[1], 10); // id операции откуда
        const indexProductOut = parseInt(match[2], 10); // индекс выхода тащим в вход
        const idOperInn = Number(target.replace("I", "")); // id операции куда

        // код источник в продукте и код результат в операции
        let operOut = tCardCurrentOperations.find(oper => oper.idc === idOperOut)
        let product = operOut?.out[indexProductOut]
        if (!product) return;

        let code = `C${idOperOut}O${product.idc}`;
        let productToUpdate = { ...product, codeS: code, qtu: 0 } as TCardProductItem;

        // // обновляем операции
        updatedOperations = tCardCurrentOperations.map((oper) => {

          // вход
          if (oper.idc === idOperInn) {
            // добавим предмет на входе
            let innUpdated = [...oper.inn, productToUpdate]
            return { ...oper, inn: innUpdated };
          }

          return oper; // Если id не совпадает, оставляем элемент без изменений
        })

        // Обновляем состояния через dispatch      
        dispatch(setTCardCurrentOperations(updatedOperations)); // Обновляем массив операций
      }
    }

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(updatedProducts, updatedOperations);
    dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
    dispatch(settCardCurrentWastes(tCardWastesUpdated));
    dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated));
    dispatch(setTCardCurrentProducts(tCardProductsUpdated));

    // console.log(currentDraggingElement + ` dropped on: ${target}`); // Логируем, на какой элемент был сброшен
  };
  // handleMouseUp — обработчик события отпускания кнопки мыши:
  // Срабатывает, когда пользователь отпускает кнопку мыши, завершив перетаскивание.
  // В нем вызывается функция setIsDragging(false), которая изменяет состояние на false, указывая, что элемент больше не перетаскивается.
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  // dragOverHandler — обработчик события "перетащил на элемент" (перетаскивание над целевым элементом):
  // Срабатывает, когда перетаскиваемый элемент находится над целевым элементом.
  // Внутри вызывается e.preventDefault(), чтобы разрешить сброс перетаскиваемого элемента (по умолчанию браузер не разрешает сбрасывать элементы на другие элементы).
  function dragOverHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }
  // dropHandler — обработчик события сброса элемента:
  // Этот метод также вызывается при сбросе, но в коде он не выполняет дополнительных действий, кроме вызова e.preventDefault() для предотвращения стандартного поведения.
  function dropHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }


  // // загружает активные карты  
  // const selectTCards = async () => {
  //   try {
  //     const res = await fetch(`/api/tcards-api?userId=${1}&teamId=${1}`,
  //       {
  //         method: 'get',
  //         headers: new Headers({
  //           // 'Authorization': 'Basic ' + token,
  //           'Content-Type': 'application/json'
  //         }),
  //       }
  //     );
  //     if (res.status !== 200) {
  //       const receivedData = await res.json();
  //       let error = receivedData.error;
  //       setMessage(error);
  //       // setMessage(t('service.serverUnavailable') + res.status);
  //     } else {
  //       const receivedData = await res.json();
  //       // console.log("receivedData", receivedData)        
  //       if (receivedData.success) {
  //         //   Обновим текущую карту
  //         let tCards = receivedData.tCards as TCardItem[]
  //         // Сортируем tCards по номеру (если number это число)
  //         let tCards_ = tCards.sort((a, b) => a.number - b.number);
  //         let tCardsUpdated = tCards_.map(card => { return { ...card, date: new Date(card.date) } });
  //         dispatch(setTCards(tCardsUpdated));
  //         setMessage("Карты успешно получены");
  //       }
  //     }
  //   } catch (e: any) {
  //     // setMessage(t('service.noConnection') + e.message)            
  //   }
  //   setModified(false);
  // };

  // Начальный загруз
  useEffect(() => {
    // selectTCards();
    dispatch(setTCardCurrent({} as TCardItem));
    dispatch(setTCardCurrentMaxIdc(0))
    dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
  }, []);


  // СТАДИИ
  const addStage = async (afterStageCode: number) => {
    setModified(true);
    //  определяем id вставляемой стадии
    let minId = 0
    if (tCardCurrentStages.length > 0) {
      // Создаем новый объект с увеличенным кодом
      minId = Math.min(...tCardCurrentStages.map(stage => stage.idc));
    }

    // Ищем индекс элемента с указанным кодом
    const afterIndex = tCardCurrentStages.findIndex(stage => stage.code === afterStageCode);

    // Если такой элемент найден или это добавление первого элемента, добавляем новый после него и сдвигаем последующие коды
    if (afterIndex !== -1 || afterStageCode === 0) {

      const newStage = { idc: minId - 1, code: afterStageCode + 1 } as TCardStageItem;
      // Вставляем новый элемент после элемента с нужным кодом

      const updatedStages = [...tCardCurrentStages]
      updatedStages.splice(afterIndex + 1, 0, newStage);

      // Переприсваиваем коды у всех стадий начиная с afterIndex
      const updatedStages1 = updatedStages.map((stage, index) => {
        // Присваиваем новый код начиная с afterIndex + 1
        if (index > afterIndex) {
          return { ...stage, code: index + 1 }; // Присваиваем новый код
        }
        return stage; // Остальные остаются без изменений
      });

      // Обновляем состояние
      dispatch(setTCardCurrentStages(updatedStages1));


      // Теперь обновляем коды стадий в операциях, чтобы они соответствовали обновленным стадиям
      const updatedOperations = tCardCurrentOperations.map(operation => {
        const updatedStage = updatedStages.find(stage => stage.idc === operation.stage.idc);
        if (updatedStage) {
          return {
            ...operation,
            stage: {
              ...operation.stage,
              code: updatedStage.code, // Обновляем код стадии в операции
            },
          };
        }
        return operation;
      });

      // Обновляем операции в состоянии
      dispatch(setTCardCurrentOperations(updatedOperations));

    } else {
      console.error(`Stage with code ${afterStageCode} not found.`);
    }
  };
  const delStage = async (stage: TCardStageItem) => {
    setModified(true);
    // Удаляем все операции стадии
    const tCardCurrentOperationsUpdated = tCardCurrentOperations.filter((tOper) => tOper.stage.idc !== stage.idc);

    // Находим индекс стадии с нужным кодом
    const stageIndex = tCardCurrentStages.findIndex(stage1 => stage1.idc === stage.idc);

    if (stageIndex !== -1) {
      // Удаляем элемент с найденным кодом
      const updatedStages = tCardCurrentStages.filter((_, index) => index !== stageIndex);

      // Переприсваиваем коды всех последующих стадий начиная с позиции удаленной стадии
      const finalStages = updatedStages.map((stage, index) => {
        if (index >= stageIndex) {
          return { ...stage, code: stage.code - 1 }; // Сдвигаем код на 1 меньше
        }
        return stage; // Остальные остаются без изменений
      });

      // Теперь обновляем коды стадий в операциях, чтобы они соответствовали обновленным стадиям
      const updatedOperations = tCardCurrentOperationsUpdated.map(operation => {
        const updatedStage = finalStages.find(stage => stage.idc === operation.stage.idc);
        if (updatedStage) {
          return {
            ...operation,
            stage: {
              ...operation.stage,
              code: updatedStage.code, // Обновляем код стадии в операции
            },
          };
        }
        return operation;
      });

      // Обновляем состояние
      dispatch(setTCardCurrentStages(finalStages)); //  стадии       
      dispatch(setTCardCurrentOperations(updatedOperations));// Операции

      // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
      const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardCurrentProducts, updatedOperations);
      dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
      dispatch(settCardCurrentWastes(tCardWastesUpdated));
      dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated));
      dispatch(setTCardCurrentProducts(tCardProductsUpdated));
    } else {
      console.error(`Stage with code ${stage.code} not found.`);
    }
  };

  /////////////////// ТЕХ КАРТЫ

  const deleteCardHandler = async (idToRemove: number) => {
    setModified(true);
    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/tcard-api?userId=${1}&teamId=${1}&tcardId=${idToRemove}`,
        {
          method: 'delete',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        // setMessage(receivedData.error);
        if (receivedData.success) {
          //   Обновим текущую карту

          dispatch(setTCardCurrent({} as TCardItem));
          dispatch(setTCardCurrentMaxIdc(0))
          dispatch(setTCardCurrentStages([] as TCardStageItem[]));
          dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
          dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
          dispatch(settCardCurrentWastes([] as TCardProductItem[]));
          dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));

          setMessage("Карта успешно удалена");
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

    const tCardsUpdated = tCards.filter(tCard => tCard.id !== idToRemove);
    dispatch(setTCards(tCardsUpdated))
    // удаляем содержание карты
    dispatch(setTCardCurrent({} as TCardItem));
    dispatch(setTCardCurrentMaxIdc(0));
    dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));

  };
  const saveCardHandler = async () => {
    const idCurrentCard = tCardCurrent.id;
    const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);

    if (!tCards[indexCurrentCard].modified) return;

    setLoaderCard(tCardCurrent.id);
    try {
      const idCurrentCard = tCardCurrent.id;
      const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);

      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/tcard-api?userId=${1}&teamId=${1}&tcardId=${idCurrentCard}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: 1,
            teamId: 1,
            tCard: tCardCurrent,
            tCardMaxIdc: tCardCurrentMaxIdc,
            tCardProducts: tCardCurrentProducts,
            tCardWastes: tCardCurrentWastes,
            tCardMaterials: tCardCurrentMaterials,
            tCardOperations: tCardCurrentOperations,
            tCardStages: tCardCurrentStages
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        // setMessage(receivedData.error);
        if (receivedData.success) {


          //   Обновим текущую карту
          let tCard = receivedData.tCard as TCardItem
          let updatedTCards = [...tCards];
          updatedTCards.splice(indexCurrentCard, 1, { ...tCard, date: new Date(tCard.date) })

          let tCardMaxIdc = receivedData.tCardMaxIdc as number;
          let tCardProducts = receivedData.tCardProducts as TCardProductItem[];
          let tCardWastes = receivedData.tCardWastes as TCardProductItem[];
          let tCardMaterials = receivedData.tCardMaterials as TCardProductItem[];
          let tCardOperations = receivedData.tCardOperations as TCardOperationItem[];
          let tCardStages = receivedData.tCardStages as TCardStageItem[];

          dispatch(setTCards(updatedTCards));
          dispatch(setTCardCurrent(tCard));
          dispatch(setTCardCurrentMaxIdc(tCardMaxIdc))
          dispatch(setTCardCurrentStages(tCardStages as TCardStageItem[]));
          dispatch(setTCardCurrentMaterials(tCardMaterials as TCardProductItem[]));
          dispatch(setTCardCurrentProducts(tCardProducts as TCardProductItem[]));
          dispatch(settCardCurrentWastes(tCardWastes as TCardProductItem[]));
          dispatch(setTCardCurrentOperations(tCardOperations as TCardOperationItem[]));
          setMessage("Карта успешно записана");
          setModified(false);
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setLoaderCard(NaN);
  };
  const addTCardHandler = async () => {
    setModified(true);
    setMessage("");
    const currentDate = new Date();

    // const updatedTCards = tCards.map((card) => { return (card.active) ? { ...card, active: false } : card; });
    let newTCard = { id: -tCards.length - 1, date: currentDate, number: 0, modified: true, status: StatusEnum.draft } as TCardItem

    dispatch(setTCards([...tCards, newTCard]));
    dispatch(setTCardCurrent(newTCard));
    dispatch(setTCardCurrentMaxIdc(0))
    dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
  };
  const selectTCardHandler = async (selectedTCard: TCardItem) => {
    // если новая карта не сохраненная
    dispatch(setTCardCurrent(selectedTCard))
    if (selectedTCard.id < 0) {
      dispatch(setTCardCurrentMaxIdc(0))
      dispatch(setTCardCurrentStages([] as TCardStageItem[]));
      dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
      dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
      dispatch(settCardCurrentWastes([] as TCardProductItem[]));
      dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
      return;
    }

    // Записанные грузим
    setLoaderCard(selectedTCard.id);
    // запрос к базе на загрузку карты

    try {
      const res = await fetch(`api/tcard-api?userId=${1}&teamId=${1}&tcardId=${selectedTCard.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        // setMessage(receivedData.error);
        if (receivedData.success) {
          //   Обновим текущую карту
          let tCard = receivedData.tCard as TCardItem
          let tCardMaxIdc = receivedData.tCardMaxIdc as number;
          let tCardProducts = receivedData.tCardProducts as TCardProductItem[];
          let tCardWastes = receivedData.tCardWastes as TCardProductItem[];
          let tCardMaterials = receivedData.tCardMaterials as TCardProductItem[];
          let tCardOperations = receivedData.tCardOperations as TCardOperationItem[];
          let tCardStages = receivedData.tCardStages as TCardStageItem[];

          dispatch(setTCardCurrent({ ...tCard, active: true }));
          dispatch(setTCardCurrentMaxIdc(tCardMaxIdc))
          dispatch(setTCardCurrentStages(tCardStages as TCardStageItem[]));
          dispatch(setTCardCurrentMaterials(tCardMaterials as TCardProductItem[]));
          dispatch(setTCardCurrentProducts(tCardProducts as TCardProductItem[]));
          dispatch(settCardCurrentWastes(tCardWastes as TCardProductItem[]));
          dispatch(setTCardCurrentOperations(tCardOperations as TCardOperationItem[]));
          setMessage("Карта успешно прочитана");
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setLoaderCard(NaN);
    setModified(false);
  };

  // устанавливает что карта была модифицирована и ее надо сохранить
  const setCartEdited = async () => {
    // нужно обновить в списке карт что модифицирована
    const idCurrentCard = tCardCurrent.id;
    const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);
    let updatedTCards = [...tCards];
    updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], modified: true })
    dispatch(setTCards(updatedTCards));
    dispatch(setTCardCurrent({ ...tCardCurrent, active: true }))
  }
  const setCartPrepared = async () => {
    let tCardCurrentOperations_ = tCardCurrentOperations.map(oper => {
      if (oper.status === StatusEnum.draft)
        return { ...oper, status: StatusEnum.prepared }
      else return oper
    })
    dispatch(setTCardCurrentOperations(tCardCurrentOperations_));

    dispatch(setTCardCurrent({ ...tCardCurrent, status: StatusEnum.prepared, modified: true }))

    // нужно обновить в списке карт 
    const idCurrentCard = tCardCurrent.id;
    const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);
    let updatedTCards = [...tCards];
    updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], status: StatusEnum.prepared, modified: true })
    dispatch(setTCards(updatedTCards));

  }

  ///////////////// ФАЙЛЫ
  // Файл загрузка

  // const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания drag&drop

  // Обработчик события при перетаскивании файла
  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true); // Отмечаем, что файл перетаскивается
  };
  // Обработчик события при выходе из области перетаскивания
  const handleDragLeaveFile = () => {
    setIsDragging(false); // Убираем отметку перетаскивания
  };

  // Обработчик события при сбросе файла
  // Обработчик события при сбросе файла
  const handleDropFile = (e: React.DragEvent) => {
    setModified(true);
    e.preventDefault();
    setIsDragging(false); // Убираем отметку перетаскивания

    const file = e.dataTransfer.files[0]; // Получаем файл из события
    if (file && file.type === 'application/json') {
      readFile(file);

    } else {
      alert('Пожалуйста, загрузите файл в формате JSON');
    }
  };

  // Обработчик для загрузки файла при клике
  const handleFileClick = () => {
    // Динамически создаем элемент input для выбора файла
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json'; // Ограничиваем выбор только JSON файлов
    fileInput.onchange = (e) => {
      const inputElement = e.target as HTMLInputElement; // Приводим target к типу HTMLInputElement
      const file = inputElement.files?.[0]; // Теперь TypeScript знает, что у нас есть поле files
      if (file && file.type === 'application/json') {
        readFile(file);
      }
    };
    fileInput.click(); // Триггерим клик на элементе input
    setModified(true);
  };

  // Чтение содержимого JSON файла
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsedContent = JSON.parse(reader.result as string) as TCardItem;
        //  если текущая карта не выбрана загружаем в новую
        // Если текущая карта не выбрана, загружаем в новую
        if (!tCardCurrent.id) {
          const newCard = {
            id: -tCards.length,
            date: parsedContent.date ? parsedContent.date : new Date(),
            number: parsedContent.number ? parsedContent.number : "new",
            active: true,
          };
          dispatch(setTCardCurrent(newCard));
          dispatch(setTCardCurrentMaxIdc(0)) //  потом вычислить макс id
          // обновим список карт
          dispatch(setTCards([...tCards, newCard]));

        } else { // если выбрана перезаполняем  (главное сохранить id)
          const newCard = { ...tCardCurrent, number: parsedContent.number ? parsedContent.number : tCardCurrent.number };
          dispatch(setTCardCurrent(newCard));
          dispatch(setTCardCurrentMaxIdc(0)) //  потом вычислить макс id
          // Обновляем карту в массиве tCards, если id совпадает
          const updatedTCards = tCards.map((card) =>
            card.id === newCard.id ? { ...card, ...newCard } : card
          );
          dispatch(setTCards(updatedTCards));
        }
        if (parsedContent.tCardMaterials)
          dispatch(setTCardCurrentMaterials([...parsedContent.tCardMaterials]));
        if (parsedContent.tCardOperations)
          dispatch(setTCardCurrentOperations([...parsedContent.tCardOperations]));
        if (parsedContent.tCardProducts)
          dispatch(setTCardCurrentProducts([...parsedContent.tCardProducts]));
        // console.log(parsedContent);

      } catch (err) {
        alert('Невозможно прочитать или распарсить файл.');
      }
    };
    reader.readAsText(file);
  };

  ////////////////// ПРОДУКЦИЯ
  const saveCurrentProductsHandler = (tProductsValue: TCardProductItem[]) => {
    dispatch(setTCardCurrentProducts(tProductsValue))

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tProductsValue, tCardCurrentOperations);

    dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
    dispatch(settCardCurrentWastes(tCardWastesUpdated));
    dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated));
    dispatch(setTCardCurrentProducts(tCardProductsUpdated));
  };

  //////////////////ОПЕРАЦИИ
  // колбеки кнопки
  const deleteOperHandler = (idToRemove: number) => {
    setModified(true);
    const tCardOperationsFiltered = tCardCurrentOperations.filter(tOper => tOper.idc !== idToRemove);
    dispatch(setTCardCurrentOperations(tCardOperationsFiltered));

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardCurrentProducts, tCardOperationsFiltered);
    dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
    dispatch(settCardCurrentWastes(tCardWastesUpdated));
    dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated));
    dispatch(setTCardCurrentProducts(tCardProductsUpdated));
  };

  const cancelOperHandler = (idToCancel: number) => {
    setModified(false);
    const tOperToUpdate = tCardCurrentOperations.find(tOper => tOper.idc === idToCancel);
    if (tOperToUpdate) {
      const updatedOper = { ...tOperToUpdate, mode: false }
      // Обновляем в исходном массиве
      const tCardOperationsUpdated1 = tCardCurrentOperations.map(oper => oper.idc === idToCancel ? updatedOper : oper);
      dispatch(setTCardCurrentOperations(tCardOperationsUpdated1))
    };

  };

  const saveOperHandler = (idTosave: number, inn: TCardProductItem[], out: TCardProductItem[], action: ActionItem | null, duration: number) => {
    setModified(true);
    // костыль обход null тип
    let action1 = action ? action : {} as ActionItem;

    const tOperToUpdate = tCardCurrentOperations.find(tOper => tOper.idc === idTosave);
    if (tOperToUpdate) {
      const updatedOper = { ...tOperToUpdate, inn: [...inn], out: [...out], action: { ...action1 }, duration: duration, mode: !tOperToUpdate.mode, status: StatusEnum.draft }
      // Обновляем в исходном массиве
      const tCardOperationsUpdated1 = tCardCurrentOperations.map(product => product.idc === idTosave ? updatedOper : product);
      dispatch(setTCardCurrentOperations(tCardOperationsUpdated1))
      // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
      const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardCurrentProducts, tCardOperationsUpdated1);
      dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
      dispatch(settCardCurrentWastes(tCardWastesUpdated));
      dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated));
      dispatch(setTCardCurrentProducts(tCardProductsUpdated));
      dispatch(setTCardCurrent({ ...tCardCurrent, status: StatusEnum.draft }));
    };

  };

  const setOperStatus = (idc: number, status: StatusEnum) => {
    setModified(true);
    const tCardCurrentOperations_ = tCardCurrentOperations.map(tOper => {
      if (tOper.idc === idc) {
        return { ...tOper, status: status };
      }
      return tOper;
    });

    dispatch(setTCardCurrentOperations(tCardCurrentOperations_))
    //  прроверим статус карты
    const allNonDraft = tCardCurrentOperations_.every(tOper => tOper.status !== StatusEnum.draft);

    if (!allNonDraft) return

    // обновляем статус если все операции подготовлены
    dispatch(setTCardCurrent({ ...tCardCurrent, status: StatusEnum.prepared, modified: true }))
    // нужно обновить в списке карт 
    const idCurrentCard = tCardCurrent.id;
    const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);
    let updatedTCards = [...tCards];
    updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], status: StatusEnum.prepared, modified: true })
    dispatch(setTCards(updatedTCards));
  };

  const editOperHandler = (idc: number) => {
    setModified(true);
    const tCardOperationsUpdated = tCardCurrentOperations.map(tOper => {
      if (tOper.idc === idc) {
        return { ...tOper, mode: !tOper.mode };
      }
      return tOper;
    });
    dispatch(setTCardCurrentOperations(tCardOperationsUpdated))
  };


  const addOperHandler = (tStage: TCardStageItem) => {
    setModified(true);
    // console.log(tStage);
    let newid = useUniqueId();
    let newOper = {
      idc: newid,
      stage: tStage,
      inn: [] as TCardProductItem[],
      out: [] as TCardProductItem[],
      action: {} as ActionItem,
      duration: 0,
      status: StatusEnum.draft,
    } as TCardOperationItem;
    dispatch(setTCardCurrentOperations([...tCardCurrentOperations, newOper]))
  };

  //  реакт узлы

  let tCardStagesReactNodes = tCardCurrentStages.map((tStage) => {
    //  получили операции стадии
    let operations = tCardCurrentOperations.filter(tOper => (tOper.stage.idc === tStage.idc))

    let operationsReactNodes = operations.map((tCardOperation, index1) => {

      return (<>
        {!(tCardOperation.mode) && <TCardOper
          key={index1}
          tCardOperation={tCardOperation}
          dragOverHandler={dragOverHandler}
          dropHandler={dropHandler}
          setCurrentDraggingElement={setCurrentDraggingElement}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
          isDragging={isDragging}
          currentDraggingElement={currentDraggingElement}
          positionX={position.x}
          positionY={position.y}
          handleDrop={handleDrop}
          deleteOperHandler={deleteOperHandler}
          editOperHandler={editOperHandler}
          setOperStatus={setOperStatus}
        />}

        {tCardOperation.mode && <TCardOperNew
          key={index1}
          idc={tCardOperation.idc}
          inn={tCardOperation.inn}
          out={tCardOperation.out}
          action={tCardOperation.action}
          duration={tCardOperation.duration}
          deleteOperHandler={deleteOperHandler}
          cancelOperHandler={cancelOperHandler}
          saveOperHandler={saveOperHandler}
          useUniqueId={useUniqueId}
          setCartEdited={setCartEdited}
        />}
      </>)
    }
    )

    return (
      <div key={tStage.idc} className="container_stage">
        <div className="container_stage_title">
          Stage {tStage.code}
          <Image className="icon_del_stage"
            src={del} alt="del" width={20} height={20}
            onClick={() => delStage(tStage)}
          />

          <Image className="icon_add_stage"
            src={add} alt="del" width={20} height={20}
            onClick={() => addStage(tStage.code)}
          />
        </div>
        {operationsReactNodes}
        <button onClick={() => addOperHandler(tStage)}> добавить </button>
      </div>

    );
  })

  // Карты
  let tCardsReactNodes = tCards.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(new Date(elem.date));

    return (
      <div key={index4} className="container_card">
        <div className={`${elem.id === tCardCurrent.id ? "container_card_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>
        <div className="container_icon_edit_save">
          <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => {
              // предупреждение о том что данные не сохранятся если просто ткнуть в другую карту!!  сделать!
              // if (uomValue !== null && checkUOMFilled(uomValue)) {
              //   setMessage("");
              saveCardHandler()
              // } else {
              //   setMessage("Заполните единицу измерения!");
              // }
            }}
          />
          {elem.modified && <div>*</div>}
          <Image className="icon_del"
            src={del} alt="del" width={20} height={20}
            onClick={() => deleteCardHandler(elem.id)}
          />

        </div>
      </div>
    );
  })


  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_cards_left_inner">
            <div className="container_cards_title">тех карты</div>
            <div className="container_cards">
              {tCardsReactNodes}
              <div className="container_buttons">
                <button onClick={() => addTCardHandler()}>Добавить</button>
              </div>
            </div>
            <div className="container_cards_title">Пояснение</div>
            <div className="container_global_message">{message}
              
            </div>
          </div>
          <div
            className={`container_card_load ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOverFile}
            onDragLeave={handleDragLeaveFile}
            onDrop={handleDropFile}
            onClick={handleFileClick}
          > Загрузите файл JSON сюда </div>

        </div>
        {(tCardCurrent.id) && <div className="container_global_right card_container_right">

          <div className={`container_status`}>
            status: {tCardCurrent.status}
            {(tCardCurrent.status === StatusEnum.draft)
              && <button
                className={`button_prepared`}
                onClick={setCartPrepared}>
                готов к планированию
              </button>}
          </div>

          <div className="container_right_inner">
            {/* Продукты */}
            <div className="container_products">
              <div className="container_stage_title">
                {/* <div></div> */}
                Продукция
                <Image className="icon_add_stage"
                  src={add} alt="del" width={20} height={20}
                  onClick={() => addStage(0)}
                />
              </div>
              <TCardProducts
                tCardCurrentProducts={tCardCurrentProducts}
                saveCurrentProductsHandler={saveCurrentProductsHandler}
                dragOverHandler={dragOverHandler}
                dropHandler={dropHandler}
                setCurrentDraggingElement={setCurrentDraggingElement}
                handleMouseDown={handleMouseDown}
                handleMouseUp={handleMouseUp}
                isDragging={isDragging}
                currentDraggingElement={currentDraggingElement}
                positionX={position.x}
                positionY={position.y}
                handleDrop={handleDrop}
                possibleEdit={true}
                prefix={"P"}
                useUniqueId={useUniqueId}
                setCartEdited={setCartEdited}
              />
              {/* Отходы */}
              <div className="container_stage_title">
                Отходы
              </div>
              <TCardProducts
                tCardCurrentProducts={tCardCurrentWastes}
                saveCurrentProductsHandler={saveCurrentProductsHandler}
                dragOverHandler={dragOverHandler}
                dropHandler={dropHandler}
                setCurrentDraggingElement={setCurrentDraggingElement}
                handleMouseDown={handleMouseDown}
                handleMouseUp={handleMouseUp}
                isDragging={isDragging}
                currentDraggingElement={currentDraggingElement}
                positionX={position.x}
                positionY={position.y}
                handleDrop={handleDrop}
                possibleEdit={false}
                prefix={"W"}
                useUniqueId={useUniqueId}
                setCartEdited={setCartEdited}
              />
            </div>
            {/* Обработка */}
            {tCardStagesReactNodes}
            {tCardCurrentMaterials.length > 0 &&
              <div className="container_products">
                <div className="container_stage_title">
                  Склад
                </div>
                <TCardProducts
                  tCardCurrentProducts={tCardCurrentMaterials}
                  saveCurrentProductsHandler={saveCurrentProductsHandler}
                  dragOverHandler={dragOverHandler}
                  dropHandler={dropHandler}
                  setCurrentDraggingElement={setCurrentDraggingElement}
                  handleMouseDown={handleMouseDown}
                  handleMouseUp={handleMouseUp}
                  isDragging={isDragging}
                  currentDraggingElement={currentDraggingElement}
                  positionX={position.x}
                  positionY={position.y}
                  handleDrop={handleDrop}
                  possibleEdit={false}
                  prefix={"M"}
                  useUniqueId={useUniqueId}
                  setCartEdited={setCartEdited}
                />
              </div>}
          </div >
        </div >
        }
      </div >
    </Layout >
  )
}

