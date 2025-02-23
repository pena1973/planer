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
import { formatDate, padNumberToFourDigits,ISOStringToLocalDateTime } from "@/utils"

import { StatusEnum, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, UnitItem, UnitLoadItem, CalendarItem, UnitExceptionItem, TimeTypeEnum, SettingsItem,ScheduleItem } from "@/types";
import { setUnitLoads, setUnitExceptions, setUnits, setTCardPlaned,setTCardPrepared, setTCards } from '@/store/slices'
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

// // генерация одного дня на шкале
// const generateCalendarItem = (day: Date,schedule:ScheduleItem): CalendarItem => {
//   const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
//   currentDate.setHours(0, 0, 0, 0);

//   const dayOfWeek = currentDate.getDay();  // День недели для учета выходных
//   let timeStartBreack = (dayOfWeek !== 0 && dayOfWeek !== 6) ? 780 : 0;  // Перерыв 1 (13:00, если не выходной)
//   let timeFinishBreack = (dayOfWeek !== 0 && dayOfWeek !== 6) ? 840 : 0;  // Перерыв 1 (14:00, если не выходной)

//   // Создаем объект CalendarItem
//   const calendarItem: CalendarItem = {
//     idDay: idDay(currentDate),
//     date: new Date(currentDate),  // Текущая дата
//     mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
//     day: true,  // Указываем, что это день
//     timeStartWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 540 : 0,  // Время начала работы (9:00, если не выходной)
//     timeFinishWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 1020 : 0,  // Время окончания работы (17:00, если не выходной)
//     breaks: [{ timeStart: timeStartBreack, timeFinish: timeFinishBreack }],
//   };
//   return calendarItem;  // Возвращаем один элемент календаря
// };


// // генерация привычной нам даты - ее использую как id дня
// const idDay = (date: Date): string => {
//   const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
//   const year = date.getFullYear();  // Год

//   return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
// };


export default function Planing({ }: IndexProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })

  const units = useSelector((state: RootState) => {
    return state.catalogSlice.units;
  })
  const tCardPrepared = useSelector((state: RootState) => {
    return state.planSlice.tCardPrepared;
  })
  const tCardPlaned = useSelector((state: RootState) => {
    return state.planSlice.tCardPlaned;
  })
  const unitLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const unitExceptions = useSelector((state: RootState) => {
    return state.planSlice.unitExceptions;
  })

  const settings = useSelector((state: RootState) => {
    return state.catalogSlice.settings;
  })
  const schedule = useSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [loaderCard, setLoaderCard] = useState(NaN); // состояние это id категории  
  
  
  // Выбор запланированной карты
  const selectTCardHandler = async (selectedTCard: TCardItem) => {
  //  необходимо потом прорисовать изменение цвета выбранной карты 
     dispatch(setTCardPlaned(selectedTCard))    
  }

  // Запись запланированной карты
  const saveCardHandler = async () => {
    setLoaderCard(tCardPrepared.id);
    // Фильтруем загрузку по карте  и все что драфт и сохраняем  
    let tCardLoads = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status === 'draft') })
    try {
      const res = await fetch(`/api/preplan-api?userId=${1}&companyId=${1}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCard:tCardPrepared,
            unitLoads: tCardLoads
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
          // удалим массив загрузок предварительный и добавим массив загрузок запланированный
          let _loads = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id && load.status !== 'draft') })
          let savedUnitLoads = receivedData.savedUnitLoads  as UnitLoadItem[];
          let updatedLoads=[..._loads,...savedUnitLoads]
            dispatch(setUnitLoads(updatedLoads))
          //   уберем звезду модифицированности
          
          //  поменяем статус карты  и после этого она перерисуется в запланированные
          let index = tCards.findIndex(tCard=>tCard.id===tCardPrepared.id);
          let updatedTCard = {...tCards[index], status: StatusEnum.Pl} 
          let _tCards = [...tCards]
          _tCards.splice(index,1,updatedTCard);
          dispatch(setTCardPlaned(updatedTCard))    
          dispatch(setTCardPrepared({} as TCardItem));
          dispatch(setTCards(_tCards));

           setMessage("Планировка карты успешно записана");
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setLoaderCard(NaN);
  };
  
  // запрос Юниты

  const getUnits = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/units-api?userId=${1}&companyId=${1}`,
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
        if (receivedData.success) {
          let units_ = receivedData.units as UnitItem[]
          dispatch(setUnits(units_)); // Это ме надо?

        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }
  const getUnutsExceptions = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/exceptions-api?userId=${1}&companyId=${1}`,
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
        if (receivedData.success) {
          let exceptions = receivedData.exceptions as UnitExceptionItem[]
          dispatch(setUnitExceptions(exceptions));
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }
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
              return { ...unitLoad, date: new Date(unitLoad.date) }
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

  // Начальный загруз
  useEffect(() => {
    getUnits();
    getUnutsLoads();
    getUnutsExceptions(); 
  }, []);

  /// ПЕРЕТАСКИВАНИЕ КАРТЫ НА ПОЛЕ ПЛАНИРОВАНИЯ
  // Для изменения курсора
  const handleMouseDownTCard = (e: React.MouseEvent) => {
    setIsDragging(true); // Включаем перетаскивание

    const onMouseUp = () => {
      setIsDragging(false); // Завершаем перетаскивание
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp); // Обработчик отпускания кнопки мыши
  };

  // Хендлер для начала перетаскивания
  const handleDragStartTCard = (event: React.DragEvent, itemId: number) => {
    // Устанавливаем данные, которые будут переданы в event
    event.dataTransfer.setData("itemId", String(itemId));

    // // Можно добавить визуальные эффекты или логику на этапе захвата элемента
    // console.log(`Перетаскивается элемент с id: ${itemId}`);
  };

  // Хендлер для перетаскивания элемента на целевой контейнер
  const handleDragOverTCard = (event: React.DragEvent) => {
    event.preventDefault(); // Необходимо, чтобы можно было "бросить" элемент
  };

  // Хендлер для отпускания карты на шкалу и предварительное  планирование
  const handleDropTCard = async (event: React.DragEvent) => {

    event.preventDefault();

    const itemId = event.dataTransfer.getData("itemId"); // Получаем id перетаскиваемого элемента в строковом виде
    let tCard_ = tCards.find(tCard => tCard.id === Number(itemId))
    if (!tCard_) return
    dispatch(setTCardPrepared(tCard_));

    setIsDragging(false); // Завершаем перетаскивание 
    // console.log(`Отпущен элемент с id: ${itemId}`);
    //!!!!!!!!!! отправляем на сервер  карту  и там планируем
    //  в базу пока не пишем это предварительный расчет
    try {
      const res = await fetch(`/api/preplan-api?userId=${1}&companyId=${1}&tcardId=${itemId}`,
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
              return { ...unitLoad, date: new Date(unitLoad.date) }
            });

          dispatch(setUnitLoads(unitsLoads));
          setMessage("Карта успешно предварительно запланирована НО НЕЗАПИСАНА! Если все в порядке ЗАПИШИ!");
        } else {
          setMessage("Карту запланировать не удалось");
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  };
  ///////////////////////////


  /// ВИЗУАЛИЗАЦИЯ СПИСКА КАРТ
  // временно уберу фильтр  нужен признак по которому я пойму какая карта запланирована а какая нет
  let tCardsToPlan = tCards.filter(tCard => (tCard.status === StatusEnum.Pr)) // подготовлен

  let tCardsPlaned = tCards.filter(tCard => (tCard.status === StatusEnum.Pl)) // запланирован
  // Карты
  let tCardsPlanedReactNodes = tCardsPlaned.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(new Date(elem.date));

    return (
      <div key={index4} className="container_card">
        <div className={`${elem.id === tCardPlaned?.id ? "container_card_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>

      </div>
    );
  })
  // Карты
  let tCardsToPlanReactNodes = tCardsToPlan.map((elem, index) => {
    let date = "";
    if (elem.date) date = formatDate(new Date(elem.date));

    return (
      <div key={index}
        className="container_plan draggable-item"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDownTCard} // Добавляем обработчик нажатия мыши при перетаскивании        
        draggable
        onDragStart={(e) => handleDragStartTCard(e, elem.id)}
      >
        <div className={`${elem.id === tCardPrepared?.id ? "container_plan_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>
        <div className="container_icon_edit_save">
          <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => saveCardHandler()}
          />
          {tCardPrepared?.id === elem.id && <div>*</div>}
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

          onDragOver={handleDragOverTCard} // Устанавливаем обработчик для перетаскивания
          onDrop={handleDropTCard} // Обрабатываем отпускание элемента
        >
          <PlanScaleContainer
            // generateCalendarItem={generateCalendarItem}
            // idDay={idDay}
            units={units}
            unitLoads={unitLoads} 
            settings = {settings}
            schedule ={schedule}/>
        </div>

      </div>
    </Layout>
  )
}