import Layout from "@/components/Layout/layout";
import TCardOper from "@/components/TCardOper/tCardOper";
import TCardOperNew from "@/components/TCardOperNew/tCardOperNew";
import TCardProduct from "@/components/TCardProduct/tCardProduct";
import TCardProductNew from "@/components/TCardProductNew/tCardProductNew";
import { formatDate } from "@/utils"
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { useRouter } from 'next/navigation';

import { } from '@/store/slices';
import { UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem } from "@/types";

import { setActions, setUOMs, setTCards, setTCardCurrent, setTCardCurrentMaterials, setTCardCurrentOperations, setTCardCurrentProducts, settCardCurrentWastes } from '@/store/slices'

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
  const [droppedOn, setDroppedOn] = useState('');

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // копируем элемент и его уэже тащим
    setIsDragging(true)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: string) => {
    e.preventDefault(); // Предотвращаем стандартное поведение
    setDroppedOn(target); // Устанавливаем, на какой элемент был сброшен перетаскиваемый элемент
    console.log(`Dropped on: ${target}`); // Логируем, на какой элемент был сброшен
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  function dragOverHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();

  }
  function dropHandler(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }
  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  const tCardCurrent = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrent;
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
 
  const transformOperationsToStages = (tCardOperations: TCardOperationItem[]) => {
    // Группируем операции по стадии
    return tCardOperations.reduce((stages: any[], operation) => {
      // Ищем, существует ли уже объект для этой стадии в итоговом массиве
      const stageIndex = stages.findIndex(stage => stage.stage === operation.stage);

      // Если стадия уже есть, добавляем операцию в ее список операций
      if (stageIndex > -1) {
        stages[stageIndex].operations.push(operation);
      } else {
        // Если стадии еще нет, создаем новый объект и добавляем операцию в список
        stages.push({
          stage: operation.stage,
          operations: [operation]
        });
      }

      return stages;
    }, []);
  };

  let tCardsStages = transformOperationsToStages(tCardCurrentOperations as TCardOperationItem[]);

  let tCardsReactNodes = tCards.map((elem, index4) => {


    let date = "";
    if (elem.date) date = formatDate(elem.date);
    return (
      <div key={index4}
        className={`container_card ${elem.mode ? "container_card_edit" : ""}`}
        onClick={() => selectTCardHandler(elem)}>
        N: {elem.number} {date}
      </div>
    );
  })

  // ТЕХ КАРТЫ

  const addTCardHandler = () => {
    const currentDate = new Date();

    const updatedTCards = tCards.map((card) => { return (card.mode) ? { ...card, mode: false } : card; });
    let newTCard = { id: -tCards.length, date: currentDate, number: "new", mode: true } as TCardItem

    dispatch(setTCards([...updatedTCards, newTCard]));
    dispatch(setTCardCurrent(newTCard));
    dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
  };
  const selectTCardHandler = (selectedTCard: TCardItem) => {
    let newCurrentTCard = { ...selectedTCard, mode: true } as TCardItem

    const updatedTCards = tCards.map((card) => {
      let card1 = (card.mode) ? { ...card, mode: false } : card;
      return card.id === newCurrentTCard.id ? newCurrentTCard : card1
    }
    );
    dispatch(setTCards(updatedTCards));

    dispatch(setTCardCurrent(newCurrentTCard));
    // Здесь будет запрос к базе на загрузку карты
    dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
  };
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
            mode: true,
          };
          dispatch(setTCardCurrent(newCard));
          // обновим список карт
          dispatch(setTCards([...tCards, newCard]));

        } else { // если выбрана перезаполняем  (главное сохранить id)
          const newCard = { ...tCardCurrent, number: parsedContent.number ? parsedContent.number : tCardCurrent.number };
          dispatch(setTCardCurrent(newCard));
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
        console.log(parsedContent);

      } catch (err) {
        alert('Невозможно прочитать или распарсить файл.');
      }
    };
    reader.readAsText(file);
  };

  // ПРОДУКЦИЯ
  // колбеки кнопки
  const deleteProductHandler = (idToRemove: number) => {
    const tCardProductsUpdated = tCardCurrentProducts.filter(product => product.id !== idToRemove);
    dispatch(setTCardCurrentProducts(tCardProductsUpdated))
  };
  const saveProductHandler = (idTosave: number, code: string, qtu: number, uom: UOMItem) => {
    const productToUpdate = tCardCurrentProducts.find(product => product.id === idTosave);
    if (productToUpdate) {
      const updatedProduct = { ...productToUpdate, code: code, qtu: qtu, uom: { ...uom }, mode: !productToUpdate.mode }
      // Обновляем в исходном массиве
      const tCardProductsUpdated = tCardCurrentProducts.map(product => product.id === idTosave ? updatedProduct : product);
      dispatch(setTCardCurrentProducts(tCardProductsUpdated))
    };
  };
  const editProductHandler = (id: number) => {
    const tCardProductsUpdated = tCardCurrentProducts.map(product => {
      if (product.id === id) {
        return { ...product, mode: !product.mode, };
      }
      return product;
    });
    dispatch(setTCardCurrentProducts(tCardProductsUpdated))
  };

  const addProductHandler = () => {
    let newProduct = {
      id: -tCardCurrentProducts.length,
      code: "",
      qtu: 0,
      uom: {} as UOMItem,
      mode: true,
    } as TCardProductItem;
    dispatch(setTCardCurrentProducts([...tCardCurrentProducts, newProduct]))
  };

  let tCardProductsReactNodes = tCardCurrentProducts.map((elem, index4) => {
    return (<>
      {elem.mode && <TCardProductNew id={elem.id} title={elem.code} qtu={elem.qtu} uom={elem.uom} saveProductHandler={saveProductHandler} deleteProductHandler={deleteProductHandler} />}
      {!elem.mode && <TCardProduct id={elem.id} title={elem.code} qtu={elem.qtu} uom={elem.uom} editProductHandler={editProductHandler} deleteProductHandler={deleteProductHandler} />}
    </>
    );
  })

  // ОТХОДЫ
  let tCardWasteReactNodes = tCardCurrentWastes.map((elem, index4) => {
    return (
      <TCardProduct
        id={elem.id}
        title={elem.code}
        qtu={elem.qtu}
        uom={elem.uom}
        editProductHandler={() => { }}
        deleteProductHandler={() => { }} />)
  });



  // ОБРАБОТКА
  // колбеки кнопки
  const deleteOperHandler = (idToRemove: number) => {
    const tCardOperationsUpdated = tCardCurrentOperations.filter(tOper => tOper.id !== idToRemove);
    dispatch(setTCardCurrentOperations(tCardOperationsUpdated));
  };
  const saveOperHandler = (idTosave: number, inn: TCardProductItem[], out: TCardProductItem[], action: ActionItem | null, duration: number) => {

    const tOperToUpdate = tCardCurrentOperations.find(tOper => tOper.id === idTosave);
    if (tOperToUpdate) {
      const updatedOper = { ...tOperToUpdate, inn: [...inn], out: [...out], action: { ...action }, duration: duration, mode: !tOperToUpdate.mode }
      // Обновляем в исходном массиве
      const tCardOperationsUpdated = tCardCurrentOperations.map(product => product.id === idTosave ? updatedOper : product);
      dispatch(setTCardCurrentOperations(tCardOperationsUpdated))
    };
  };
  const editOperHandler = (id: number) => {
    const tCardOperationsUpdated = tCardCurrentOperations.map(tOper => {
      if (tOper.id === id) {
        return { ...tOper, mode: !tOper.mode, };
      }
      return tOper;
    });
    dispatch(setTCardCurrentOperations(tCardOperationsUpdated))
  };
  const addOperHandler = (stage: string) => {
    let newOper = {
      id: -tCardCurrentOperations.length,
      stage: stage,
      inn: [] as TCardProductItem[],
      out: [] as TCardProductItem[],
      action: {} as ActionItem,
      duration: 0,
      mode: true
    } as TCardOperationItem;
    dispatch(setTCardCurrentOperations([...tCardCurrentOperations, newOper]))
  };
  let tCardsStagesReactNodes = tCardsStages.map((elem, index) => {
    let operations = elem.operations as TCardOperationItem[];

    let operationsReactNodes = operations.map((tCardOperation, index1) => {

      return (<>
        {!(tCardOperation.mode) && <TCardOper key={index1} tCardOperation={tCardOperation}
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
        />}

        {tCardOperation.mode && <TCardOperNew
          key={index1}
          id={tCardOperation.id}
          inn={tCardOperation.inn}
          out={tCardOperation.out}
          action={tCardOperation.action}
          duration={tCardOperation.duration}
          deleteOperHandler={deleteOperHandler}
          saveOperHandler={saveOperHandler}
        />}
      </>)
    }
    )
    return (
      <div key={index} className="container_stage">
        <div className="container_stage_title">{elem.stage}</div>
        {operationsReactNodes}
        <button onClick={() => addOperHandler(elem.stage)}> добавить </button>
      </div>
    );
  })

  // МАТЕРИАЛЫ
  // колбеки кнопки
  const deleteMaterialHandler = (idToRemove: number) => {
    const tCardMaterialsUpdated = tCardCurrentMaterials.filter(product => product.id !== idToRemove);
    dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated))
  };
  const saveMaterialHandler = (idTosave: number, code: string, qtu: number, uom: UOMItem) => {
    const materialToUpdate = tCardCurrentMaterials.find(product => product.id === idTosave);
    if (materialToUpdate) {
      const updatedMaterial = { ...materialToUpdate, code: code, qtu: qtu, uom: { ...uom }, mode: !materialToUpdate.mode }
      // Обновляем в исходном массиве
      const tCardMaterialUpdated = tCardCurrentMaterials.map(product => product.id === idTosave ? updatedMaterial : product);
      dispatch(setTCardCurrentMaterials(tCardMaterialUpdated))
    };
  };
  const editMaterialHandler = (id: number) => {
    const tCardMaterialsUpdated = tCardCurrentMaterials.map(product => {
      if (product.id === id) {
        return { ...product, mode: !product.mode, };
      }
      return product;
    });
    dispatch(setTCardCurrentMaterials(tCardMaterialsUpdated))
  };
  const addMaterialHandler = () => {
    let newMaterial = {
      id: -tCardCurrentMaterials.length,
      code: "",
      qtu: 0,
      uom: {} as UOMItem,
      mode: true,
    } as TCardProductItem;
    dispatch(setTCardCurrentMaterials([...tCardCurrentMaterials, newMaterial]))
  };
  let tCardMaterialsReactNodes = tCardCurrentMaterials.map((elem, index4) => {
    return (<>
      {elem.mode && <TCardProductNew id={elem.id} title={elem.code} qtu={elem.qtu} uom={elem.uom} saveProductHandler={saveMaterialHandler} deleteProductHandler={deleteMaterialHandler} />}
      {!elem.mode && <TCardProduct id={elem.id} title={elem.code} qtu={elem.qtu} uom={elem.uom} editProductHandler={editMaterialHandler} deleteProductHandler={deleteMaterialHandler} />}
    </>
    );
  })

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="tk_container_left_inner">
            <div className="tk_container_cards_title">тех карты</div>
            <div className="tk_container_cards">

              {tCardsReactNodes}
              <div className="container_buttons">
                <button onClick={() => addTCardHandler()}>Добавить</button>
              </div>
            </div>
            {/* <div className="container_buttons">
              <button>Добавить</button>
            </div> */}
            <div className="tk_container_cards_title">легенда</div>
            <div className="container_cards_lack">
              <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">Нет материала</div>
              </div>
              {/* <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">A1B1</div>
                <div className="container_cards_lack_qty">5</div>
              </div>
              <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">A1B1</div>
                <div className="container_cards_lack_qty">5</div>
              </div>
              <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">A1B1</div>
                <div className="container_cards_lack_qty">5</div>
              </div>
              <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">A1B1</div>
                <div className="container_cards_lack_qty">5</div>
              </div>
              <div className="container_cards_lack_item">
                <div className="container_cards_lack_code">A1B1</div>
                <div className="container_cards_lack_qty">5</div> */}
              {/* </div> */}
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
        <div className="container_right">
          {/* Продукты */}
          <div className="container_products">
            <div className="container_stage_title">
              Продукция
            </div>
            {tCardProductsReactNodes}
            {/* <TCardProductNew id={22} title={"elem.code"} qtu={555} uom={{} as UOMItem} saveProductHandler={saveProductHandler} deleteProductHandler={deleteProductHandler} /> */}
            <button onClick={() => addProductHandler()} >добавить</button>
            <div className="container_stage_title">
              Отходы
            </div>
            {tCardWasteReactNodes}
          </div>
          {/* Обработка */}
          {tCardsStagesReactNodes}
          {tCardCurrentOperations.length === 0 &&
            <div className="container_stage">
              <div className="container_stage_title">A</div>
              <button onClick={() => addOperHandler("A")}> добавить </button>
            </div>
            }

          {/* материалы */}
          <div className="container_products">
            <div className="container_stage_title">
              Склад
            </div>
            {tCardMaterialsReactNodes}
            {/* <TCardProductNew id={22} title={"elem.code"} qtu={555} uom={{} as UOMItem} saveProductHandler={saveProductHandler} deleteProductHandler={deleteProductHandler} /> */}
            <button onClick={() => addMaterialHandler()}>добавить</button>
          </div>


        </div>


      </div>
    </Layout>
  )
}

