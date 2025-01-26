import Layout from "@/components/Layout/layout";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import PlanScaleContainer from "@/components/PlanScaleContainer/planScaleContainer";

import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { fillGaps } from "@/utils"

import Image from 'next/image';

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';
import { formatDate, padNumberToFourDigits } from "@/utils"

import { OperStatusEnum, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, UnitLoadItem, CalendarItem, UnitExceptionItem, TimeTypeEnum } from "@/types";
import { setUnitLoads,setUnitExceptions } from '@/store/slices'
import { } from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface IndexProps {

}

import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";


// Определяем тип для объекта tCard
interface LoadUnit {
  id: number;
  resource: string;
  load: {
    name: string;
    start: number;  // Значение времени в миллисекундах
    finish: number; // Значение времени в миллисекундах
  }[];  // Массив объектов load
}

// генерация одного дня на шкале
const generateCalendarItem = (day: Date): CalendarItem => {
  const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
  currentDate.setHours(0, 0, 0, 0);

  const dayOfWeek = currentDate.getDay();  // День недели для учета выходных
  let timeStartBreack = (dayOfWeek !== 0 && dayOfWeek !== 6) ? 780 : 0;  // Перерыв 1 (13:00, если не выходной)
  let timeFinishBreack = (dayOfWeek !== 0 && dayOfWeek !== 6) ? 840 : 0;  // Перерыв 1 (14:00, если не выходной)

  // Создаем объект CalendarItem
  const calendarItem: CalendarItem = {
    idDay: idDay(currentDate),
    date: new Date(currentDate),  // Текущая дата
    mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
    day: true,  // Указываем, что это день
    timeStartWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 540 : 0,  // Время начала работы (9:00, если не выходной)
    timeFinishWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 1020 : 0,  // Время окончания работы (17:00, если не выходной)
    breaks: [{ timeStart: timeStartBreack, timeFinish: timeFinishBreack }],
  };
  return calendarItem;  // Возвращаем один элемент календаря
};


// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};


export default function Planing({ }: IndexProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  const tCardCurrent = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrent;
  })
  const unitLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [loaderCard, setLoaderCard] = useState(NaN); // состояние это id категории  
  let idsTCardPlaned = useRef([] as number[]); //  список id  запланированных карт
  let idsTCardToPlan = useRef([] as number[]); //  список id  карт которые надо запланировать


  const selectTCardHandler = async (selectedTCard: TCardItem) => {
    // если новая карта не сохраненная
    // dispatch(setTCardCurrent(selectedTCard))
    // if (selectedTCard.id < 0) {
    //   dispatch(setTCardCurrentMaxIdc(0))
    //   dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    //   dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    //   dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    //   dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    //   dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
    return;
  }
  const saveCardHandler = async () => {
    setLoaderCard(tCardCurrent.id);
    setLoaderCard(NaN);
  };


  //  получает с сервера список ids запланированных и незапланированных карт
  const selectTCardsPlan = async () => {
    try {
      const res = await fetch(`/api/tcards-plan-api?userId=${1}&companyId=${1}`,
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
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          //   Обновим текущую карту
          idsTCardPlaned.current = receivedData.idsTCardPlaned as number[]
          idsTCardToPlan.current = receivedData.idsTCardToPlan as number[]

          // setMessage("Карты успешно получены");
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  };

// запрос Загрузки
const getUnutsLoads = async () => {
  
  try {
    const res = await fetch(`/api/load-api?userId=${1}&companyId=${1}`,
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
      // setMessage(t('service.serverUnavailable') + res.status);
    } else {
      const receivedData = await res.json();
      // console.log("receivedData", receivedData)        
      if (receivedData.success) {
        //  массив юнитов с загрузками
    
        let unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])
        .map(unitLoad => {
          unitLoad.date
          return {...unitLoad, date: new Date(unitLoad.date)}         
        });

        dispatch(setUnitLoads(unitsLoads));
        // setMessage("Карты успешно получены");
      }
    }
  } catch (e: any) {
    // setMessage(t('service.noConnection') + e.message)            
  }


  // }

  // // Обновим сообщение для пользователя
  // setMessage(`Элемент с id: ${itemId} был перемещен`);
};
// запрос Отклонений графиков юнитов от графика компании
const getUnutsExceptions = async () => {
  
  try {
    const res = await fetch(`/api/exceptions-api?userId=${1}&companyId=${1}`,
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
      // setMessage(t('service.serverUnavailable') + res.status);
    } else {
      const receivedData = await res.json();
      // console.log("receivedData", receivedData)        
      if (receivedData.success) {
        //  массив отклонений Юнитов 
    
        let unitsExceptions = (receivedData.unitsExceptions as UnitExceptionItem[])
        .map(unitEx => {
          unitEx.date
          return {...unitEx, date: new Date(unitEx.date)}
          
        });

        dispatch(setUnitExceptions(unitsExceptions));
        // setMessage("Карты успешно получены");
      }
    }
  } catch (e: any) {
    // setMessage(t('service.noConnection') + e.message)            
  }


  // }

  // // Обновим сообщение для пользователя
  // setMessage(`Элемент с id: ${itemId} был перемещен`);
};


  // Начальный загруз
  useEffect(() => {
    getUnutsLoads();
    getUnutsExceptions();
    // selectTCardsPlan();
  }, []);


  // Для изменения курсора
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true); // Включаем перетаскивание

    const onMouseUp = () => {
      setIsDragging(false); // Завершаем перетаскивание
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp); // Обработчик отпускания кнопки мыши
  };

  // Хендлер для начала перетаскивания
  const handleDragStart = (event: React.DragEvent, itemId: number) => {
    // Устанавливаем данные, которые будут переданы в event
    event.dataTransfer.setData("itemId", String(itemId));

    // // Можно добавить визуальные эффекты или логику на этапе захвата элемента
    // console.log(`Перетаскивается элемент с id: ${itemId}`);
  };

  // Хендлер для перетаскивания элемента на целевой контейнер
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault(); // Необходимо, чтобы можно было "бросить" элемент
  };

  // Хендлер для отпускания элемента в целевой контейнер
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("itemId"); // Получаем id перетаскиваемого элемента
    setIsDragging(false); // Завершаем перетаскивание 
    console.log(`Отпущен элемент с id: ${itemId}`);
    //!!!!!!!!!! отправляем на сервер  карту  и там планируем


    // Обработаем событие перемещения элемента (например, добавим в новое место)
    // Здесь вы можете обновить состояние, переместив элемент между массивами
    // const item = tCardsToPlan.find(item => item.id === Number(itemId));

    // const item = tCards.find(item => item.id === Number(itemId));
    // if (item) {


    // planTCard(item);  // запланируем карту
    // передаем на сервер

    //  в базу пока не пишем это предварительный расчет
    try {
      const res = await fetch(`/api/plan-api?userId=${1}&companyId=${1}&tcardId=${itemId}`,
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
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          //   Обновим  массив загрузок          

          let unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])
          .map(unitLoad => {
            unitLoad.date
            return {...unitLoad, date: new Date(unitLoad.date)}         
          });


          // // Сортируем tCards по номеру (если number это число)
          // let tCards_ = tCards.sort((a, b) => a.number - b.number);
          // let tCardsUpdated = tCards_.map(card => { return { ...card, date: new Date(card.date) } });
          dispatch(setUnitLoads(unitsLoads));
          setMessage("Карта успешно запланирована");
        } else{
          setMessage("Карту запланировать не удалось");
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }


    // }

    // // Обновим сообщение для пользователя
    // setMessage(`Элемент с id: ${itemId} был перемещен`);
  };


  // временно уберу фильтр  нужен признак по которому я пойму какая карта запланирована а какая нет
  let tCardsToPlan = tCards.filter(tCard => (tCard.tCardOperations?.some(oper => oper.status === OperStatusEnum.D)))

  let tCardsPlaned = tCards.filter(tCard => (tCard.tCardOperations?.some(oper => oper.status !== OperStatusEnum.D)))
  // Карты
  let tCardsPlanedReactNodes = tCardsPlaned.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(elem.date);

    return (
      <div key={index4} className="container_card">
        <div className={`${elem.id === tCardCurrent.id ? "container_card_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>

      </div>
    );
  })
  // Карты
  let tCardsToPlanReactNodes = tCards.map((elem, index) => {
    let date = "";
    if (elem.date)
      date = formatDate(elem.date);

    // style={{cursor: isDragging ? 'grabbing' : 'grab' }}
    // onMouseDown={handleMouseDown} // Добавляем обработчик нажатия мыши

    return (
      <div key={index} className="container_plan draggable-item" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown} // Добавляем обработчик нажатия мыши при перетаскивании        
        draggable
        onDragStart={(e) => handleDragStart(e, elem.id)}
      >
        <div className={`${elem.id === tCardCurrent.id ? "container_plan_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>
        <div className="container_icon_edit_save">
          <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => saveCardHandler}
          />
          {elem.modified && <div>*</div>}
        </div>
      </div>
    );
  })

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="container_planing_title">запланированы</div>
          <div className="container_planing">
            {tCardsPlanedReactNodes}
          </div>
          <div className="container_planing_title_n"> не запланированы</div>
          <div className="container_planing_n">
            {tCardsToPlanReactNodes}
          </div>
          <div className="container_planing_title">Пояснение</div>
          <div className="container_message">{message}
            {/* </div> */}
          </div>

        </div>
        <div className="container_right pl_container_right"

          onDragOver={handleDragOver} // Устанавливаем обработчик для перетаскивания
          onDrop={handleDrop} // Обрабатываем отпускание элемента
        >
          <PlanScaleContainer
            generateCalendarItem={generateCalendarItem}
            idDay={idDay}
            unitLoads={unitLoads} />
        </div>

      </div>
    </Layout>
  )
}