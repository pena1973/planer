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
import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

import { UOMItem, StatusEnum, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, UnitItem, UnitLoadItem, CalendarItem, UnitExceptionItem, TimeTypeEnum, SettingsItem, ScheduleItem } from "@/types";
import { setUnitLoads, setUnitExceptions, setUnits, setTCardLighted, setTCardPrepared, setTCards } from '@/store/slices'
import { } from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");



// import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import eraz from "@/public/erazer1-rem.png";
import light from "@/public/light-rem.png";
import lighton from "@/public/light-on-rem.png";
// import add from "@/public/add-rem.png";
// import TCardProduct from "@/components/TCardProduct/tCardProduct";


export default function Planing() {

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
  const tCardLighted = useSelector((state: RootState) => {
    return state.planSlice.tCardLighted;
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

  let today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)

  // Выбор запланированной карты
  const lightTCardHandler = async (selectedTCard: TCardItem, on: boolean) => {
    if (on) dispatch(setTCardLighted(selectedTCard))
    else dispatch(setTCardLighted({} as TCardItem))
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
            tCard: tCardPrepared,
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
          let savedUnitLoads = receivedData.savedUnitLoads as UnitLoadItem[];
          let updatedLoads = [..._loads, ...savedUnitLoads]
          dispatch(setUnitLoads(updatedLoads))
          //   уберем звезду модифицированности

          //  поменяем статус карты  и после этого она перерисуется в запланированные
          let index = tCards.findIndex(tCard => tCard.id === tCardPrepared.id);
          let updatedTCard = { ...tCards[index], status: StatusEnum.planed }
          let _tCards = [...tCards]
          _tCards.splice(index, 1, updatedTCard);
          dispatch(setTCardLighted(updatedTCard))
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

  // Затираем планирование карты только шкалу вперед  - все что прошло уже необратимо
  const erazCardHandler = async (id: number) => {
    // это предварительное планирование  -  просто стираем
    // if (id === tCardPrepared.id) {
    let updatedUnitLoads = unitLoads.filter(load => {
      return (load.id_tCard !== id || load.date < (new Date().toLocaleDateString("en-CA")))
    })
    dispatch(setUnitLoads(updatedUnitLoads));
    // }

    // эта карта запланирована  затираем planed на prepared) на сервере начиная с текущей даты  -  историю не трогаем
    if (tCardsPlaned.some(tcard => tcard.id === id)) {

      // setLoaderCard(tCardPrepared.id);
      // 
      let tCardLoads = unitLoads.filter(load => {
        return (load.id_tCard === id && load.status === StatusEnum.planed && load.date >= today.toLocaleDateString("en-CA"))
      })
      try {
        const res = await fetch(`/api/erazeplan-api?userId=${1}&companyId=${1}`,
          {
            method: 'post',
            headers: new Headers({
              // 'Authorization': 'Basic ' + token,
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              unitLoads: tCardLoads,
              tCard_id: id,
              today: new Date().toLocaleDateString("en-CA"),
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
            // Если успешно меняем статусы карты и операций

            if (tCardLoads.length > 0) {
              const updatedLoads = unitLoads.filter(load => !tCardLoads.some(l => l.id === load.id));
              dispatch(setUnitLoads(updatedLoads));
            }

            //   уберем звезду модифицированности

            //  поменяем статус карты  и после этого она перерисуется в запланированные
            let index = tCards.findIndex(tCard => tCard.id === tCardLighted.id);
            let updatedTCard = { ...tCards[index], status: StatusEnum.prepared }
            let _tCards = [...tCards]
            _tCards.splice(index, 1, updatedTCard);
            dispatch(setTCardPrepared(updatedTCard))
            dispatch(setTCardLighted({} as TCardItem));
            dispatch(setTCards(_tCards));

            //        setMessage("Планировка карты успешно записана");
          }
        }
      } catch (e: any) {
        // setMessage(t('service.noConnection') + e.message)            
      }
      // setLoaderCard(NaN);


    }

  };

  // удаление лоада из контекстного меню для сторонних юнитов
  const erazLoadHandler = async (idc: number) => {
    let erazload = unitLoads.find(load => load.idc === idc)
    let tCardLoads = unitLoads.filter(load => load.id_tCard === erazload?.id_tCard)
    let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== erazload?.id_tCard)
    if (erazload) {
      if (erazload.status === StatusEnum.prepared) {
        // ЗАПРОС НА СЕРВЕР ОБРАБОТКА ЛОАДОВ - УДАЛЕНИЕ ПОСЛЕДУЮЩИХ
        try {
          const res = await fetch(`/api/erazeload-api?userId=${1}&companyId=${1}`,
            {
              method: 'post',
              headers: new Headers({
                // 'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({
                deletedLoad: erazload,
                loads: tCardLoads,
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
            let tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
            let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
            dispatch(setUnitLoads(updatedLoads));
            if (receivedData.success) {
              setMessage(" Успешно удалено планирование операции и все последующие зависимые планирования");
            } else {
              setMessage(receivedData.message);
            }
          }
        } catch (e: any) {
          // setMessage(t('service.noConnection') + e.message)            
        }

      } else if (erazload.status === StatusEnum.planed) {
        // удалить на сервере поскольку planed  -  уже записан
      }
    }

  }

  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const pinLoadHandler = async (load: UnitLoadItem,unit:UnitItem,date:string,timeStart:number,timeFinish:number) => {

    let tCardLoads = unitLoads.filter(load => load.id_tCard === load?.id_tCard)
    let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== load.id_tCard)
    //  перетаскивать лоады можем только на этапе prepared
    if (load) {
      if (load.status === StatusEnum.prepared) {
        //  проверяем если внешний - другая обработка - два лоада один точка старта, второй точка готовности
        //  два состояния  -  запланирован и готов с датами - устанавливается вручную
        // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
        // проверяем согласованность предыдущих и перепланируем последующие
        try {
          const res = await fetch(`/api/pinload-api?userId=${1}&companyId=${1}`,
            {
              method: 'post',
              headers: new Headers({
                // 'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({
                pinnedLoad: load,
                loads: tCardLoads,
                unit:unit,
                date: date,
                timeStart: timeStart,
                timeFinish: timeFinish,
                today: today.toLocaleDateString("en-CA")                               
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
            let tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
            let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
            dispatch(setUnitLoads(updatedLoads));
            if (receivedData.success) {
              setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
            } else {
              setMessage(receivedData.message);
            }
          }
        } catch (e: any) {
          // setMessage(t('service.noConnection') + e.message)            
        }
      }
    }
  }

// Прикрепление лоада на шкале   возвращает измененное планирование карты
const unPinLoadHandler = async (load: UnitLoadItem,unit:UnitItem,date:string,timeStart:number,timeFinish:number) => {

  let tCardLoads = unitLoads.filter(load => load.id_tCard === load?.id_tCard)
  let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== load.id_tCard)
  //  перетаскивать лоады можем только на этапе prepared
  if (load) {
    if (load.status === StatusEnum.prepared) {
      //  проверяем если внешний - другая обработка - два лоада один точка старта, второй точка готовности
      //  два состояния  -  запланирован и готов с датами - устанавливается вручную
      // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
      // проверяем согласованность предыдущих и перепланируем последующие
      try {
        const res = await fetch(`/api/unpinload-api?userId=${1}&companyId=${1}`,
          {
            method: 'post',
            headers: new Headers({
              // 'Authorization': 'Basic ' + token,
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              pinnedLoad: load,
              loads: tCardLoads,
              unit:unit,
              date: date,
              timeStart: timeStart,
              timeFinish: timeFinish,
              today: today.toLocaleDateString("en-CA")                               
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
          let tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
          let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));
          if (receivedData.success) {
            setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
          } else {
            setMessage(receivedData.message);
          }
        }
      } catch (e: any) {
        // setMessage(t('service.noConnection') + e.message)            
      }
    }
  }
}


  // Изменение длительности лоада для сторонних юнитов Контекстное меню
  const changeDurationLoadHandler = async (idc: number) => {

  }

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
    // getUnits();
    // getUnutsLoads();
    // getUnutsExceptions();
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
    //!!!!!!!!!! отправляем на сервер  карту  и там планируем
    //  в базу пока не пишем это предварительный расчет
    try {
      const res = await fetch(`/api/preplan-api?userId=${1}&companyId=${1}&tcardId=${itemId}&today=${new Date().toLocaleDateString("en-CA")}`,
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
        let unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])
        dispatch(setUnitLoads(unitsLoads));
        if (receivedData.success) {
          setMessage("Карта успешно предварительно запланирована НО НЕЗАПИСАНА! Если все в порядке ЗАПИШИ!");
        } else {
          setMessage(receivedData.message);
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }


  };
  ///////////////////////////


  /// ВИЗУАЛИЗАЦИЯ СПИСКА КАРТ
  // временно уберу фильтр  нужен признак по которому я пойму какая карта запланирована а какая нет
  let tCardsToPlan = tCards.filter(tCard => (tCard.status === StatusEnum.prepared)) // подготовлен

  let tCardsPlaned = tCards.filter(tCard => (tCard.status === StatusEnum.planed)) // запланирован
  // Карты
  let tCardsPlanedReactNodes = tCardsPlaned.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(new Date(elem.date));

    return (
      <div key={index4} className="container_card">
        <div className="container_card1">
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_card_text">&nbsp; {padNumberToFourDigits(elem.number)} -  {date}</div>
        </div>

        <div className="container_icon_edit_save">
          <Image className="icon_edit_save"
            src={eraz}
            alt="eraz" width={20} height={20}
            onClick={() => erazCardHandler(elem.id)}
          />
          {tCardLighted?.id === elem.id}
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

        <div className={`container_card1 ${elem.id === tCardPrepared?.id ? "container_plan_edit" : ""}`}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_card_text1">&nbsp; {padNumberToFourDigits(elem.number)} -  {date}</div>
        </div>

        <div className="container_icon_edit_save">
          {tCardPrepared?.id === elem.id && <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => saveCardHandler()}
          />}
          <Image className="icon_edit_save"
            src={eraz}
            alt="eraz" width={20} height={20}
            onClick={() => erazCardHandler(elem.id)}
          />
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
            tCards={tCards}
            units={units}
            unitLoads={unitLoads}
            settings={settings}
            schedule={schedule}
            tCardPrepared={tCardPrepared}
            tCardLighted={tCardLighted}
            unitExceptions={unitExceptions}
            erazLoadHandler={erazLoadHandler}
            changeDurationLoadHandler={changeDurationLoadHandler}
            pinLoadHandler={pinLoadHandler}
            unPinLoadHandler={unPinLoadHandler}

          />
        </div>

      </div>
    </Layout>
  )
}