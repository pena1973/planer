
import { unPinLoad } from '@/services/plan/unPinLoad';
import { erazeLoad } from '@/services/plan/erazeLoad';
import { erazeCard } from '@/services/plan/erazeCard';
import { moveLoad } from '@/services/plan/moveLoad';
import { saveCard } from '@/services/plan/saveCard';

import Layout from "@/components/Layout/layout";
import PlanScaleContainer from "@/components/plan/PlanScaleContainer/planScaleContainer";

import PlanedCardRow from "@/components/plan/PlanedCardRow/planedCardRow";
import ToPlanCardRow from "@/components/plan/ToPlanCardRow/toPlanCardRow";
import DefectiveCardRow from "@/components/plan/DefectiveCardRow/defectiveCardRow";

import { useState, useCallback } from "react";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';


import { useRouter } from 'next/navigation';

import { StatusEnum, TCardItem, UnitItem, UnitLoadItem, UnitTypeEnum, } from "@/types/types";
import { setUnitLoads, setTCardLighted, setTCardPrepared } from '@/store/slices'

import { } from '@/store/slices';

import { useTranslation } from 'react-i18next';
import { getCurrentDateInDate } from "@/lib/client/timezone.client";

export default function Planing() {

  const { t, i18n } = useTranslation();
const { push } = useRouter();
  const dispatch = useAppDispatch();

  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  const [erazLoaderCard, setErazLoaderCard] = useState(NaN); // состояние это id категории  
  const [droploaderCard, setDropLoaderCard] = useState(NaN); // состояние это id категории  
  const [saveLoaderCard, setSaveLoaderCard] = useState(NaN); // состояние это id категории  


  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })
  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const tCards = useAppSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  const units = useAppSelector((state: RootState) => {
    return state.catalogSlice.units;
  })
  const unitActions = useAppSelector((state: RootState) => {
    return state.planSlice.unitActions;
  })
  const tCardPrepared = useAppSelector((state: RootState) => {
    return state.planSlice.tCardPrepared;
  })
  const tCardLighted = useAppSelector((state: RootState) => {
    return state.planSlice.tCardLighted;
  })
  const unitLoads = useAppSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const unitExceptions = useAppSelector((state: RootState) => {
    return state.planSlice.unitExceptions;
  })
  const settings = useAppSelector((state: RootState) => {
    return state.catalogSlice.settings;
  })
  const schedule = useAppSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })

  //показывает текущее состояние активности команды
  const activeTeam = useAppSelector((state: RootState) => {
    return state.viewSlice.activeTeam;
  })

  if (!activeTeam) push('/support')

  const [message, setMessage] = useState(''); // индикация сообщения об ошибках


  // const today = new Date();
  const today = getCurrentDateInDate(schedule.timeZone)
  // today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)

  
  // Выбор запланированной карты
  const lightTCardHandler = useCallback(async (selectedTCard: TCardItem, on: boolean) => {
    if (on) dispatch(setTCardLighted(selectedTCard))
    else dispatch(setTCardLighted({} as TCardItem))
  }, [dispatch]);

  // На сервере
  // Запись запланированной карты
  const saveCardHandler = async () => {
    setSaveLoaderCard(tCardPrepared.id);
    await saveCard(tCardPrepared, unitLoads, tCards, token, user.id, team.id, dispatch, t, setMessage);
    setSaveLoaderCard(NaN);
  }
  // На сервере
  // Затираем планирование карты только шкалу вперед  - все что прошло уже необратимо
  const erazCardHandler = async (tCardId: number) => {
    setErazLoaderCard(tCardId)
    await erazeCard(tCardId, unitLoads, tCards, token, user.id, team.id,
      today.toLocaleDateString("en-CA"), dispatch, t, setMessage,);
    setErazLoaderCard(NaN)
  };
  // На сервере
  // удаление лоада из контекстного меню для сторонних юнитов
  const erazLoadHandler = async (load_idc: number) => {

    await erazeLoad(load_idc, unitLoads, tCards, token, user.id, team.id, dispatch, t, setMessage);

  }
  // На сервере
  // перетаскивание лоада на шкале  возвращает измененное планирование карты
  const moveLoadHandler = async (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => {

    await moveLoad(load, unit, date, timeStart, timeFinish, unitLoads, tCardPrepared.id, token, user.id, team.id, today.toLocaleDateString("en-CA"), dispatch, t, setMessage);

  }

  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const pinLoadHandler = async (oper_id: number, version: number) => {
    // unitLoads.filter(load => load.id_oper ===oper_id )
    const tCardLoads_ = unitLoads.map(load => {
      return (load.id_oper === oper_id && load.version === version) ? { ...load, isPinned: true } : load
    })
    // tCardLoads_.filter(load => load.id_oper ===oper_id )     
    dispatch(setUnitLoads([...tCardLoads_]))
  }
  // На сервере
  // Прикрепление лоада на шкале   возвращает измененное планирование карты
  const unPinLoadHandler = async (operId: number, tCardId: number, version: number) => {
    await unPinLoad(tCardId, operId, unitLoads, today.toLocaleDateString("en-CA"), version,
      token, user.id, team.id, dispatch, t, setMessage);
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
  const tCardsPlanedReactNodes = tCardsPlaned.map((elem, index) => {
    return (<PlanedCardRow
      key={"planed" + index}
      elem={elem}
      droploaderCard={droploaderCard}
      erazLoaderCard={erazLoaderCard}
      tCardLighted={tCardLighted}
      lightTCardHandler={lightTCardHandler}
      erazCardHandler={erazCardHandler}
      // formatDate={formatDate}
    />)
  })
  // Карты
  const tCardsToPlanReactNodes = tCardsToPlan.map((elem, index) => {

    return (<ToPlanCardRow
      key={"toPlan" + index}
      elem={elem}
      tCardPrepared={tCardPrepared}
      droploaderCard={droploaderCard}
      saveLoaderCard={saveLoaderCard}
      erazLoaderCard={erazLoaderCard}
      tCardLighted={tCardLighted}
      isDragging={isDragging}
      // formatDate={formatDate}
      lightTCardHandler={lightTCardHandler}
      saveCardHandler={saveCardHandler}
      erazCardHandler={erazCardHandler}
      handleMouseDownTCard={handleMouseDownTCard}
      handleDragStartTCard={handleDragStartTCard}
    />)

  })
  // Карты
  const tCardsDefectiveReactNodes = tCardsDefective.map((tCard, index) => {
    return (<DefectiveCardRow
      key={"defective" + index}
      tCard={tCard}
      droploaderCard={droploaderCard}
      erazLoaderCard={erazLoaderCard}
      tCardLighted={tCardLighted}
      // formatDate={formatDate}
      lightTCardHandler={lightTCardHandler}
      erazCardHandler={erazCardHandler}
    />)

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
            moveLoadHandler={moveLoadHandler}
            pinLoadHandler={pinLoadHandler}
            unPinLoadHandler={unPinLoadHandler}
            unitActions={unitActions}
            timezone={schedule.timeZone}
          />
        </div>

      </div>
    </Layout>
  )
}