import {
    UnitActionItem, TCardProductItem, TCardOperationItem,
    TCardItem, UnitLoadItem,
    CalendarItem, TimeTypeEnum, StatusEnum,
    UnitItem
} from "@/types";


// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
    const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
    const year = date.getFullYear();  // Год

    return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};

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


function findAvailableTimeForOperation(
    tCard: TCardItem,
    compatibleuUnits: UnitItem[], // массив юнитов которые могут выполнить эту операцию
    unitLoadItems: UnitLoadItem[], // массив загрузок юнитов
    operation: TCardOperationItem, // операция с продолжительностью
    targetDate: Date, // дата для выполнения операции
    moment: number, // время операции
    stopDate: Date// Дата дальше которой планирование не рассчитываем
): { updatedUnitLoad: UnitLoadItem, dateReady: Date, timeReady: number } | undefined {

    // Проверяем, если текущая дата больше стоп даты
    if (targetDate.getTime() > stopDate.getTime()) {
        console.log("Не удалось запланировать" + tCard)
        return undefined; // Если текущая дата больше стоп даты, возвращаем юнит с существующей загрузкой
    }

    // Константы для рабочего времени
    const workDay = generateCalendarItem(targetDate); // Получаем объект календаря для текущего дня   
    const operationDuration = Math.ceil(operation.duration / (1000 * 60)); // Продолжительность операции в минутах округленное в большую сторону
    const interruptible = operation.action.interruptible; // можно прервать
    const possibleUnits: { unit: UnitItem, availableStart: number }[] = [];

    let bestAvailableUnit: UnitItem | undefined = undefined;

    // Проверяем каждый юнит на наличие свободного времени
    compatibleuUnits.forEach(unit => {

        const loads = unitLoadItems.filter(load => load.unit.id === unit.id);
        // const loads = unitLoadItem.unitDates;
        const retool = unit.retool; //  время на переналадку

        // Массив для занятых промежутков
        const busyPeriods: { type: TimeTypeEnum, start: number, end: number }[] = [];

        // Добавляем перерывы в рабочее время (они также будут занятыми промежутками)
        workDay.breaks.forEach(breakPeriod => {
            busyPeriods.push({ type: TimeTypeEnum.B, start: breakPeriod.timeStart, end: breakPeriod.timeFinish });
        });

        // Ищем загрузку для указанной даты
        // const dateLoad = loads.filter(load => load.date.getDate() === targetDate.getDate());
        const dateLoad = loads.filter(load => load.date === targetDate.toLocaleDateString('en-CA'));

        //  а здесь определим возможный рабочий день Юнита по календарю
        let workStart = workDay.timeStartWork
        let workEnd = workDay.timeFinishWork
        //  проверяем исключения и если они есть ищем периоды W которые увеличат рабочий день

        if (dateLoad.length > 0) {

            // // 1. Если есть данные на дату, проверяем исключения типа W (дополнительное рабочее время)
            // const exceptionsW = dateLoad.calendarExceptions?.filter(elem => elem.type === TimeTypeEnum.W);
            // if (exceptionsW && exceptionsW.length > 0) {
            //     // Накладываем дополнительное рабочее время
            //     exceptionsW.forEach(ex => {
            //         const additionalTimeStart = ex.timeStart;
            //         const additionalTimeEnd = ex.timeFinish;

            //         // Увеличиваем рабочее время
            //         workStart = Math.min(workStart, additionalTimeStart);
            //         workEnd = Math.max(workEnd, additionalTimeEnd);
            //     });
            // }

            // 2. Определяем занятые промежутки (выполнение рабочих операций которые уже запланированы)
            dateLoad.forEach(load => {
                busyPeriods.push({
                    type: TimeTypeEnum.W,
                    start: load.timeStart, // округляю до минут  (в планировании сразу добавлено время на переналадку)
                    end: load.timeFinish //  в минутах
                });
            });

            // // 3. Проверяем исключения типа N (индивидуальное нерабочее время )
            // const exceptionsN = dateLoad.calendarExceptions?.filter(elem => elem.type === TimeTypeEnum.N);
            // if (exceptionsN && exceptionsN.length > 0) {
            //     // Добавляем нерабочие промежутки в список занятых
            //     exceptionsN.forEach(ex => {
            //         busyPeriods.push({ type: TimeTypeEnum.N, start: ex.timeStart, end: ex.timeFinish });
            //     });
            // }
        }
        // Сортируем занятые промежутки по времени начала
        busyPeriods.sort((a, b) => a.start - b.start);

        ///////////////////  ПОИСК Свободного промежутка времени для операции

        // Поиск свободного времени в рабочем, учитывая исключения и расписание календаря(выходные)
        let availableStart = workStart;

        for (let period of busyPeriods) {
            
            // Если операция может вписаться в промежуток до начала текущего занятого периода
            if (availableStart + operationDuration + retool <= period.start) {
                // Проверяем, что операция помещается в рабочие часы
                // if (availableStart + operationDuration <= workEnd && !interruptible) {
                if (availableStart + operationDuration <= workEnd) {
                    const unitAvailableTime = availableStart;

                    // Добавляем юнита и его возможное время начала в массив возможных юнитов
                    possibleUnits.push({ unit: unit, availableStart: unitAvailableTime });

                    // // Сдвигаем начало свободного времени за текущий занятый период
                    // availableStart = Math.max(availableStart, period.end);
                }
            }
            // Сдвигаем начало свободного времени за текущий занятый период
            availableStart = Math.max(availableStart, period.end);
        }

        // Если после всех занятых промежутков остается время до конца рабочего дня
        if (availableStart +  operationDuration + retool <= workEnd) {
            const unitAvailableTime = availableStart;

            // Добавляем юнита и его возможное время начала в массив возможных юнитов
            possibleUnits.push({ unit: unit, availableStart: unitAvailableTime });
        }
    })

    //////////////////////////////
    // Теперь ищем юнита с самым ранним доступным временем
    if (possibleUnits.length > 0) {
        possibleUnits.sort((a, b) => a.availableStart - b.availableStart); // Сортируем по времени начала
        // Получаем юнита с самым ранним временем начала
        bestAvailableUnit = possibleUnits[0].unit;
    }

    // Если мы нашли лучший юнит, то возвращаем его с планируемой операцией
    if (bestAvailableUnit) {
        const unit = bestAvailableUnit;
        // let unitDates = bestAvailableUnit.unitDates;

        const loadItem: UnitLoadItem = {
            idc_oper: operation.idc,
            unit: unit,
            date: targetDate.toLocaleDateString('en-CA'),
            id_tCard: tCard.id, // id карты
            timeStart: possibleUnits[0].availableStart,
            timeFinish: possibleUnits[0].availableStart + operationDuration + unit.retool,
            status: StatusEnum.Dr
        };
        let dateReady = targetDate;
        let timeReady = loadItem.timeFinish;

        return {
            updatedUnitLoad: loadItem,
            dateReady: dateReady,
            timeReady: timeReady
        };
    }

    // Если для этой даты не нашли, проверяем следующий день
    targetDate.setDate(targetDate.getDate() + 1); // Следующий день
    return findAvailableTimeForOperation(tCard, compatibleuUnits, unitLoadItems, operation, targetDate, moment, stopDate); // Рекурсивный вызов для следующего дня
}


// В этом модуле делаем РАСЧЕТ ПЛАНИРОВАНИЯ, возврашаем готовую загрузку
export const planTCard = (tCard: TCardItem, units: UnitItem[], unitLoads: UnitLoadItem[]) => {

    // // Извлекаем объекты 'unit'
    // const units = unitLoads
    //     .map(item => item.unit)
    //     .filter((value, index, self) =>
    //         index === self.findIndex((t) => (t.id === value.id)) // Проверяем, что юнит уникален
    //     );

    let updatedUnitLoads = [...unitLoads];
    let today = new Date();
    today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)
    const stopDate = new Date();
    stopDate.setDate(stopDate.getDate() + 90);

    // массив готовых продуктов и дата время готовности каждого продукта
    // стартуем с продуктов которые уже готовы и берутся со склада  если есть      
    let readyProducts: { product: TCardProductItem; date: Date; time: number }[] = [];
    if (tCard.tCardMaterials)
        readyProducts = tCard.tCardMaterials.map(material => {
            return { product: material, date: today, time: 0 };
        });

    // Массив всех операций, которые должны быть запланированы (статус драфт )
    let tCardOperations: TCardOperationItem[] = [];
    if (tCard.tCardOperations)
        tCardOperations = tCard.tCardOperations.filter(elem => elem.status === "draft")

    // Массив для отобранных операций  (они готовы для планирования с учетом последовательности))
    let selectedOperations: TCardOperationItem[] = [];

    // здесь стартуем цикл планирования с сегодняшней даты пока операций для планирования в tCardOperations не останется
    let stoploop = false;
    while (tCardOperations.length > 0) {
        // ищем операции исходники для которых готовы
        tCardOperations.forEach((operation) => {
            let hasAllMatchingProducts = operation.inn.every(innProduct => {
                // Ищем продукт в tCardReady с таким же codeS и uom
                const matchingReadyProduct = readyProducts.find(elem =>
                    elem.product.codeS === innProduct.codeS && elem.product.uom.id === innProduct.uom.id
                );
                // Если соответствующий продукт найден, проверяем количество
                if (matchingReadyProduct) {
                    // Если количество в tCardReady недостаточно для операции, пропускаем операцию
                    if (matchingReadyProduct.product.qtu < innProduct.qtu) {
                        return false;
                    }
                    // Если количество в tCardReady больше, уменьшаем его на количество, использованное в операции
                    matchingReadyProduct.product.qtu -= innProduct.qtu;
                    return true;
                }
                return false; // Если продукта нет или не совпадает по uom
            });

            // Если все продукты прошли проверку, добавляем операцию в selectedOperations
            if (hasAllMatchingProducts) {
                selectedOperations.push(operation);
            }
        });

        ////////////////////////////////////
        if (selectedOperations.length === 0) break;  // нет операций готовых к выполнению 

        ////////////////////////////////////
        // Фильтруем только те продукты, у которых qtu > 0
        readyProducts = readyProducts.filter(elem => elem.product.qtu > 0);

        ////////////////////////////////////
        // Перебираем все операции которые готовы к выполнению
        selectedOperations.forEach((operation) => {
            // Получаем действие для текущей операции
            const action = operation.action;

            // Находим все юниты, которые могут выполнить это действие 
            const compatibleuUnits = units.filter(unit => {
                return unit.actions.some(unitAction => unitAction.action.id === action.id);
            });


            // Ищем подходящий интервал в соответствие с расписанием юнита, 
            // на этот момент также дожны быть готовы исходные продукты и с этого момента операция может стартовать
            let date = today;
            let moment = 0;

            // Возвращаем юнит с добавленной операцией,  если юнит не нашелся возвращаем  undefined
            let resultPlaning = findAvailableTimeForOperation(tCard, compatibleuUnits, updatedUnitLoads, operation, date, moment, stopDate);

            // если не удалось запланировать то прерываем расчет
            if (!resultPlaning) {
                stoploop = true;
            } else {
                let { updatedUnitLoad, dateReady, timeReady } = resultPlaning;
                updatedUnitLoads.push(updatedUnitLoad);
                //  Удаляем операцию из общего массива
                const index = tCardOperations.findIndex(oper => oper.id === operation.id);
                tCardOperations.splice(index, 1);

                //   операцию распределили  добавляем продукты произведенные операцией со сроком готовности                    
                if (operation.out) {
                    let readyProductsOut = operation.out.map(elem => {
                        return { product: elem, date: dateReady, time: timeReady };
                    });
                    readyProducts = [...readyProducts, ...readyProductsOut]
                }
            }
        });

        // очищаю массив выбранных операций  для новой порции
        selectedOperations = [] as TCardOperationItem[];

        if (stoploop) {
            return undefined;    // если не удалось запланировать        
        }
    };
    return updatedUnitLoads;
}