import Layout from "@/components/Layout/layout";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import PlanScaleContainer from "@/components/plan/PlanScaleContainer/planScaleContainer";

import { useState, } from "react";
import Link from 'next/link';

import Image from 'next/image';

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';
import { formatDate, padNumberToFourDigits, } from "@/lib/utils"

import { StatusEnum, TCardItem, UnitItem, UnitLoadItem, UnitTypeEnum, } from "@/types/types";
import { setUnitLoads, setTCardLighted, setTCardPrepared, setTCards } from '@/store/slices'
import { } from '@/store/slices';

import { useTranslation } from 'react-i18next';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


import save from "@/public/save-rem.png";
import eraz from "@/public/erazer1-rem.png";
import light from "@/public/light-rem.png";
import lighton from "@/public/light-on-rem.png";


export default function Planing() {

  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  const [erazLoaderCard, setErazLoaderCard] = useState(NaN); // состояние это id категории  
  const [droploaderCard, setDropLoaderCard] = useState(NaN); // состояние это id категории  

  const [saveLoaderCard, setSaveLoaderCard] = useState(NaN); // состояние это id категории  


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


  const today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)

  // Выбор запланированной карты
  const lightTCardHandler = async (selectedTCard: TCardItem, on: boolean) => {
    if (on) dispatch(setTCardLighted(selectedTCard))
    else dispatch(setTCardLighted({} as TCardItem))
  }

  // Запись запланированной карты
  const saveCardHandler = async () => {
    setSaveLoaderCard(tCardPrepared.id);
    // Фильтруем загрузку по карте  и все что драфт и сохраняем  
    const tCardLoadsPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status === StatusEnum.prepared) })
    const tCardLoadsWithoutPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status !== StatusEnum.prepared) })
    const unitLoadsWithoutCard = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id) })

    if (tCardLoadsPrepared.length === 0) {
      setMessage("");
      setSaveLoaderCard(NaN);
      return;
    }

    try {
      const res = await fetch(`/api/save-card-loads-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCard: tCardPrepared,
            tCardLoads: tCardLoadsPrepared,
            teamId: team.id,
            userId: user.id,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        const error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          const tCardStatus = receivedData.tCardStatus;
          // удалим массив загрузок предварительный и добавим массив загрузок запланированный
          // let _loads = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id && load.status !== 'draft') })
          const savedUnitLoads = receivedData.savedUnitLoads as UnitLoadItem[];
          const updatedLoads = [...unitLoadsWithoutCard, ...tCardLoadsWithoutPrepared, ...savedUnitLoads]
          dispatch(setUnitLoads(updatedLoads))

          //  поменяем статус карты  и после этого она перерисуется в запланированные
          //  и статус операций

          const index = tCards.findIndex(tCard => tCard.id === tCardPrepared.id);

          // idc операций в которых меняем статус
          const operIdc = [...new Set(savedUnitLoads.map(load => load.idc_oper))];

          const tCardOperations = tCards[index].tCardOperations?.map(operation => {
            if (operIdc.includes(operation.idc)) {
              return { ...operation, status: StatusEnum.planed };
            }
            return operation;
          });

          // статус карты меняем только тогда когда все операции будут не ниже этого статуса
          const updatedTCard = { ...tCards[index], status: tCardStatus, tCardOperations: tCardOperations }
          const _tCards = [...tCards]
          _tCards.splice(index, 1, updatedTCard);
          dispatch(setTCardLighted(updatedTCard))
          dispatch(setTCardPrepared({} as TCardItem));
          dispatch(setTCards(_tCards));
          setMessage("Планировка карты успешно записана");
        }
      }
      // } catch (e: any) {
      //   // setMessage(t('service.serverUnavailable') + e.message)            
      // }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }

    setSaveLoaderCard(NaN);
  };

  // Затираем планирование карты только шкалу вперед  - все что прошло уже необратимо
  const erazCardHandler = async (tCardId: number) => {
    setErazLoaderCard(tCardId)
    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardId)
    const unitLoadsWithoutCard = unitLoads.filter(load => load.id_tCard !== tCardId)
    try {
      const res = await fetch(`/api/eraze-card-plan-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCardLoads: tCardLoads,
            tCardId: tCardId,
            today: today.toLocaleDateString("en-CA"),
            teamId: team.id,
            userId: user.id,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        const error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          // Если успешно меняем статусы карты и операций
          const tCardStatus = receivedData.tCardStatus;
          const updatedLoads = [...unitLoadsWithoutCard, ...receivedData.tCardLoads]
          dispatch(setUnitLoads(updatedLoads));

          //  поменяем статус карты если он изменился и после этого она перерисуется в запланированные
          const index = tCards.findIndex(tCard => tCard.id === tCardLighted.id);
          if (tCards[index].status !== tCardStatus) {
            const updatedTCard = { ...tCards[index], status: tCardStatus }
            const _tCards = [...tCards]
            _tCards.splice(index, 1, updatedTCard);
            dispatch(setTCardPrepared(updatedTCard))
            dispatch(setTCardLighted({} as TCardItem));
            dispatch(setTCards(_tCards));
          } else {
            setMessage("Карта уже выполнена и нет операций где статус меняется");
          }
        }
      }
    // } catch (e: any) {
    //   // setMessage(t('service.serverUnavailable') + e.message)            
    //   // }

    // }
    } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}

    setErazLoaderCard(NaN)
  };

  // удаление лоада из контекстного меню для сторонних юнитов
  const erazLoadHandler = async (load_idc: number) => {
    const erazload = unitLoads.find(load => load.idc === load_idc)
    const tCardLoads = unitLoads.filter(load => load.id_tCard === erazload?.id_tCard)
    const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== erazload?.id_tCard)

    const index = tCards.findIndex(tCard => tCard.id === erazload?.id_tCard);

    if (erazload) {

      try {
        const res = await fetch(`/api/eraze-load-plan-api`,
          {
            method: 'post',
            headers: new Headers({
              'Authorization': 'Basic ' + token,
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              erazload: erazload,
              tCardLoads: tCardLoads,
              today: new Date().toLocaleDateString("en-CA"),
              teamId: team.id,
              userId: user.id,
            }),
          }
        );

        if (res.status !== 200) {
          const receivedData = await res.json();
          const error = receivedData.error;
          setMessage(error);
          // setMessage(t('service.serverUnavailable') + res.status);
        } else {
          const receivedData = await res.json();

          const updatedTCard = (receivedData.tCard as TCardItem)
          const tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])

          // обновляем лоады
          const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));
          // меняем карту в списке
          const _tCards = [...tCards]
          _tCards.splice(index, 1, updatedTCard);
          dispatch(setTCards(_tCards));
          // // меняем статус карты
          // const tCards_ = tCards.map(card => (card.id === erazload.id_tCard) ? { ...card, status: StatusEnum.prepared } : card)
          // dispatch(setTCards(tCards_));

          if (receivedData.success) {
            setMessage(" Успешно удалено планирование операции и все последующие зависимые планирования");
          } else {
            setMessage(receivedData.message);
          }
        }
      // } catch (e: any) {
      //   // setMessage(t('service.serverUnavailable') + e.message)            
      // }
      } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}


    }

  }

  // перетаскивание лоада на шкале  возвращает измененное планирование карты
  const moveLoadHandler = async (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => {

    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardPrepared.id)
    const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== tCardPrepared.id)
    //  перетаскивать лоады можем только на этапе prepared
    if (load) {
      if (load.status === StatusEnum.prepared) {
        // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
        // проверяем согласованность предыдущих и перепланируем последующие
        try {
          const res = await fetch(`/api/pre-moveload-api`,
            {
              method: 'post',
              headers: new Headers({
                'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({
                pinnedLoad: load,
                tCardLoads: tCardLoads,
                unit: unit,
                date: date,
                timeStart: timeStart,
                timeFinish: timeFinish,
                today: today.toLocaleDateString("en-CA"),
                userId: user.id,
                teamId: team.id,
              }),
            }
          );

          if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(error);
            // setMessage(t('service.serverUnavailable') + res.status);
          } else {
            const receivedData = await res.json();
            if (receivedData.success) {
              const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
              const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
              dispatch(setUnitLoads(updatedLoads));
              setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
            } else {
              setMessage(receivedData.message);
            }
          }
        // } catch (e: any) {
        //   // setMessage(t('service.serverUnavailable') + e.message)            
        // }
        } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}

      }
    }
  }

  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const pinLoadHandler = async (oper_id: number) => {

    const tCardLoads_ = unitLoads.map(load => {
      return (load.id_oper === oper_id) ? { ...load, isPinned: true } : load
    })
    dispatch(setUnitLoads(tCardLoads_))
  }

  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const unPinLoadHandler = async (operId: number, tCardId: number) => {


    //  последующее перепланирование
    const tCardLoads = unitLoads.filter(load => load.id_tCard === load?.id_tCard)
    const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== load.id_tCard)
    //  перетаскивать лоады можем только на этапе prepared


    // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
    // проверяем согласованность предыдущих и перепланируем последующие
    try {
      const res = await fetch(`/api/pre-unpinload-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: user.id,
            teamId: team.id,
            tCardId: tCardId,
            operId: operId,
            tCardLoads: tCardLoads,
            today: today.toLocaleDateString("en-CA")
          }),
        }
      );

      if (res.status !== 200) {
        const receivedData = await res.json();
        const error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
          const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));
          setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
        } else {
          setMessage(receivedData.message);
        }
      }
    // } catch (e: any) {
    //   // setMessage(t('service.serverUnavailable') + e.message)            
    // }
    } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}

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
    const tCard_ = tCards.find(tCard => tCard.id === Number(itemId))
    if (!tCard_) return
    dispatch(setTCardPrepared(tCard_));

    setIsDragging(false); // Завершаем перетаскивание     
    setDropLoaderCard(Number(itemId))
    //!!!!!!!!!! отправляем на сервер  карту  и там планируем
    //  в базу пока не пишем это предварительный расчет
    // чистим все лоады в статусе prepared (предыдущее несохраненное планирование)
    const unitLoads_ = unitLoads.filter(lo => lo.status !== StatusEnum.prepared)

    const tCardLoadsPlaned = unitLoads_.filter(load => load.id_tCard === tCard_.id && load.status !== StatusEnum.prepared)
    const tCardLoadsWithout = unitLoads_.filter(lo => lo.id_tCard !== tCard_.id)

    try {
      const res = await fetch(`/api/pre-fullcardplan-api?userId=${user.id}&teamId=${team.id}&tCardId=${itemId}&today=${new Date().toLocaleDateString("en-CA")}`,
        {
          method: 'get',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        const error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();

        const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
        const updatedLoads = [...tCardLoadsWithout, ...tCardLoadsPlaned, ...tCardLoads_]
        dispatch(setUnitLoads(updatedLoads));
        if (receivedData.success) {
          setMessage("Карта успешно предварительно запланирована НО НЕЗАПИСАНА! Если все в порядке ЗАПИШИ!");
        } else {
          setMessage(receivedData.message);
        }
      }
    // } catch (e: any) {
    //   // setMessage(t('service.serverUnavailable') + e.message)            
    // }
    } catch (e: unknown) {
  let message = t('service.serverUnavailable');
  if (e instanceof Error) {
    message += e.message;
  }
  setMessage(message);
}


    setDropLoaderCard(NaN)
  };
  ///////////////////////////


  /// ВИЗУАЛИЗАЦИЯ СПИСКА КАРТ
  // временно уберу фильтр  нужен признак по которому я пойму какая карта запланирована а какая нет
  const tCardsToPlan = tCards.filter(tCard => (tCard.status === StatusEnum.prepared && !tCard.modified)) // подготовлен

  const tCardsPlaned = tCards.filter(tCard => (
    tCard.status === StatusEnum.planed
    || tCard.status === StatusEnum.ready
    || tCard.status === StatusEnum.performed)) // запланирован

  const tCardsDefective = tCards.filter(tCard => (tCard.status === StatusEnum.defective)) // запланирован
  // Карты
  const tCardsPlanedReactNodes = tCardsPlaned.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(new Date(elem.date));

    return (
      <div key={index4} className="container_plan_card_planed">
        <div className="container_plan_card_icon_light">
          {droploaderCard === elem.id && <ButtonLoader />}
          {droploaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_plan_card_planed_title">{padNumberToFourDigits(elem.idc)} -  {date}</div>
        </div>

        <div className="container_icon_edit_save">
          {erazLoaderCard === elem.id && <ButtonLoader />}
          {erazLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={eraz}
              alt="eraz" width={20} height={20}
              onClick={() => erazCardHandler(elem.id)}
            />}
          {tCardLighted?.id === elem.id}
        </div>
      </div>
    );
  })
  // Карты
  const tCardsToPlanReactNodes = tCardsToPlan.map((elem, index) => {
    let date = "";
    if (elem.date) date = formatDate(new Date(elem.date));

    return (
      <div key={index}
        className="container_plan_card_prepared">

        <div className={`container_plan_card_icon_light ${elem.id === tCardPrepared?.id ? "container_plan_edit" : ""}`}>
          {droploaderCard === elem.id && <ButtonLoader />}
          {droploaderCard !== elem.id &&
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
          >{padNumberToFourDigits(elem.idc)} - {date}</div>
        </div>

        <div className="container_icon_edit_save">

          {tCardPrepared?.id === elem.id && saveLoaderCard === elem.id && <ButtonLoader />}
          {tCardPrepared?.id === elem.id && saveLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={save}
              alt="arrow" width={20} height={20}
              onClick={() => saveCardHandler()}
            />}

          {erazLoaderCard === elem.id && <ButtonLoader />}
          {erazLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={eraz}
              alt="eraz" width={20} height={20}
              onClick={() => erazCardHandler(elem.id)}
            />}
        </div>
      </div>
    );
  })
  // Карты
  const tCardsDefectiveReactNodes = tCardsDefective.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(new Date(elem.date));

    return (
      <div key={index4} className="container_plan_card_planed">
        <div className="container_plan_card_icon_light">
          {droploaderCard === elem.id && <ButtonLoader />}
          {droploaderCard !== elem.id &&
            (elem.id === tCardLighted.id ?
              <Image className="icon_edit_save" src={lighton} alt="lighton"
                width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
              : <Image className="icon_edit_save" src={light} alt="light"
                width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
          }
          <div className="container_plan_card_planed_title">{padNumberToFourDigits(elem.idc)} -  {date}</div>
        </div>

        <div className="container_icon_edit_save">
          {erazLoaderCard === elem.id && <ButtonLoader />}
          {erazLoaderCard !== elem.id &&
            <Image className="icon_edit_save"
              src={eraz}
              alt="eraz" width={20} height={20}
              onClick={() => erazCardHandler(elem.id)}
            />}
          {tCardLighted?.id === elem.id}
        </div>
      </div>
    );
  })
  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_plan_title">{t('planing.planed')}</div>
          <div className="container_plan_planed_card">
            {tCardsPlanedReactNodes}
          </div>
          <div className="container_plan_title_no"> {t('planing.prepared')}</div>
          <div className="container_plan_prepared_card">
            {tCardsToPlanReactNodes}
          </div>
          <div className="container_plan_title_no"> {t('planing.toFix')}</div>
          <div className="container_plan_defective_card">
            {tCardsDefectiveReactNodes}
          </div>
          <div className="container_plan_title">{t('planing.explanation')}</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right container_plan_right"

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
            // changeDurationLoadHandler={changeDurationLoadHandler}
            moveLoadHandler={moveLoadHandler}
            pinLoadHandler={pinLoadHandler}
            unPinLoadHandler={unPinLoadHandler}

          />
        </div>

      </div>
    </Layout>
  )
}