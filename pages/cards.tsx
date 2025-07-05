import Layout from "@/components/Layout/layout";
import TCardOper from "@/components/cards/TCardOper/tCardOper";
import TCardOperNew from "@/components/cards/TCardOperNew/tCardOperNew";
import TCardProducts from "@/components/cards/TCardProducts/tCardProducts";
import TCardComent from "@/components/cards/TCardComent/tCardComent";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import FileUploadButton from "@/components/cards/FileUploadButton/fileUploadButton";

import { formatDate, padNumberToFourDigits, generateUniqueId, calculateMaxIdc } from "@/lib/utils"
import { useEffect, useState  } from "react";


import { deleteTCardById } from '@/services/cards/deleteTCardById';
import { saveTCardById } from '@/services/cards/saveTCardById';
import { resetTCardById } from '@/services/cards/resetTCardById';
import { selectTCardById } from '@/services/cards/selectTCardById';

import { saveTemplate } from '@/services/templates/saveTemplate';


import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { useRouter } from 'next/navigation';

import { useTranslation } from 'react-i18next';

import { } from '@/store/slices';
import {
  ProductContent,
  OperationContent,
  TCardContent,
  TCardProductItem,
  ActionItem,
  TCardOperationItem,
  TCardItem,
  TCardStageItem,
  StatusEnum,
 
} from "@/types/types";
import { checkReconcilation } from "@/lib/cardsHandlers";

import { setTCards, setTCardIndex, setTemplates, setUnitLoads } from '@/store/slices'

import delL from "@/public/del222-rem.png";
import delD from "@/public/del2-rem.png";
import save from "@/public/save-rem.png";
import add from "@/public/add222-rem.png";
import reset from "@/public/cancel.png";


export default function Cards() {
  const { t, i18n } = useTranslation();
  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentDraggingElement, setCurrentDraggingElement] = useState("");


  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [saveLoaderCard, setSaveLoaderCard] = useState(NaN); // состояние это id категории  
  const [removeLoaderCard, setRemoveLoaderCard] = useState(NaN); // состояние это id категории  

  const [resetLoaderCard, setResetLoaderCard] = useState(NaN); // состояние это id категории   
  const [lightProduct, setLightProduct] = useState(NaN); // idc  продукта который мы выделяем   
  const [saveTemplateLoaderCard, setSaveTemplateLoaderCard] = useState(false); // состояние сохранения шаблона


  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })

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

  const templates = useSelector((state: RootState) => {
    return state.dataSlice.templates;
  })
  const unitLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })



  // Начальный загруз
  useEffect(() => {
    if (tCards?.length > 0) selectTCardHandler(tCards[tCardIndex]);
  }, []);

  //  просто сохраню текущий id карты
  const tCardIndex = useSelector((state: RootState) => {
    return state.dataSlice.tCardIndex;
  })

  const readonlyCardStatuses = [StatusEnum.closed, StatusEnum.cancelled, StatusEnum.performed, StatusEnum.ready]

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
  // На клиенте
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

      // Вычисляю подсветку
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

  // На клиенте
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

    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем


    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    const tCardProducts = tCards[tCardIndex].tCardProducts ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];
    const tCardWastes = tCards[tCardIndex].tCardWastes ? tCards[tCardIndex].tCardWastes : [] as TCardProductItem[];
    const tStages = tCards[tCardIndex].tCardStages ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];

    let updatedProducts = [...tCardProducts];
    let updatedOperations = [...tCardOperations];
    let updatedWastes = [...tCardWastes];
    let newStatus = StatusEnum.draft;
    // T-Это idc операции     S - это idc стадии
    // Это перетаскитвание операции в стадию (в конец)
    if (currentDraggingElement.includes("T") && target.includes("S") && !target.includes("T")) {
      const operIdc = Number(currentDraggingElement.replace("T", ""));
      const stageIdc = Number(target.replace("S", ""));
      const operIndex = updatedOperations.findIndex(op => op.idc === operIdc);
      const stageTarget = tStages.find(st => st.idc === stageIdc);

      if (operIndex < 0 || !stageTarget) return
      updatedOperations.splice(operIndex, 1, { ...updatedOperations[operIndex], stage: stageTarget })

      newStatus = tCards[tCardIndex].status;

    }

    // Это перетаскитвание операции в стадию перед определенной картой
    if (currentDraggingElement.includes("T") && target.includes("S") && target.includes("T")) {

      // операция что тащим
      const operIdc = Number(currentDraggingElement.replace("T", ""));
      const operDraging = updatedOperations.find(op => op.idc === operIdc);
      // формируем массив без нашей таскаемой операции
      const updatedOperationsWithoutDraging = updatedOperations
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
      // статус не меняем при визуальном перетаскивании.
      newStatus = tCards[tCardIndex].status;
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

      const product = tCardProducts[indexProduct]
      // продукт перемещаем только как результат операции
      const code = `A${idOper}O${product.idc}`;
      const productToUpdate = { ...product, code: code } as TCardProductItem;

      // ищем операцию и вставляем в выход
      updatedOperations = tCardOperations.map((oper) => {
        if (oper.idc === idOper) {
          const outUpdated = [...oper.out, productToUpdate]
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
      const operFrom = tCardOperations.find(oper => oper.idc === idcOperFrom)
      const product = operFrom?.inn[indexProductFrom]
      if (!product) return;

      const code = `A${idcOperTo}O${product.idc}`;

      const productToUpdate = { ...product, code: code } as TCardProductItem;

      // обновляем операции
      updatedOperations = tCardOperations.map((oper) => {

        // выход
        if (oper.idc === idcOperTo) {
          // добавим предмет на выходе
          const outUpdated = [...oper.out, productToUpdate]
          return { ...oper, out: outUpdated };
        }
        // вход
        if (oper.idc === idcOperFrom) {
          // заменим code предмета на входе
          const innUpdated = [...oper.inn];
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
      const operFrom = tCardOperations.find(oper => oper.idc === idcOperFrom)
      const product = operFrom?.out[indexProductFrom]
      if (!product) return;

      const code = `A${idcOperFrom}O${product.idc}`;
      const productToUpdate = { ...product, code: code, qtu: 0 } as TCardProductItem;

      // // обновляем операции
      updatedOperations = tCardOperations.map((oper) => {

        // вход
        if (oper.idc === idcOperTo) {
          // добавим предмет на входе
          const innUpdated = [...oper.inn, productToUpdate]
          return { ...oper, inn: innUpdated };
        }

        return oper; // Если id не совпадает, оставляем элемент без изменений
      })

    }

    // если просто копируем источники из одной операции в другую
    if (currentDraggingElement.includes("I") && target.includes("I")) {
      //  получаем в источнике строку с индексом поскольку id мохет быть много      
      const regexFrom = /^([A])(\d+)([IO])(\d+)$/;

      const matchFrom = currentDraggingElement.match(regexFrom);
      const idcOperFrom = (matchFrom) ? parseInt(matchFrom[2], 10) : NaN;
      const indexProductFrom = (matchFrom) ? parseInt(matchFrom[4], 10) : NaN;

      const regexTo = /^([A])(\d+)([IO])$/;
      const matchTo = target.match(regexTo);
      const idcOperTo = (matchTo) ? parseInt(matchTo[2], 10) : NaN;

      // код источник в продукте и код результат в операции
      const operFrom = tCardOperations.find(oper => oper.idc === idcOperFrom)
      const product = operFrom?.inn[indexProductFrom]
      if (!product) return;

      //  продукт тот же но берем со склада
      const code = `M${product.idc}`;

      const newProduct = {
        idc: product.idc, //  id на клиенте
        code: code, //  код источника    
        title: product.title,
        qtu: product.qtu,
        uom: { ...product.uom },
      } as TCardProductItem;

      // обновляем операции
      updatedOperations = tCardOperations.map((oper) => {

        // Приемник
        if (oper.idc === idcOperTo) {
          // добавим предмет на входе
          const innUpdated = [...oper.inn, newProduct]
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
      status: newStatus,
    }

    // setTCardCurrentValue(tCard);

    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));


  };

  // На клиенте
  // handleMouseUp — обработчик события отпускания кнопки мыши:
  // Срабатывает, когда пользователь отпускает кнопку мыши, завершив перетаскивание.
  // В нем вызывается функция setIsDragging(false), которая изменяет состояние на false, указывая, что элемент больше не перетаскивается.
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // На клиенте
  // dragOverHandler — обработчик события "перетащил на элемент" (перетаскивание над целевым элементом):
  // Срабатывает, когда перетаскиваемый элемент находится над целевым элементом.
  // Внутри вызывается e.preventDefault(), чтобы разрешить сброс перетаскиваемого элемента (по умолчанию браузер не разрешает сбрасывать элементы на другие элементы).
  function dragOverHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }

  // На клиенте
  // dropHandler — обработчик события сброса элемента:
  // Этот метод также вызывается при сбросе, но в коде он не выполняет дополнительных действий, кроме вызова e.preventDefault() для предотвращения стандартного поведения.
  function dropHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }



  // СТАДИИ
  // На клиенте
  const addStage = async (afterStageCode: number) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем

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
        // status: StatusEnum.draft, //  стадия не влияет на статус
      }
      // setTCardCurrentValue(tCard);
      // Обновляем состояние карты в redux
      const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
      const updatedTCards = [...tCards];
      updatedTCards.splice(indexCurrentCard, 1, tCard)

      dispatch(setTCards(updatedTCards));

    } else {
      console.error(`Stage with code ${afterStageCode} not found.`);
    }
  };
  // На клиенте
  const delStage = async (stage: TCardStageItem) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем

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
        // status: StatusEnum.draft,//  стадия не влияет на статус
      }
      // setTCardCurrentValue(tCard);
      // Обновляем состояние карты в redux
      // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
      const updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));


    } else {
      console.error(`Stage with code ${stage.code} not found.`);
    }
  };

  /////////////////// ТЕХ КАРТЫ
  // На сервере
  const deleteCardHandler = async (idToRemove: number) => {

    setRemoveLoaderCard(idToRemove);
    const indexCardToRemote = tCards.findIndex(card => card.id === idToRemove);
    // если новая  - просто удаляем карту без id она не записана в БД
    if (tCards[indexCardToRemote]?.idc === 0) {
      const updatedTCards = [...tCards];
      updatedTCards.splice(indexCardToRemote, 1)
      dispatch(setTCards(updatedTCards));
      setRemoveLoaderCard(NaN);
      return
    }

    await deleteTCardById(idToRemove, token, tCards, unitLoads, dispatch, t, setMessage)

    setRemoveLoaderCard(NaN);

  };

  // На сервере
  const saveCardHandler = async (idToSave: number) => {
    setSaveLoaderCard(idToSave);
    await saveTCardById(idToSave, tCards, token, team, user, dispatch, t, setMessage);
    setSaveLoaderCard(NaN);
  };

  // На клиенте
  const addTCardHandler = async () => {
    // setModified(true);
    setMessage("");
    const currentDate = new Date().toLocaleDateString("en-CA"); // формат YYYY-MM-DD
    const tempId = generateUniqueId();
    const newTCard = {
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
    dispatch(setTCardIndex(tCards.length)); // устанавливаем индекс новой карты

  };

  // На сервере
  // Он сбрасывает карту в начальное состояние с сервера, если она была модифицирована.
  const resetCardHandler = async (idToReset: number) => {
    setResetLoaderCard(idToReset);
    await resetTCardById(idToReset, tCards, token, dispatch, t, setMessage)
    setResetLoaderCard(NaN);
  };
  // На сервере
  // Он подгружает карту с сервера если она не была подгружена ранее.
  const selectTCardHandler = async (selectedTCard: TCardItem) => {

    if (!selectedTCard) return // если не выбрана карта ничего не делаем

    // ищем индекс выбранной карты в списке
    const indexCurrentCard = tCards.findIndex(card => card.idc === selectedTCard.idc && card.date === selectedTCard.date);
    dispatch(setTCardIndex(indexCurrentCard)); // устанавливаем индекс новой карты    

    // если карта не сохраненная вытаскиваем из нашего списка и возвращаем  
    if (selectedTCard.modified || selectedTCard.tCardProducts !== undefined) {
      return
    }
    // если карта не была ранее подгружена, то вытаскиваем из базы
    setResetLoaderCard(selectedTCard.id)
    await selectTCardById(selectedTCard.id, indexCurrentCard, tCards, token, dispatch, t, setMessage);
    setResetLoaderCard(NaN)

  };

  // На клиенте
  // Установка коментария в карту
  const setComentTCardHandler = (coment: string) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем

    // Обновляем карту в стейте и в redux
    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      coment: coment
    }
    // Обновляем состояние карты в redux

    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)
    dispatch(setTCards(updatedTCards));
  }
  // На клиенте
  // Устанавливает maxIdc для текущей карты в списке
  const setMaxIdc = (maxIdc: number) => {
    const updatedTCards = [...tCards];

    updatedTCards[tCardIndex] = { ...updatedTCards[tCardIndex], maxIdc: maxIdc, };
    dispatch(setTCards(updatedTCards));
  }

  // На клиенте
  const setCardPrepared = async () => {
    const tCard = tCards[tCardIndex]
    const tCardCurrentOperations_ = tCard.tCardOperations?.map(oper => {
      if (oper.status === StatusEnum.draft)
        return { ...oper, status: StatusEnum.prepared }
      else return oper
    })

    // нужно обновить в списке карт     
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, { ...tCard, tCardOperations: tCardCurrentOperations_, status: StatusEnum.prepared, modified: true })

    dispatch(setTCards(updatedTCards));

  }
  // На клиенте
  const setCardClose = async () => {
    const tCard = tCards[tCardIndex]

    // нужно обновить в списке карт     
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, { ...tCard, status: StatusEnum.closed, modified: true })

    dispatch(setTCards(updatedTCards));

  }

  ///////////////ЗАГРУЗКА КАРТЫ ИЗ ФАЙЛА
  // На клиенте
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
  // На клиенте
  const upLoadtCard = (tCard: TCardItem) => {
    const fileName = `${tCard.idc.toString().padStart(4, '0')}-${tCard.date}.json`; // Formatting the filename

    // Prepare data to export
    const exportData = {
      date: tCard.date,
      idc: tCard.idc,
      tCardProducts: tCard.tCardProducts?.map(product => ({
        idc: product.idc,
        code: product.code,
        title: product.title,
        qtu: product.qtu,
        uom: {
          title: product.uom.title,
          code: product.uom.code
        }
      })) || [],
      tCardWastes: tCard.tCardWastes?.map(waste => ({
        idc: waste.idc,
        code: waste.code,
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
          code: outItem.code,
          title: outItem.title,
          qtu: outItem.qtu,
          uom: {
            title: outItem.uom.title,
            code: outItem.uom.code
          }
        })) || [],
        inn: operation.inn?.map(innItem => ({
          idc: innItem.idc,
          code: innItem.code,
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
  ///////////////Шаблоны
  // На сервере
  const saveTemplateHandler = async () => {
    setSaveTemplateLoaderCard(true);
    await saveTemplate(tCards, tCardIndex, templates, team, user, token, dispatch, t, setMessage,);
    setSaveTemplateLoaderCard(false);
  };

  // На клиенте
  const applyTemplate = (fileContent: string) => {
    // Очистка сообщения
    setMessage("");

    // Получаем текущую дату
    const currentDate = new Date().toLocaleDateString("en-CA"); // формат YYYY-MM-DD

    // Генерация временного ID
    const tempId = generateUniqueId();

    // Инициализация новой карты
    const newTCard = {
      id: -tempId,
      date: currentDate,
      idc: 0,
      modified: true,
      status: StatusEnum.draft,
      maxIdc: 0,
      tCardProducts: [] as TCardProductItem[],
      tCardWastes: [] as TCardProductItem[],
      tCardOperations: [] as TCardOperationItem[],
      tCardMaterials: [] as TCardProductItem[], // Если есть материалы, то заполняем
      tCardStages: [] as TCardStageItem[],
      coment: "",
    } as TCardItem;

    try {
      // Парсим JSON из строки fileContent
      const template = JSON.parse(fileContent);

      // Заполнение полей newTCard из template
      newTCard.coment = template.coment;

      // Заполняем tCardProducts
      if (template.tCardProducts) {
        newTCard.tCardProducts = template.tCardProducts.map((product: ProductContent) => {
          const uom = uoms.find(uom => uom.code === product.uom.code);
          return ({
            ...product,
            uom: (uom) ? uom : undefined,
          })
        });
      }

      //  временный интерфейс
      interface OperationIOItem {
        id?: number,  // id BD
        idc: number, //  id на клиенте
        code: string, //  код источника    
        title: string,
        qtu: number,
        uom: { code: string; title: string }; // ⚠️ упрощённый тип
      }

      // Заполняем tCardOperations
      if (template.tCardOperations) {
        newTCard.tCardOperations = template.tCardOperations.map((operation: OperationContent) => {
          const action = actions.find(action => action.code === operation.action.code);
          return ({
            ...operation,
            status: StatusEnum.draft,
            action: action ? action : undefined,
            out: operation.out.map((outItem: OperationIOItem) => {
              const uom = uoms.find(uom => uom.code === outItem.uom.code);
              return ({
                ...outItem,
                uom: (uom) ? uom : undefined,
              })
            }),
            inn: operation.inn.map((innItem: OperationIOItem) => {
              const uom = uoms.find(uom => uom.code === innItem.uom.code);
              return ({
                ...innItem,
                uom: (uom) ? uom : undefined,
              })
            }),
            stage: operation.stage ? { idc: operation.stage.idc, code: operation.stage.code } : undefined,
          })
        });
      }

      // Заполняем tCardStages
      if (template.tCardStages) {
        newTCard.tCardStages = template.tCardStages.map((stage: TCardStageItem) => ({
          idc: stage.idc,
          code: stage.code,
        }));
      }


      // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
      const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(newTCard.tCardProducts as TCardProductItem[], newTCard.tCardOperations as TCardOperationItem[]);


      newTCard.modified = true;
      newTCard.tCardProducts = tCardProductsUpdated;
      newTCard.tCardOperations = tCardOperationsUpdated;
      newTCard.tCardWastes = tCardWastesUpdated;
      newTCard.tCardMaterials = tCardMaterialsUpdated;
      newTCard.status = StatusEnum.draft;
      newTCard.maxIdc = calculateMaxIdc(newTCard as TCardContent); //  MaxIdc  после полного заполнения

      // Добавляем новую карту в состояние
      dispatch(setTCards([...tCards, newTCard]));
      dispatch(setTCardIndex(tCards.length)); // Устанавливаем индекс новой карты

    } catch (err) {
      console.error("Ошибка при обработке шаблона:", err);
      alert("Не удалось загрузить и обработать шаблон.");
    }
  };

  ////////////////// ПРОДУКЦИЯ
  // На клиенте
  const correctCardProducts = (editedProducts: TCardProductItem[], card: TCardItem): { editedProducts: TCardProductItem[], newIdc: number } => {


    const tCardProducts = card.tCardProducts ? card.tCardProducts : editedProducts;

    let newIdc = card.maxIdc;

    editedProducts.forEach(editedProduct => {
      const existingProduct = tCardProducts.find(product => product.code === editedProduct.code);

      if (existingProduct) {
        // Проверяем, изменился ли title или uom
        if (editedProduct.title !== existingProduct.title || editedProduct.uom.code !== existingProduct.uom.code) {
          // Увеличиваем idc для нового продукта
          newIdc = newIdc + 1;

          // Присваиваем новый idc и обновляем code
          editedProduct.idc = newIdc;
          editedProduct.code = existingProduct.code.replace(/P(\d+)/, `P${newIdc}`);
        }
      }
    });

    return { editedProducts: editedProducts, newIdc: newIdc };
  };

  // На клиенте
  const saveProductsHandler = (tProductsValue: TCardProductItem[]) => {

    const { editedProducts, newIdc } = correctCardProducts(tProductsValue, tCards[tCardIndex])

    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(editedProducts, tCardOperations);

    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      maxIdc: newIdc,
      tCardProducts: tCardProductsUpdated,  // Обновляем массивы
      tCardOperations: tCardOperationsUpdated,  // Обновляем массивы
      tCardWastes: tCardWastesUpdated,  // Обновляем массивы
      tCardMaterials: tCardMaterialsUpdated,  // Обновляем массивы
      status: StatusEnum.draft,
    }

    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));

  };

  //////////////////ОПЕРАЦИИ

  // На клиенте
  const deleteOperHandler = (idcToRemove: number) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем

    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    const tCardProducts = tCards[tCardIndex].tCardProducts ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];

    const tCardOperationsFiltered = tCardOperations.filter(tOper => tOper.idc !== idcToRemove);

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardProducts, tCardOperationsFiltered);

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
    const updatedTCards = [...tCards];
    updatedTCards.splice(indexCurrentCard, 1, tCard)

    dispatch(setTCards(updatedTCards));


  };

  // На клиенте
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
      const updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));
    };

  };


  ////////////////////////////////////////////
  // На клиенте
  // Меняет idc продукта приизменении title и UOM
  const correctCardOperations = (editedOperation: TCardOperationItem, card: TCardItem): TCardItem => {
    // Создаем копию текущей карты для дальнейшей работы
    const correctedCard = { ...card };
    const oldOper = correctedCard.tCardOperations?.find(op => op.idc === editedOperation.idc);
    if (!oldOper) { return card; }
    const oldOUT = oldOper.out;
    const oldINN = oldOper.inn;

    // для генерации нового idc
    let newIdc = card.maxIdc;

    // Обрабатываем выходные продукты из редактируемой операции
    editedOperation.out.forEach(outProduct => {
      let oldProduct = oldOUT.find(p => p.code === outProduct.code);
      oldProduct = (oldProduct) ? oldProduct : outProduct;
      // Проверяем, изменился ли какой-либо атрибут, кроме количества
      if (outProduct.title !== oldProduct.title || outProduct.uom.code !== oldProduct.uom.code) {
        newIdc = newIdc + 1;
        // Присваиваем новый idc и обновляем code
        outProduct.idc = newIdc;
        outProduct.code = outProduct.code.replace(/O(\d+)/, `O${newIdc}`);
      }
    });
    // Обрабатываем источники продукты из редактируемой операции
    editedOperation.inn.forEach(innProduct => {
      let oldProduct = oldINN.find(p => p.code === innProduct.code);
      oldProduct = (oldProduct) ? oldProduct : innProduct;
      // Проверяем, изменился ли какой-либо атрибут, кроме количества
      if (innProduct.title !== oldProduct.title || innProduct.uom.code !== oldProduct.uom.code) {
        newIdc = newIdc + 1;
        // Присваиваем новый idc и обновляем code
        innProduct.idc = newIdc;
        innProduct.code = innProduct.code.replace(/O(\d+)/, `O${newIdc}`);
      }
    });

    // Обновляем maxIdc в карте
    correctedCard.maxIdc = newIdc;

    // Возвращаем обновленную карту
    return correctedCard;
  };
  // На клиенте
  const saveOperHandler = (
    idcTosave: number,
    inn: TCardProductItem[],
    out: TCardProductItem[],
    action: ActionItem | null,
    coment: string,
    duration: number) => {

    // костыль обход null тип
    const action1 = action ? action : {} as ActionItem;

    const tOperToUpdate = tCardOperations.find(tOper => tOper.idc === idcTosave);

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

      //  скорректировали связанные по коду операции карты
      const correctedCard = correctCardOperations(updatedOper, tCards[tCardIndex]);

      const tCardOperations = correctedCard.tCardOperations ? correctedCard.tCardOperations : [] as TCardOperationItem[];
      const tCardProducts = correctedCard.tCardProducts ? correctedCard.tCardProducts : [] as TCardProductItem[];

      // Обновляем в исходном массиве
      const tCardOperationsUpdated1 = tCardOperations.map(oper => oper.idc === idcTosave ? updatedOper : oper);
      // Ищем все продукты с таким же кодом  которые на выходе из этой операции и корректируем название и единицу измерения

      // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
      const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardProducts, tCardOperationsUpdated1);

      // Обновляем карту в  redux
      const tCard =
      {
        ...correctedCard,
        modified: true,
        tCardOperations: tCardOperationsUpdated,
        tCardWastes: tCardWastesUpdated,
        tCardMaterials: tCardMaterialsUpdated,
        tCardProducts: tCardProductsUpdated,
        status: StatusEnum.draft

      }
      const updatedTCards = [...tCards];
      updatedTCards.splice(tCardIndex, 1, tCard)

      dispatch(setTCards(updatedTCards));
    };
  };
  // На клиенте
  const setOperStatus = (idc: number, status: StatusEnum) => {
    const operIndex = tCards[tCardIndex].tCardOperations?.findIndex(card => card.idc === idc);
    if (operIndex === undefined || operIndex < 0) return

    const tCard = tCards[tCardIndex]

    const tCardOperations_ = tCard.tCardOperations?.map(tOper => {
      if (tOper.idc === idc) {
        return { ...tOper, status: status };
      }
      return tOper;
    });

    //  прроверим статус карты
    const allNonDraft = tCardOperations_?.every(tOper => tOper.status !== StatusEnum.draft);
    const statusCard = (allNonDraft) ? StatusEnum.prepared : StatusEnum.draft

    // обновляем статус карты если все операции подготовлены    
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, { ...tCard, tCardOperations: tCardOperations_, status: statusCard, modified: true })

    dispatch(setTCards(updatedTCards));
  };
  // На клиенте
  const editOperHandler = (idc: number) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем


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
    // Обновляем состояние карты в redux
    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));


  };
  // На клиенте
  const addOperHandler = (tStage: TCardStageItem) => {
    // проверка на возможность редактирования    
    if (readonlyCardStatuses.includes(tCards[tCardIndex].status))
      return; // если у карты нередактируемый статус ничего не делаем

    const tCardOperations = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    // setModified(true);
    // console.log(tStage);    
    const newid = tCards[tCardIndex].maxIdc + 1;
    const newOper = {
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

    // Обновляем карту в стейте и в redux
    const tCard =
    {
      ...tCards[tCardIndex],
      modified: true,
      tCardOperations: updatedOperations,
      status: StatusEnum.draft,
      maxIdc: newid,
    }

    // Обновляем состояние карты в redux
    // const indexCurrentCard = tCards.findIndex(card => card.id === tCard.id);
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)
    dispatch(setTCards(updatedTCards));

  };
  // На клиенте
  // создает операцию на основе той которая с дефектом - копирует заменяя код операции
  const fixDefect = (idc: number) => {

    const oper = tCards[tCardIndex].tCardOperations?.find(card => card.idc === idc);
    if (!oper) return
    //  новая операция новый код
    const newid = tCards[tCardIndex].maxIdc + 1;

    // поменяем операцию в кодах и сформируем выход и выход;
    const inn = oper.inn.map(prod => {
      const code = `M${prod.idc}`;
      return {
        idc: prod.idc, //  id на клиенте
        code: code,
        title: prod.title,
        qtu: prod.qtu,
        uom: { ...prod.uom },
      } as TCardProductItem
    }
    )
    // поменяем операцию в кодах и сформируем выход и выход;
    const out = oper.out.map(prod => {
      const code = `A${newid}O${prod.idc}`;
      return {
        idc: prod.idc, //  id на клиенте
        code: code,
        title: prod.title,
        qtu: prod.qtu,
        uom: { ...prod.uom },
      } as TCardProductItem
    }
    )
    const newOper = {
      idc: newid,
      stage: oper.stage,
      order: oper.order,
      inn: inn,
      out: out,
      action: oper.action,
      duration: oper.duration, // в милисекундах   
      status: StatusEnum.draft,
      coment: `Исправление брака A${oper.idc}`,
      fixOperIdc: oper.idc,
    } as TCardOperationItem;

    let tCardOperationsUpdated1 = tCards[tCardIndex].tCardOperations ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
    tCardOperationsUpdated1 = [...tCardOperations, newOper];
    const correctedCard = tCards[tCardIndex];

    // проверяем карту на согласованность  материальных обьектов и корректируем вход выход
    const { tCardWastesUpdated, tCardMaterialsUpdated, tCardProductsUpdated, tCardOperationsUpdated } = checkReconcilation(tCardProducts, tCardOperationsUpdated1);

    // Обновляем карту в  redux
    const tCard =
    {
      ...correctedCard,
      maxIdc: newid,
      modified: true,
      tCardOperations: tCardOperationsUpdated,
      tCardWastes: tCardWastesUpdated,
      tCardMaterials: tCardMaterialsUpdated,
      tCardProducts: tCardProductsUpdated,
      status: StatusEnum.draft

    }
    const updatedTCards = [...tCards];
    updatedTCards.splice(tCardIndex, 1, tCard)

    dispatch(setTCards(updatedTCards));

  };

  //  реакт узлы
  const tCardStages = (tCards[tCardIndex] && tCards[tCardIndex].tCardStages) ? tCards[tCardIndex].tCardStages : [] as TCardStageItem[];
  const tCardOperations = (tCards[tCardIndex] && tCards[tCardIndex].tCardOperations) ? tCards[tCardIndex].tCardOperations : [] as TCardOperationItem[];
  const tCardProducts = (tCards[tCardIndex] && tCards[tCardIndex].tCardProducts) ? tCards[tCardIndex].tCardProducts : [] as TCardProductItem[];
  const tCardWastes = (tCards[tCardIndex] && tCards[tCardIndex].tCardWastes) ? tCards[tCardIndex].tCardWastes : [] as TCardProductItem[];
  const tCardMaterials = (tCards[tCardIndex] && tCards[tCardIndex].tCardMaterials) ? tCards[tCardIndex].tCardMaterials : [] as TCardProductItem[];

  // Стадии
  const tCardStagesReactNodes = tCardStages.map((tStage, index2) => {
    //  получили операции стадии
    const operations = tCardOperations.filter(tOper => (tOper.stage.idc === tStage.idc))
      .sort((a, b) => a.order - b.order);

    const operationsReactNodes = operations.map((tCardOperation, index1) => {
      const fixed = (operations.find(op => op.fixOperIdc === tCardOperation.idc) !== undefined);
      return (<>
        {!(tCardOperation.mode) &&
          <TCardOper
            key={index1}
            index={index1}
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
            fixDefect={fixDefect}
            lightProduct={lightProduct}
            fixed={fixed}
          />}

        {tCardOperation.mode && <TCardOperNew
          key={index1}
          tCardOperation={tCardOperation}
          deleteOperHandler={deleteOperHandler}
          cancelOperHandler={cancelOperHandler}
          saveOperHandler={saveOperHandler}
          updateIdc={updateIdc}
          maxIdc={tCards[tCardIndex].maxIdc}
        />}
      </>)
    }
    )

    return (
      <div key={'tStage' + index2}
        className="container_stage"
        onDragOver={(e) => dragOverHandler(e)}
        onDrop={(e) => { handleDrop(e, `S${tStage.idc}`) }}
      >
        <div className="container_stage_title">
          {t('cards.stage')} {tStage.code}
          <Image className="icon_del_stage"
            src={delL} alt="del" width={20} height={20}
            onClick={() => delStage(tStage)}
          />

          <Image className="icon_add_stage"
            src={add} alt="add" width={20} height={20}
            onClick={() => addStage(tStage.code)}
          />
        </div>
        {operationsReactNodes}
        <button className="button1" onClick={() => addOperHandler(tStage)}> {t('cards.addOper')}</button>
      </div>

    );
  })

  // Карты
  const tCardsReactNodes = tCards.map((elem, index4) => {
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
          {removeLoaderCard === elem.id && <ButtonLoader />}
          {removeLoaderCard !== elem.id &&
            <Image className="icon_del"
              src={delD} alt="del" width={20} height={20}
              onClick={() => deleteCardHandler(elem.id)}
            />}

        </div>
      </div>
    );
  })

  // Шаблоны
  const templatesReactNodes = templates.map((elem, index4) => {
    return (

      <button
        key={index4}
        className={`button_prepared`}
        onClick={() => {
          applyTemplate(elem.fileContent)
        }}>
        {elem.name}
      </button>

    )

  })
  const coment = (tCards[tCardIndex]?.coment) ? tCards[tCardIndex].coment : "";

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_cards_left_inner">
            <div className="container_cards_title">{t('cards.tcards')}</div>
            <div className="container_cards">
              {tCardsReactNodes}
              <div className="container_buttons">
                <button onClick={() => addTCardHandler()}>{t('cards.addtcard')}</button>
              </div>
            </div>
            <div className="container_cards_title">{t('cards.explanation')}</div>
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

              {t('cards.status')}: {tCards[tCardIndex].status} &nbsp;&nbsp;<StatusCircle status={tCards[tCardIndex].status} />
              {(tCards[tCardIndex].status === StatusEnum.ready)
                && <button
                  className={`button_prepared`}
                  onClick={setCardClose}>
                  {t('cards.closecard')}
                </button>}
              {(tCards[tCardIndex].status === StatusEnum.draft)
                && <button
                  className={`button_prepared`}
                  onClick={setCardPrepared}>
                  {t('cards.sendtoplan')}
                </button>}

              {templatesReactNodes}
            </div>
            <div className={`container_card_download`}>
              <button
                className={`button_save_template`}
                onClick={() => saveTemplateHandler()}>
                {saveTemplateLoaderCard && <ButtonLoader />}
                {!saveTemplateLoaderCard && t('cards.savetemplate')}
              </button>
              <button
                className={`button_prepared`}
                onClick={() => upLoadtCard(tCards[tCardIndex])}>
                {t('cards.uploadcard')}
              </button>
            </div>
          </div>

          <div className="container_right_inner">
            {/* Продукты */}
            <div className="container_products">
              <div className="container_stage_title">
                {/* <div></div> */}
                {t('cards.products')}
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
                possibleEdit={!readonlyCardStatuses.includes(tCards[tCardIndex].status)}
                prefix={"P"}
                updateIdc={updateIdc}
                maxIdc={tCards[tCardIndex].maxIdc}
                setMaxIdc={setMaxIdc}
                lightProduct={lightProduct}

              />
              {/* Отходы */}
              <div className="container_stage_title">
                {t('cards.wastes')}
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
                maxIdc={tCards[tCardIndex].maxIdc}
                setMaxIdc={setMaxIdc}
                lightProduct={lightProduct}
              />
              <div className="container_stage_title">
                {t('cards.comment')}
              </div>
              <TCardComent
                coment={coment}
                setComentTCardHandler={setComentTCardHandler}
                tCardIdc={tCards[tCardIndex].idc}
              />
            </div>
            {/* Обработка */}
            {tCardStagesReactNodes}
            {tCardMaterials.length > 0 &&
              <div className="container_products">
                <div className="container_stage_title">
                  {t('cards.materials')}
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

