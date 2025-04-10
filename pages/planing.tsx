import Layout from "@/components/Layout/layout";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import PlanScaleContainer from "@/components/plan/PlanScaleContainer/planScaleContainer";

import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { fillGaps } from "@/utils"

import Image from 'next/image';

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';
import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

import { StatusEnum, TCardItem, UnitItem, UnitLoadItem, UnitTypeEnum } from "@/types";
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
    let tCardLoadsPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status === StatusEnum.prepared) })
    let tCardLoadsWithoutPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status !== StatusEnum.prepared) })
    let unitLoadsWithoutCard = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id) })
    try {
      const res = await fetch(`/api/save-card-loads-api?userId=${1}&companyId=${1}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCard: tCardPrepared,
            tCardLoads: tCardLoadsPrepared
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
          // let _loads = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id && load.status !== 'draft') })
          let savedUnitLoads = receivedData.savedUnitLoads as UnitLoadItem[];
          let updatedLoads = [...unitLoadsWithoutCard, ...tCardLoadsWithoutPrepared, ...savedUnitLoads]
          dispatch(setUnitLoads(updatedLoads))


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
  const erazCardHandler = async (tCardId: number) => {
    let tCardLoads = unitLoads.filter(load => load.id_tCard === tCardId)
    let unitLoadsWithoutCard = unitLoads.filter(load => load.id_tCard !== tCardId)
    try {
      const res = await fetch(`/api/eraze-card-plan-api?userId=${1}&companyId=${1}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCardLoads: tCardLoads,
            tCardId: tCardId,
            today: today.toLocaleDateString("en-CA"),
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
          const updatedLoads = [...unitLoadsWithoutCard, ...receivedData.tCardLoads]
          dispatch(setUnitLoads(updatedLoads));

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
      // }

    }

  };

  // удаление лоада из контекстного меню для сторонних юнитов
  const erazLoadHandler = async (load_idc: number) => {
    let erazload = unitLoads.find(load => load.idc === load_idc)
    let tCardLoads = unitLoads.filter(load => load.id_tCard === erazload?.id_tCard)
    let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== erazload?.id_tCard)

    if (erazload) {

      try {
        const res = await fetch(`/api/eraze-load-plan-api?userId=${1}&companyId=${1}`,
          {
            method: 'post',
            headers: new Headers({
              // 'Authorization': 'Basic ' + token,
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              erazload: erazload,
              tCardLoads: tCardLoads,
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
          let tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
          let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));

          // меняем статус карты
          const tCards_ = tCards.map(card => (card.id === erazload.id_tCard) ? { ...card, status: StatusEnum.prepared } : card)
          dispatch(setTCards(tCards_));

          if (receivedData.success) {
            setMessage(" Успешно удалено планирование операции и все последующие зависимые планирования");
          } else {
            setMessage(receivedData.message);
          }
        }
      } catch (e: any) {
        // setMessage(t('service.noConnection') + e.message)            
      }

    }

  }

  // перетаскивание лоада на шкале  возвращает измененное планирование карты
  const moveLoadHandler = async (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => {

    let tCardLoads = unitLoads.filter(load => load.id_tCard === tCardPrepared.id)
    let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== tCardPrepared.id)
    //  перетаскивать лоады можем только на этапе prepared
    if (load) {
      if (load.status === StatusEnum.prepared) {
        // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
        // проверяем согласованность предыдущих и перепланируем последующие
        try {
          const res = await fetch(`/api/pre-moveload-api?userId=${1}&companyId=${1}`,
            {
              method: 'post',
              headers: new Headers({
                // 'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({
                pinnedLoad: load,
                tCardLoads: tCardLoads,
                unit: unit,
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
            if (receivedData.success) {
              let tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
              let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
              dispatch(setUnitLoads(updatedLoads));
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
  const pinLoadHandler = async (oper_id: number) => {

    let tCardLoads_ = unitLoads.map(load => {
      return (load.id_oper === oper_id) ? { ...load, isPinned: true } : load
    })
    dispatch(setUnitLoads(tCardLoads_))
  }

  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const unPinLoadHandler = async (operId: number, tCardId: number) => {


    //  последующее перепланирование
    let tCardLoads = unitLoads.filter(load => load.id_tCard === load?.id_tCard)
    let tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== load.id_tCard)
    //  перетаскивать лоады можем только на этапе prepared


    // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
    // проверяем согласованность предыдущих и перепланируем последующие
    try {
      const res = await fetch(`/api/pre-unpinload-api?userId=${1}&companyId=${1}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCardId: tCardId,
            operId: operId,
            tCardLoads: tCardLoads,
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
        if (receivedData.success) {
          let tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
          let updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));
          setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
        } else {
          setMessage(receivedData.message);
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  }


  // Изменение длительности лоада для сторонних юнитов Контекстное меню
  const changeDurationLoadHandler = async (idc: number) => {

  }


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
    // Получаем id перетаскиваемого элемента в строковом виде и это будет id карты
    const itemId = event.dataTransfer.getData("itemId");
    let tCard_ = tCards.find(tCard => tCard.id === Number(itemId))
    if (!tCard_) return
    dispatch(setTCardPrepared(tCard_));

    setIsDragging(false); // Завершаем перетаскивание     
    //!!!!!!!!!! отправляем на сервер  карту  и там планируем
    //  в базу пока не пишем это предварительный расчет
    // чистим все лоады в статусе prepared (предыдущее несохраненное планирование)
    let unitLoads_ = unitLoads.filter(lo => lo.status !== StatusEnum.prepared)

    let tCardLoadsPlaned = unitLoads_.filter(load => load.id_tCard === tCard_.id && load.status !== StatusEnum.prepared)
    let tCardLoadsWithout = unitLoads_.filter(lo => lo.id_tCard !== tCard_.id)

    try {
      const res = await fetch(`/api/pre-fullcardplan-api?userId=${1}&companyId=${1}&tCardId=${itemId}&today=${new Date().toLocaleDateString("en-CA")}`,
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

        let tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
        let updatedLoads = [...tCardLoadsWithout, ...tCardLoadsPlaned, ...tCardLoads_]
        dispatch(setUnitLoads(updatedLoads));
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
      <div key={index4} className="container_plan_card_planed">
        <div className="container_plan_card_icon_light">
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_plan_card_planed_title">{padNumberToFourDigits(elem.number)} -  {date}</div>
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
        className="container_plan_card_prepared">

        <div className={`container_plan_card_icon_light ${elem.id === tCardPrepared?.id ? "container_plan_edit" : ""}`}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_plan_card_prepared_title draggable-item"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDownTCard} // Добавляем обработчик нажатия мыши при перетаскивании        
            draggable
            onDragStart={(e) => handleDragStartTCard(e, elem.id)}
          >{padNumberToFourDigits(elem.number)} -  {date}</div>
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
            units={units.filter(unit => unit.type !== UnitTypeEnum.control)}
            unitLoads={unitLoads}
            settings={settings}
            schedule={schedule}
            tCardPrepared={tCardPrepared}
            tCardLighted={tCardLighted}
            unitExceptions={unitExceptions}
            erazLoadHandler={erazLoadHandler}
            changeDurationLoadHandler={changeDurationLoadHandler}
            moveLoadHandler={moveLoadHandler}
            pinLoadHandler={pinLoadHandler}
            unPinLoadHandler={unPinLoadHandler}

          />
        </div>

      </div>
    </Layout>
  )
}