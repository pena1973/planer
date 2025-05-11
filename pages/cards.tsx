import Layout from "@/components/Layout/layout";
import TCardOper from "@/components/cards/TCardOper/tCardOper";
import TCardOperNew from "@/components/cards/TCardOperNew/tCardOperNew";
import TCardProducts from "@/components/cards/TCardProducts/tCardProducts";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { StatusCircle } from "@/components/cards/StatusCircle/statusCircle";
import FileUploadButton from "@/components/cards/FileUploadButton/fileUploadButton";

import { formatDate, padNumberToFourDigits, generateUniqueId } from "@/utils"
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { useRouter } from 'next/navigation';

import { } from '@/store/slices';
import { UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, TCardStageItem, StatusEnum } from "@/types";
import { checkReconcilation, deepCloneTCardItem } from "@/cardsHandlers";

import { setTCards, setTCardCurrentId, setTCardCurrent, setTCardCurrentMaterials, setTCardCurrentOperations, setTCardCurrentProducts, settCardCurrentWastes, setTCardCurrentStages, setTCardCurrentMaxIdc } from '@/store/slices'

import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";
import reset from "@/public/cancel.png";

const URL1 = process.env.NEXT_PUBLIC_URL;
let _url = String(URL1);
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
  const [saveLoaderCard, setSaveLoaderCard] = useState(NaN); // состояние это id категории  
  const [resetLoaderCard, setResetLoaderCard] = useState(NaN); // состояние это id категории   
  const [lightProduct, setLightProduct] = useState(NaN); // idc  продукта который мы выделяем   


  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })

  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })

  const uoms = useSelector((state: RootState) => {
    return state.catalogSlice.uoms;
  })
  const actions = useSelector((state: RootState) => {
    return state.catalogSlice.actions;
  })

  // Начальный загруз
  useEffect(() => {
    if (tCards?.length > 0) selectTCardHandler(tCards[tCardIndex]);
  }, []);

  // //  просто сохраню текущий id карты
  // const tCardCurrentId = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentId;
  // })

  const [tCardIndex, setTCardIndex] = useState(0);

  const useUniqueId = () => {

    let currentId = (tCards[tCardIndex].maxIdc >= 0) ? tCards[tCardIndex].maxIdc + 1 : 0; // увеличиваем значение ID на 1

    //  setTCardCurrentValue({ ...tCardCurrentValue, maxIdc: currentId }); // обновляем состояние карты
    //  // обновляем состояние карты в redux
    //  const cardIndex = tCards.findIndex(card => card.id === tCardCurrentValue.id);
    //  if (cardIndex >= 0) {
    //    const updatedCards = [...tCards];
    //    updatedCards[cardIndex] = { ...updatedCards[cardIndex], maxIdc: currentId };
    //    // диспатчим экшен, который заменит массив tCards в Redux
    //    dispatch(setTCards(updatedCards));
    //  }
    // // dispatch(setTCardCurrentMaxIdc(currentId))
    return currentId;  // Возвращаем новый уникальный ID    
  };

  const updateIdc = (currentId: number) => {
    // setTCardCurrentValue({ ...tCardCurrentValue, maxIdc: currentId }); // обновляем состояние карты
    // обновляем состояние карты в redux

    // const cardIndex = tCards.findIndex(card => card.id === tCardCurrentValue.id);
    // if (cardIndex >= 0) {
    const updatedCards = [...tCards];
    updatedCards[tCardIndex] = { ...updatedCards[tCardIndex], maxIdc: currentId };
    // диспатчим экшен, который заменит массив tCards в Redux
    dispatch(setTCards(updatedCards));
    // }
    // dispatch(setTCardCurrentMaxIdc(currentId))
    return currentId;  // Возвращаем новый уникальный ID    
  };

  // ПЕРЕТАСКИВАНИЕ
  //  handleMouseDown — обработчик события, который вызывается при нажатии кнопки мыши на элементе:
  // Срабатывает, когда пользователь начинает перетаскивание.
  // В нем вызывается функция setIsDragging(true), которая устанавливает состояние, что элемент в данный момент перетаскивается.
  const handleMouseDown = (code: string) => {
    // копируем элемент и его уэже тащим
    setIsDragging(true);

    // игнорируем выделение красным если тащим операцию в другую стадию
    if (code.includes("T")) {
      return;
    }

    let idcProduct = NaN;
    let prodLine = undefined;
    if (code.includes("P") || code.includes("W") || code.includes("M")) {
      const regex = /^([PWDM])(\d+)/; // Регулярное выражение для извлечения компонентов
      const match = code.match(regex);
      const prefix = (match) ? match[1] : "";
      const indexProduct = (match) ? parseInt(match[2], 10) : NaN;


      if (prefix === "P" && tCards[tCardIndex].tCardProducts) {
        prodLine = tCards[tCardIndex].tCardProducts[indexProduct];
      }

      if (prefix === "W" && tCards[tCardIndex].tCardWastes) {
        prodLine = tCards[tCardIndex].tCardWastes[indexProduct];
      }

      if (prefix === "M" && tCards[tCardIndex].tCardMaterials) {
        prodLine = tCards[tCardIndex].tCardMaterials[indexProduct];
      }
    }


    if (code.includes("A")) {
      const regex = /^([A])(\d+)([IO])(\d+)/; // Регулярное выражение для извлечения компонентов
      const match = code.match(regex);
      const idcOper = (match) ? parseInt(match[2], 10) : NaN;
      const indexProduct = (match) ? parseInt(match[4], 10) : NaN;
      const type = (match) ? match[3] : "";  // Вход (I) или выход (O)

      // Находим операцию по idc
      const oper = tCards[tCardIndex]?.tCardOperations?.find(oper => oper.idc === idcOper);

      if (oper) {

        if (type === "I") {
          // Если это входная операция, ищем в inn
          prodLine = oper.inn[indexProduct];
        } else if (type === "O") {
          // Если это выходная операция, ищем в out
          prodLine = oper.out[indexProduct];
        }
      }
    }
    if (prodLine) idcProduct = prodLine.idc

    setLightProduct(idcProduct);
  }

  // handleDrop — обработчик события сброса перетаскиваемого элемента:
  // Срабатывает, когда пользователь отпускает элемент на другом месте.
  // e.preventDefault() используется для того, чтобы предотвратить стандартное поведение браузера (например, попытку открыть перетаскиваемый элемент в новом окне).
  // Функция setDroppedOn(target) устанавливает состояние droppedOn на тот элемент, на который был сброшен перетаскиваемый элемент.
  // console.log() выводит в консоль информацию о том, на какой элемент был сброшен объект.
  // ПЕРЕТАСКИВАНИЕ КАРТЫ НА ПОЛЕ
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: string) => {
    e.stopPropagation()
    e.preventDefault(); // Предотвращаем стандартное поведение
    // currentDraggingElement 
    //  Используем индекс поскольку id мохет быть много      
    // может быть вида P1,W1,M1-  цифра это индекс в списке
    // или A + опер.idc + O + индекс в списке
    // или A + опер.idc + I + индекс в списке


    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    const tCardProducts = tCards[tCardIndex].tCardProducts ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];
    const tCardWastes = tCards[tCardIndex].tCardWastes ? tCards[tCardIndex].tCardWastes : [] as TCardProductItem[];
    const tStages = tCards[tCardIndex].tCardStages ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];

    let updatedProducts = [...tCardProducts];
    let updatedOperations = [...tCardOperations];
    let updatedWastes = [...tCardWastes];

    // T-Это idc операции     S - это idc стадии
    // Это перетаскитвание операции в стадию (в конец)
    if (currentDraggingElement.includes("T") && target.includes("S") && !target.includes("T")) {
      const operIdc = Number(currentDraggingElement.replace("T", ""));
      const stageIdc = Number(target.replace("S", ""));
      const operIndex = updatedOperations.findIndex(op => op.idc === operIdc);
      const stageTarget = tStages.find(st => st.idc === stageIdc);

      if (operIndex < 0 || !stageTarget) return
      updatedOperations.splice(operIndex, 1, { ...updatedOperations[operIndex], stage: stageTarget })
    }

    // Это перетаскитвание операции в стадию перед определенной картой
    if (currentDraggingElement.includes("T") && target.includes("S") && target.includes("T")) {

      // операция что тащим
      const operIdc = Number(currentDraggingElement.replace("T", ""));
      const operDraging = updatedOperations.find(op => op.idc === operIdc);
      // формируем массив без нашей таскаемой операции
      let updatedOperationsWithoutDraging = updatedOperations
        .filter(op => op.idc !== operIdc)
        .sort((a, b) => a.order - b.order); // по возрастанию порядка

      // Ищем куда тащим
      const regexto = /^([S])(\d+)([T])(\d+)$/;
      const matchFrom = target.match(regexto);
      const idcStageTo = (matchFrom) ? parseInt(matchFrom[2], 10) : NaN;
      const idcOperTo = (matchFrom) ? parseInt(matchFrom[4], 10) : NaN; // после этой операции
      // и куда потом вставляем
      const stageTarget = tStages.find(st => st.idc === idcStageTo);
      const targetOperIndex = updatedOperationsWithoutDraging.findIndex(op => op.idc === idcOperTo);

      // Если целевая стадия и операция после которой не найдена или операция которую тащим не найдена, прерываем
      if (!stageTarget || !operDraging || targetOperIndex < 0) return;

      // Вставляем перетаскиваемую операцию перед целевой операцией в новой стадии
      updatedOperationsWithoutDraging.splice(targetOperIndex, 0, { ...operDraging, stage: stageTarget })

      // Пересчитываем порядок в соответствике с сортировкой
      updatedOperations = updatedOperationsWithoutDraging.map((op, index) => { return { ...op, order: index + 1 } })

    }


    if (currentDraggingElement.includes("P") && target === "W") {
      const indexProduct = Number(currentDraggingElement.replace("P", ""));
      updatedProducts.splice(indexProduct, 1)

      // всеравго обновится автоматически при реконсиляции
      const productToMove = tCardProducts[indexProduct];
      if (productToMove) updatedWastes = [...tCardWastes, productToMove];
    }

    if (currentDraggingElement.includes("P") && target === "M") {
      // из продуктов в материалы - ничего не делаем это не имеет смысла
    }

    if (currentDraggingElement.includes("W") && target === "P") {
      const indexWaste = Number(currentDraggingElement.replace("W", ""));
      const productToMove = tCardWastes[indexWaste];

      if (productToMove) updatedProducts = [...tCardProducts, productToMove];
    }

    if (currentDraggingElement.includes("M") && target === "P") {
      // из материала в продукт - ничего не делаем такое невозможно
    }

    // продукт  кидаем в выход операции продукт результат операции
    if (currentDraggingElement.includes("P") && target.includes("A")) {
      const indexProduct = Number(currentDraggingElement.replace("P", ""));

      const regex = /^([A])(\d+)([IO])$/; // Регулярное выражение для извлечения компонентов
      const match = target.match(regex);
      const idOper = (match) ? parseInt(match[2], 10) : NaN;
      // const type =(match)? match[3]:"";  // Вход (I) или выход (O)

      let product = tCardProducts[indexProduct]
      // продукт перемещаем только как результат операции
      let code = `A${idOper}O${product.idc}`;
      let productToUpdate = { ...product, codeS: code } as TCardProductItem;

      // ищем операцию и вставляем в выход
      updatedOperations = tCardOperations.map((oper) => {
        if (oper.idc === idOper) {
          let outUpdated = [...oper.out, productToUpdate]
          // добавим предмет на выходе
          return { ...oper, out: outUpdated };
        }
        return oper; // Если id не совпадает, оставляем элемент без изменений
      })
    }


    if (currentDraggingElement.includes("I") && target.includes("O")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      const regexFrom = /^([A])(\d+)([IO])(\d+)$/;

      const matchFrom = currentDraggingElement.match(regexFrom);
      const idcOperFrom = (matchFrom) ? parseInt(matchFrom[2], 10) : NaN;
      const indexProductFrom = (matchFrom) ? parseInt(matchFrom[4], 10) : NaN;

      const regexTo = /^([A])(\d+)([IO])$/;
      const matchTo = target.match(regexTo);
      const idcOperTo = (matchTo) ? parseInt(matchTo[2], 10) : NaN;

      // код источник в продукте и код результат в операции
      let operFrom = tCardOperations.find(oper => oper.idc === idcOperFrom)
      let product = operFrom?.inn[indexProductFrom]
      if (!product) return;

      let code = `A${idcOperTo}O${product.idc}`;
      // let productToUpdate = { ...product, codeS: code, qtu: 0 } as TCardProductItem;
      let productToUpdate = { ...product, codeS: code } as TCardProductItem;

      // обновляем операции
      updatedOperations = tCardOperations.map((oper) => {

        // выход
        if (oper.idc === idcOperTo) {
          // добавим предмет на выходе
          let outUpdated = [...oper.out, productToUpdate]
          return { ...oper, out: outUpdated };
        }
        // вход
        if (oper.idc === idcOperFrom) {
          // заменим codeS предмета на входе
          let innUpdated = [...oper.inn];
          innUpdated.splice(indexProductFrom, 1, productToUpdate)
          return { ...oper, inn: innUpdated };
        }
        return oper; // Если id не совпадает, оставляем элемент без изменений
      })
    }

    // из выхода на вход
    if (currentDraggingElement.includes("O") && target.includes("I")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      const regexFrom = /^([A])(\d+)([IO])(\d+)$/; // Регулярное выражение для извлечения компонентов

      const matchFrom = currentDraggingElement.match(regexFrom);
      const idcOperFrom = (matchFrom) ? parseInt(matchFrom[2], 10) : NaN;
      const indexProductFrom = (matchFrom) ? parseInt(matchFrom[4], 10) : NaN;

      const regexTo = /^([A])(\d+)([IO])$/; // Регулярное выражение для извлечения компонентов
      const matchTo = target.match(regexTo);
      const idcOperTo = (matchTo) ? parseInt(matchTo[2], 10) : NaN;

      // код источник в продукте и код результат в операции
      let operFrom = tCardOperations.find(oper => oper.idc === idcOperFrom)
      let product = operFrom?.out[indexProductFrom]
      if (!product) return;

      let code = `A${idcOperFrom}O${product.idc}`;
      let productToUpdate = { ...product, codeS: code, qtu: 0 } as TCardProductItem;

      // // обновляем операции
      updatedOperations = tCardOperations.map((oper) => {

        // вход
        if (oper.idc === idcOperTo) {
          // добавим предмет на входе
          let innUpdated = [...oper.inn, productToUpdate]
          return { ...oper, inn: innUpdated };
        }

        return oper; // Если id не совпадает, оставляем элемент без изменений
      })

    }

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(updatedProducts, updatedOperations);

    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardProducts: tCardProductsUpdated,  // Обновляем массивы
      tCardOperations: tCardOperationsUpdated,  // Обновляем массивы
      tCardWastes: tCardWastesUpdated,  // Обновляем массивы
      tCardMaterials: tCardMaterialsUpdated,  // Обновляем массивы
      status: StatusEnum.draft,
    }

    // setTCardCurrentValue(tCard);

    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    let updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));


  };

  // handleMouseUp — обработчик события отпускания кнопки мыши:
  // Срабатывает, когда пользователь отпускает кнопку мыши, завершив перетаскивание.
  // В нем вызывается функция setIsDragging(false), которая изменяет состояние на false, указывая, что элемент больше не перетаскивается.
  const handleMouseUp = () => {
    setIsDragging(false);
    // setLightProduct(NaN);
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



  // СТАДИИ
  const addStage = async (afterStageCode: number) => {
    const tCardStages = (tCards[tCardIndex].tCardStages) ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    //  определяем id вставляемой стадии    
    let maxId = 0
    if (tCardStages.length > 0) {
      // Создаем новый объект с увеличенным кодом
      maxId = Math.max(...tCardStages.map(stage => stage.idc));
    }

    // Ищем индекс элемента с указанным кодом
    const afterIndex = tCardStages.findIndex(stage => stage.code === afterStageCode);


    // Если такой элемент найден или это добавление первого элемента, добавляем новый после него и сдвигаем последующие коды
    if (afterIndex !== -1 || afterStageCode === 0) {

      const newStage = { idc: maxId + 1, code: afterStageCode + 1 } as TCardStageItem;
      // Вставляем новый элемент после элемента с нужным кодом

      const updatedStages = [...tCardStages]
      updatedStages.splice(afterIndex + 1, 0, newStage);

      // Переприсваиваем коды у всех стадий начиная с afterIndex
      const updatedStages1 = updatedStages.map((stage, index) => {
        // Присваиваем новый код начиная с afterIndex + 1
        if (index > afterIndex) {
          return { ...stage, code: index + 1 }; // Присваиваем новый код
        }
        return stage; // Остальные остаются без изменений
      })

      // Теперь обновляем коды стадий в операциях, чтобы они соответствовали обновленным стадиям
      const updatedOperations = tCardOperations.map(operation => {
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

      // Обновляем карту в стейте и в redux
      const tCard =
      {
        ...tCards[tCardIndex],
        modified: true,
        tCardStages: updatedStages1,  // Обновляем массивы
        tCardOperations: updatedOperations,
        status: StatusEnum.draft,
      }
      // setTCardCurrentValue(tCard);
      // Обновляем состояние карты в redux
      const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
      let updatedTCards = [...tCards];
      updatedTCards.splice(indexCurrentCard, 1, tCard)

      dispatch(setTCards(updatedTCards));

    } else {
      console.error(`Stage with code ${afterStageCode} not found.`);
    }
  };

  const delStage = async (stage: TCardStageItem) => {
    // setModified(true);
    const tCardStages = (tCards[tCardIndex].tCardStages) ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];

    // Удаляем все операции стадии
    const tCardCurrentOperationsUpdated = tCardOperations.filter((tOper) => tOper.stage.idc !== stage.idc);

    // Находим индекс стадии с нужным кодом
    const stageIndex = tCardStages.findIndex(stage1 => stage1.idc === stage.idc);

    if (stageIndex !== -1) {
      // Удаляем элемент с найденным кодом
      const updatedStages = tCardStages.filter((_, index) => index !== stageIndex);

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


      // Обновляем карту в стейте и в redux
      const tCard =
      {
        ...tCards[tCardIndex],
        modified: true,
        tCardStages: finalStages,  // Обновляем массивы
        tCardOperations: updatedOperations,
        status: StatusEnum.draft,
      }
      // setTCardCurrentValue(tCard);
      // Обновляем состояние карты в redux
      // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
      let updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));


    } else {
      console.error(`Stage with code ${stage.code} not found.`);
    }
  };

  /////////////////// ТЕХ КАРТЫ

  const deleteCardHandler = async (idToRemove: number) => {
    // setModified(true);
    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number      
      const res = await fetch(`api/tcard-api?tCardId=${idToRemove}`,
        {
          method: 'delete',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json',

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
    // // удаляем содержание карты
    // dispatch(setTCardCurrent({} as TCardItem));
    // dispatch(setTCardCurrentMaxIdc(0));
    // dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    // dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    // dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    // dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    // dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));

  };
  //!!
  const saveCardHandler = async (idToSave: number) => {
    const indexCardToSave = tCards.findIndex(card => card.id === idToSave);
    if (indexCardToSave < 0) return;
    if (!tCards[indexCardToSave].modified) return;

    setSaveLoaderCard(idToSave);
    const tCard = tCards[indexCardToSave]

    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/tcard-api`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            teamId: team.id,
            userId: user.id,
            tCard: tCard,
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
          updatedTCards.splice(indexCardToSave, 1, tCard)
          dispatch(setTCards(updatedTCards));
          setMessage("Карта успешно записана");
          // setModified(false);
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setSaveLoaderCard(NaN);
  };
  //!!
  const addTCardHandler = async () => {
    // setModified(true);
    setMessage("");
    const currentDate = new Date().toLocaleDateString("en-CA"); // формат YYYY-MM-DD
    const tempId = generateUniqueId();
    let newTCard = {
      id: -tempId,
      date: currentDate,
      idc: 0,
      modified: true,
      status: StatusEnum.draft,
      maxIdc: 0,
      tCardProducts: [] as TCardProductItem[],
      tCardWastes: [] as TCardProductItem[],
      tCardOperations: [] as TCardOperationItem[],
      tCardMaterials: [] as TCardProductItem[],
      tCardStages: [] as TCardStageItem[],
      coment: "",
    } as TCardItem

    dispatch(setTCards([...tCards, newTCard]));
    setTCardIndex(tCards.length - 1); // устанавливаем индекс новой карты

  };
  //!!
  const resetCardHandler = async (idToReset: number) => {
    const indexCardToSave = tCards.findIndex(card => card.id === idToReset);
    if (indexCardToSave < 0) return;
    // если карта не модифицирована то нечего сбрасывать все идентично
    if (!tCards[indexCardToSave].modified) return;

    setResetLoaderCard(idToReset);
    const tCard = tCards[indexCardToSave]

    try {
      const res = await fetch(`api/tcard-api?tCardId=${tCard.id}`,
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
          //   Обновим текущую карту в списке
          let tCard = receivedData.tCard as TCardItem
          // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
          let updatedTCards = [...tCards];
          updatedTCards.splice(indexCardToSave, 1, { ...tCard, modified: false })
          dispatch(setTCards(updatedTCards));


          setMessage("Карта успешно прочитана");
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setResetLoaderCard(NaN);
  };
  //!!
  const selectTCardHandler = async (selectedTCard: TCardItem) => {

    dispatch(setTCardCurrentId(selectedTCard.id)); // на случай переключения страниц
    // если карта не сохраненная вытаскиваем из нашего списка
    const indexCurrentCard = tCards.findIndex(card => card.id === selectedTCard.id);

    setTCardIndex(indexCurrentCard); // устанавливаем индекс новой карты

    if (selectedTCard.modified || selectedTCard.tCardProducts !== undefined) {

      return
    }

    setResetLoaderCard(selectedTCard.id)
    // а если карта не была ранее подгружена, то вытаскиваем из базы
    try {
      const res = await fetch(`api/tcard-api?tCardId=${selectedTCard.id}`,
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
          //   Обновим текущую карту в списке
          let tCard = receivedData.tCard as TCardItem
          // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
          let updatedTCards = [...tCards];
          updatedTCards.splice(indexCurrentCard, 1, { ...tCard, modified: false })
          dispatch(setTCards(updatedTCards));

          setMessage("Карта успешно прочитана из базы");
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    // setSelectLoaderCard(NaN);
    setResetLoaderCard(NaN)
  };
  // Устанавливает maxIdc для текущей карты в списке

  const setMaxIdc = (maxIdc: number) => {
    const updatedTCards = [...tCards];

    updatedTCards[tCardIndex] = { ...updatedTCards[tCardIndex], maxIdc: maxIdc, };
    dispatch(setTCards(updatedTCards));
  }

  //   НЕПРАВИЛЬНО РАБОТАЕТустанавливает что карта была модифицирована и ее надо сохранить
  const setCartEdited = () => {
    // const indexCurrentCard = tCards.findIndex(card => card.id === tCardCurrentValue.id);

    // let updatedTCards = [...tCards];
    // updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], modified: true })
    // dispatch(setTCards(updatedTCards));
    // setTCardCurrentValue({ ...tCardCurrentValue, modified: true })
    // // dispatch(setTCardCurrent({ ...tCardCurrent, active: true }))
  }

  const setCartPrepared = async () => {
    // let tCardCurrentOperations_ = tCardCurrentOperations.map(oper => {
    //   if (oper.status === StatusEnum.draft)
    //     return { ...oper, status: StatusEnum.prepared }
    //   else return oper
    // })
    // dispatch(setTCardCurrentOperations(tCardCurrentOperations_));

    // dispatch(setTCardCurrent({ ...tCardCurrent, status: StatusEnum.prepared, modified: true }))

    // // нужно обновить в списке карт 
    // const idCurrentCard = tCardCurrent.id;
    // const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);
    // let updatedTCards = [...tCards];
    // updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], status: StatusEnum.prepared, modified: true })
    // dispatch(setTCards(updatedTCards));

  }

  ///////////////ЗАГРУЗКА КАРТЫ ИЗ ФАЙЛА
  const onCardUpload = (tCard: TCardItem) => {

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(
      tCard.tCardProducts ? tCard.tCardProducts : [] as TCardProductItem[],
      tCard.tCardOperations ? tCard.tCardOperations : [] as TCardOperationItem[]);

    const tCard_ =
    {
      ...tCard,
      modified: true,
      tCardProducts: tCardProductsUpdated,  // Обновляем массивы
      tCardOperations: tCardOperationsUpdated,  // Обновляем массивы
      tCardWastes: tCardWastesUpdated,  // Обновляем массивы
      tCardMaterials: tCardMaterialsUpdated,  // Обновляем массивы
      status: StatusEnum.draft,
    }

    dispatch(setTCards([...tCards, tCard_]));

  }
  ///////////////ВЫГРУЗКА КАРТЫ В ФАЙЛ
  const upLoadtCard = (tCard: TCardItem) => {
    const fileName = `${tCard.idc.toString().padStart(4, '0')}-${tCard.date}.json`; // Formatting the filename

    // Prepare data to export
    const exportData = {
      date: tCard.date,
      idc: tCard.idc,
      tCardProducts: tCard.tCardProducts?.map(product => ({
        idc: product.idc,
        codeS: product.codeS,
        title: product.title,
        qtu: product.qtu,
        uom: {
          title: product.uom.title,
          code: product.uom.code
        }
      })) || [],
      tCardWastes: tCard.tCardWastes?.map(waste => ({
        idc: waste.idc,
        codeS: waste.codeS,
        title: waste.title,
        qtu: waste.qtu,
        uom: {
          title: waste.uom.title,
          code: waste.uom.code
        }
      })) || [],
      tCardOperations: tCard.tCardOperations?.map(operation => ({
        idc: operation.idc,
        stage: operation.stage ? {
          idc: operation.stage.idc,
          code: operation.stage.code
        } : undefined,
        out: operation.out?.map(outItem => ({
          idc: outItem.idc,
          codeS: outItem.codeS,
          title: outItem.title,
          qtu: outItem.qtu,
          uom: {
            title: outItem.uom.title,
            code: outItem.uom.code
          }
        })) || [],
        inn: operation.inn?.map(innItem => ({
          idc: innItem.idc,
          codeS: innItem.codeS,
          title: innItem.title,
          qtu: innItem.qtu,
          uom: {
            title: innItem.uom.title,
            code: innItem.uom.code
          }
        })) || [],
        action: operation.action ? {
          code: operation.action.code,
          title: operation.action.title
        } : undefined,
        duration: operation.duration,
        status: operation.status,
        coment: operation.coment
      })) || [],
      tCardStages: tCard.tCardStages?.map(stage => ({
        idc: stage.idc,
        code: stage.code
      })) || [],
      maxIdc: tCard.maxIdc,
      coment: tCard.coment,
      status: tCard.status
    };

    // Convert data to JSON
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });

    // Also, you can save it to the system default download folder by triggering the download process
    const link = document.createElement('a');
    link.href = URL.createObjectURL(jsonBlob);
    link.download = fileName;
    link.click();
  };

  ////////////////// ПРОДУКЦИЯ
  // !!


  const saveProductsHandler = (tProductsValue: TCardProductItem[]) => {
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tProductsValue, tCardOperations);

    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardProducts: tCardProductsUpdated,  // Обновляем массивы
      tCardOperations: tCardOperationsUpdated,  // Обновляем массивы
      tCardWastes: tCardWastesUpdated,  // Обновляем массивы
      tCardMaterials: tCardMaterialsUpdated,  // Обновляем массивы
      status: StatusEnum.draft,
    }

    // setTCardCurrentValue(tCard);

    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    let updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));

  };

  //////////////////ОПЕРАЦИИ
  // колбеки кнопки
  //!!
  const deleteOperHandler = (idToRemove: number) => {
    // setModified(true);
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    const tCardProducts = tCards[tCardIndex].tCardProducts ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];
    // if (!tCardCurrentValue.tCardOperations) return;

    // let tCardProducts = tCardCurrentValue.tCardProducts;
    // if (!tCardProducts) tCardProducts = [] as TCardProductItem[];

    const tCardOperationsFiltered = tCardOperations.filter(tOper => tOper.idc !== idToRemove);

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardProducts, tCardOperationsFiltered);

    // setTCardCurrentOperationsValue(tCardOperationsUpdated);
    // setTCardCurrentWastesValue(tCardWastesUpdated);
    // setTCardCurrentMaterialsValue(tCardMaterialsUpdated);
    // setTCardCurrentProductsValue(tCardProductsUpdated);

    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardProducts: tCardProductsUpdated,  // Обновляем массивы
      tCardOperations: tCardOperationsUpdated,  // Обновляем массивы
      tCardWastes: tCardWastesUpdated,  // Обновляем массивы
      tCardMaterials: tCardMaterialsUpdated,  // Обновляем массивы
      status: StatusEnum.draft,
    }

    // setTCardCurrentValue(tCard);

    const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    let updatedTCards = [...tCards];
    updatedTCards.splice(indexCurrentCard, 1, tCard)

    dispatch(setTCards(updatedTCards));


  };

  const cancelOperHandler = (idToCancel: number) => {
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    // setModified(false);
    const tOperToUpdate = tCardOperations.find(tOper => tOper.idc === idToCancel);
    if (tOperToUpdate) {
      const updatedOper = { ...tOperToUpdate, mode: false }
      // Обновляем в исходном массиве
      const tCardOperationsUpdated = tCardOperations.map(oper => oper.idc === idToCancel ? updatedOper : oper);
      // Обновляем карту в  redux
      const tCard =
      {
        ...tCards[tCardIndex],
        tCardOperations: tCardOperationsUpdated,
      }
      let updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));
    };

  };

  const saveOperHandler = (
    idTosave: number,
    inn: TCardProductItem[],
    out: TCardProductItem[],
    action: ActionItem | null,
    coment: string,
    duration: number) => {
    // setModified(true);
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    const tCardProducts = tCards[tCardIndex].tCardProducts ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];

    // костыль обход null тип
    let action1 = action ? action : {} as ActionItem;

    const tOperToUpdate = tCardOperations.find(tOper => tOper.idc === idTosave);

    if (tOperToUpdate) {
      const updatedOper = {
        ...tOperToUpdate,
        inn: [...inn],
        out: [...out],
        action: { ...action1 },
        coment: coment,
        duration: duration,
        mode: !tOperToUpdate.mode,
        status: StatusEnum.draft
      }

      // Обновляем в исходном массиве
      const tCardOperationsUpdated1 = tCardOperations.map(oper => oper.idc === idTosave ? updatedOper : oper);

      // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
      const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardProducts, tCardOperationsUpdated1);

      // Обновляем карту в  redux
      const tCard =
      {
        ...tCards[tCardIndex],
        modified: true,
        tCardOperations: tCardOperationsUpdated,
        tCardWastes: tCardWastesUpdated,
        tCardMaterials: tCardMaterialsUpdated,
        tCardProducts: tCardProductsUpdated,
        status: StatusEnum.draft

      }
      let updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));
    };
  };

  const setOperStatus = (idc: number, status: StatusEnum) => {
    // setModified(true);
    // const tCardCurrentOperations_ = tCardCurrentOperations.map(tOper => {
    //   if (tOper.idc === idc) {
    //     return { ...tOper, status: status };
    //   }
    //   return tOper;
    // });

    // dispatch(setTCardCurrentOperations(tCardCurrentOperations_))
    // //  прроверим статус карты
    // const allNonDraft = tCardCurrentOperations_.every(tOper => tOper.status !== StatusEnum.draft);

    // if (!allNonDraft) return

    // // обновляем статус если все операции подготовлены
    // dispatch(setTCardCurrent({ ...tCardCurrent, status: StatusEnum.prepared, modified: true }))
    // // нужно обновить в списке карт 
    // const idCurrentCard = tCardCurrent.id;
    // const indexCurrentCard = tCards.findIndex(card => card.id === idCurrentCard);
    // let updatedTCards = [...tCards];
    // updatedTCards.splice(indexCurrentCard, 1, { ...tCards[indexCurrentCard], status: StatusEnum.prepared, modified: true })
    // dispatch(setTCards(updatedTCards));
  };

  const editOperHandler = (idc: number) => {
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];

    // setModified(true);
    const tCardOperationsUpdated = tCardOperations.map(tOper => {
      if (tOper.idc === idc) {
        return { ...tOper, mode: !tOper.mode };
      }
      return tOper;
    });

    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardOperations: tCardOperationsUpdated,
      status: StatusEnum.draft,
    }
    // setTCardCurrentValue(tCard);
    // Обновляем состояние карты в redux
    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    let updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));

    // setTCardCurrentOperationsValue(tCardOperationsUpdated)
  };

  const addOperHandler = (tStage: TCardStageItem) => {
    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    // setModified(true);
    // console.log(tStage);    
    let newid = tCards[tCardIndex].maxIdc + 1;
    let newOper = {
      idc: newid,
      stage: tStage,
      inn: [] as TCardProductItem[],
      out: [] as TCardProductItem[],
      action: {} as ActionItem,
      duration: 0,
      status: StatusEnum.draft,
    } as TCardOperationItem;

    // dispatch(setTCardCurrentOperations([...tCardCurrentOperationsValue, newOper]))
    const updatedOperations = [...tCardOperations, newOper];

    // Обновляем операции в состоянии  
    // setTCardCurrentOperationsValue(updatedOperations);

    // Обновляем карту в стейте и в redux
    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardOperations: updatedOperations,
      status: StatusEnum.draft,
      maxIdc: newid,
    }
    // setTCardCurrentValue(tCard);
    // Обновляем состояние карты в redux
    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    let updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)
    dispatch(setTCards(updatedTCards));

  };

  //  реакт узлы

  const tCardStages = (tCards[tCardIndex] && tCards[tCardIndex].tCardStages) ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];
  const tCardOperations = (tCards[tCardIndex] && tCards[tCardIndex].tCardOperations) ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
  const tCardProducts = (tCards[tCardIndex] && tCards[tCardIndex].tCardProducts) ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];
  const tCardWastes = (tCards[tCardIndex] && tCards[tCardIndex].tCardWastes) ? tCards[tCardIndex].tCardWastes : [] as TCardProductItem[];
  const tCardMaterials = (tCards[tCardIndex] && tCards[tCardIndex].tCardMaterials) ? tCards[tCardIndex].tCardMaterials : [] as TCardProductItem[];


  let tCardStagesReactNodes = tCardStages.map((tStage) => {
    //  получили операции стадии
    let operations = tCardOperations.filter(tOper => (tOper.stage.idc === tStage.idc))
      .sort((a, b) => a.order - b.order);

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
          lightProduct={lightProduct}
        />}

        {tCardOperation.mode && <TCardOperNew
          key={index1}
          tCardOperation={tCardOperation}
          // idc={tCardOperation.idc}
          // inn={tCardOperation.inn}
          // out={tCardOperation.out}
          // action={tCardOperation.action}
          // duration={tCardOperation.duration}
          deleteOperHandler={deleteOperHandler}
          cancelOperHandler={cancelOperHandler}
          saveOperHandler={saveOperHandler}
          updateIdc={updateIdc}
          setCartEdited={setCartEdited}
          maxIdc={tCards[tCardIndex].maxIdc}
        />}
      </>)
    }
    )

    return (
      <div key={tStage.idc} className="container_stage"
        onDragOver={(e) => dragOverHandler(e)}
        onDrop={(e) => { handleDrop(e, `S${tStage.idc}`) }}
      >
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
        <button className="button1" onClick={() => addOperHandler(tStage)}> добавить </button>
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
        <div className="container_icon_edit_save">
          {resetLoaderCard === elem.id && <ButtonLoader />}
          {resetLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={reset}
              alt="arrow" width={20} height={20}
              onClick={() => { resetCardHandler(elem.id) }}
            />}
          &nbsp; &nbsp;
          <StatusCircle status={elem.status} />
        </div>


        <div className={`${tCards && tCards[tCardIndex] && elem.id === tCards[tCardIndex].id ? "title_card_edit" : "title_card"}`}
          onClick={() => selectTCardHandler(elem)}>
          &nbsp; {padNumberToFourDigits(elem.idc)} - {date}
        </div>

        <div className="container_icon_edit_save">
          {saveLoaderCard === elem.id && <ButtonLoader />}
          {saveLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={save}
              alt="arrow" width={20} height={20}
              onClick={() => { saveCardHandler(elem.id) }}
            />}
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
            <div className="container_cards_title">технологические карты</div>
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
          <FileUploadButton
            onCardUpload={onCardUpload}
            uoms={uoms}
            actions={actions}
          />

        </div>
        {(tCards[tCardIndex]?.id) && <div className="container_global_right card_container_right">

          <div className={`container_card_menu`}>
            <div className={`container_status`}>
              status: {tCards[tCardIndex].status} &nbsp;&nbsp;<StatusCircle status={tCards[tCardIndex].status} />
              {(tCards[tCardIndex].status === StatusEnum.draft)
                && <button
                  className={`button_prepared`}
                  onClick={setCartPrepared}>
                  отправить на планирование
                </button>}
            </div>
            <div className={`container_card_download`}>
              <button
                className={`button_prepared`}
                onClick={() => upLoadtCard(tCards[tCardIndex])}>
                сохранить как шаблон
              </button>
              <button
                className={`button_prepared`}
                onClick={() => upLoadtCard(tCards[tCardIndex])}>
                выгрузить карту
              </button>
            </div>
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
                tCardProducts={tCardProducts}
                tCardOperations={tCardOperations}
                saveProductsHandler={saveProductsHandler}
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
                updateIdc={updateIdc}
                setCartEdited={setCartEdited}
                maxIdc={tCards[tCardIndex].maxIdc}
                setMaxIdc={setMaxIdc}
                lightProduct={lightProduct}
              />
              {/* Отходы */}
              <div className="container_stage_title">
                Отходы
              </div>
              <TCardProducts
                tCardProducts={tCardWastes}
                tCardOperations={tCardOperations}
                saveProductsHandler={saveProductsHandler}
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
                updateIdc={updateIdc}
                setCartEdited={setCartEdited}
                maxIdc={tCards[tCardIndex].maxIdc}
                setMaxIdc={setMaxIdc}
                lightProduct={lightProduct}
              />
            </div>
            {/* Обработка */}
            {tCardStagesReactNodes}
            {tCardMaterials.length > 0 &&
              <div className="container_products">
                <div className="container_stage_title">
                  Склад
                </div>
                <TCardProducts
                  tCardProducts={tCardMaterials}
                  saveProductsHandler={saveProductsHandler}
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
                  updateIdc={updateIdc}
                  setCartEdited={setCartEdited}
                  maxIdc={tCards[tCardIndex].maxIdc}
                  setMaxIdc={setMaxIdc}
                  lightProduct={lightProduct}
                />
              </div>}
          </div >
        </div >
        }
      </div >
    </Layout >
  )
}

