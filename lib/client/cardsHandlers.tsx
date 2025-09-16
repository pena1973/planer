// lib/client/cardsHandlers.tsx
// import 'client-only'
"use client"
import { TCardProductItem, TCardOperationItem, StatusEnum } from "@/types/types";

//  проверка наличия материальных активов
// алгоритм такой
//  есть операции у них есть вход и выход у них есть id и источник code
//  есть список продуктов заказа у них мы знаем ид
//   все что вышло из операций (сворачиваем +- и промежуточные продукты схлопываются, остается только выход и вход общие)
// все что вход - материалы
// все что выход это продукты и отходы
//  ищем продукты в выходе и распределяем по источникам, если источников не хватает то источник склад
//  остальной выход - отход
export const checkReconcilation = (
  tCardProductsArg: TCardProductItem[],
  tCardOperationsArg: TCardOperationItem[],

) => {
  const tCardProducts = [] as TCardProductItem[];
  let tCardOperations = [] as TCardOperationItem[];
  let tCardWastes = [] as TCardProductItem[];
  let tCardMaterials = [] as TCardProductItem[];

  // собираю все произведенные (out) МА в операциях исключая брак - он сразу в отходы
  let outArr1 = [] as TCardProductItem[];
  tCardOperationsArg.forEach(toper => {
    if (toper.status === StatusEnum.defective) { // сразу в отход
      tCardWastes = [...tCardWastes, ...toper.out]
    } else {
      outArr1 = [...outArr1, ...toper.out];
    }
  });

  // проверяю все операции на ВХОД in->out (code)
  // чтобы все что было на вход соответствовало out или со склада 
  // если не соответствует беру со склада
  tCardOperations = tCardOperationsArg.map(oper => {
    // просматриваем все oper.inn  и ищем их в outArr и материалах (должно гдето найтись )
    const updatedInn = [] as TCardProductItem[]
    // операция, перебираем вход
    oper.inn.forEach(iteminn => {
      let qtuinn = iteminn.qtu; // количество на входе

      // если источник указан ищем его в out по всем операциям      
      // если источник не указан -  укажем что это материал
      if (!iteminn.code) {
        updatedInn.push({ ...iteminn, code: `M${iteminn.product.idc}` })
      }// количество 0 и источник указан  просто оставляем  -  это новая строка
      else if (qtuinn === 0) {
        updatedInn.push({ ...iteminn })
      }// количество больше 0 и источник указан  распределяем
      else {
        while (qtuinn > 0) {
          const itemoutIndex = outArr1.findIndex(itemout => { 
            return (itemout.code === iteminn.code && itemout.product.idc === iteminn.product.idc && itemout.qtu > 0) })

          // если не нашли - берем со склада
          if (itemoutIndex === -1) {
            updatedInn.push({ ...iteminn, qtu: qtuinn, code: `M${iteminn.product.idc}` })
            qtuinn = 0;
            continue;
          }

          const itemout = outArr1[itemoutIndex];
          let qtuout = itemout.qtu

          const thisQtu = Math.min(qtuinn, qtuout)
          qtuinn = qtuinn - thisQtu; // убираем учтенное количество из входа
          qtuout = qtuout - thisQtu; // убираем учтенное количество из выхода

          // на входе операции
          if (qtuinn === 0) updatedInn.push({ ...iteminn })
          if (qtuinn > 0) updatedInn.push({ ...iteminn, qtu: thisQtu })

          outArr1.splice(itemoutIndex, 1, { ...itemout, qtu: qtuout }); // забрали из out уже учтенное
        }
      }
    }
    )
    return { ...oper, inn: updatedInn };
  })

  let outArr = [] as TCardProductItem[];
  let innArr = [] as TCardProductItem[];
  // собираю все добавленные и все истраченные МА в операциях заново после проверки  на согласованность
  tCardOperations.forEach(toper => {
    if (toper.status !== StatusEnum.defective) outArr = [...outArr, ...toper.out];

    innArr = [...innArr, ...toper.inn];
  });

  // схлопываю по ID+code и единице uom
  outArr = groupAndSumByCodeAndUom(outArr, 1);
  innArr = groupAndSumByCodeAndUom(innArr, -1);
  let resultArr = [...outArr, ...innArr];
  resultArr = groupAndSumByCodeAndUom(resultArr, 1);

  //  плюс на минус схлопываются остается сальдо в разрезе id code uom
  //  остатки +  это результат   остатки- - это материалы
  // Разделяем результат на два массива: положительные и отрицательные остатки
  let positiveArr = resultArr.filter(item => item.qtu > 0); //  то что на выходе
  tCardMaterials = resultArr.filter(item => item.qtu < 0); //  то что на входе

  // проставим источник в материалах
  tCardMaterials = tCardMaterials.map(item => {
    return { ...item, code: `M${item.product.idc}` }
  })

  // а дальше перебираем  продукты (по id) и ищем их на выходе из операций и прописываем номер операции в источник
  // все что осталось в остатках+  -  это отход - тоже прописать источник

  // все что с -  =-  в материалы

  // проходим по продуктам и сворачиваем по idс 
  const tCardProductsByIdc = groupAndSumByIdc(tCardProductsArg);

  // а потом прописываем источник  распределяя на несколько разных если он разбит
  tCardProductsByIdc.forEach(item => {
    let qtu = item.qtu; // все что заказано по этому ИД и что надо распределить по операциям

    // отфильтровали позитив(продукты операций) по id - получится массив с источниками
    const positiveArrByIDproduct = positiveArr.filter(item1 => { return (item1.product.idc === item.product.idc) })

    positiveArrByIDproduct.forEach(item2 => {
      // произведено по этому коду
      let qtuOut = item2.qtu

      // то что есть в продуктах и в результате операций
      const thisQtu = Math.min(qtu, item2.qtu)

      if (thisQtu > 0) {
        tCardProducts.push({ ...item, qtu: thisQtu, code: item2.code })
      }
      //// вычли то что уже распределили из заказанных продуктов
      qtu = qtu - thisQtu;

      // вычли то что уже распределили из произведенного
      qtuOut = qtuOut - thisQtu;

      // остаток произведенного но не попавшего в продукты если есть -  в отходы    
      if (qtuOut > 0) {
        tCardWastes.push({ ...item, qtu: qtuOut, code: item2.code })
      }
    })

    // если после того как проверили произведенное получили остаток указываем его источник со склада
    //  и добавляем позицию в список материалов
    if (qtu > 0) {
      tCardProducts.push({ ...item, qtu: qtu, code: `M${item.product.idc}` })
      tCardMaterials.push({ ...item, qtu: qtu, code: `M${item.product.idc}` })
    }

    // далее убираем этот id+uom из позитива чтобы не обработать его дважды
    positiveArr = positiveArr.filter(item1 => { return !(item1.product.idc === item.product.idc) })
  })
  // после этого в позитиве остались только отходы - запихиваем их туда
  tCardWastes = [...tCardWastes, ...positiveArr];

  // Преобразуем qtu всех элементов в положительное значение
  tCardMaterials = tCardMaterials.map(item => ({
    ...item, qtu: Math.abs(item.qtu)
  }));

  const tCardProducts_ = tCardProducts.sort((a, b) => a.product.idc - b.product.idc);

  // Преобразуем qtu всех элементов в положительное значение
  return { tCardWastesUpdated: tCardWastes, tCardMaterialsUpdated: tCardMaterials, tCardProductsUpdated: tCardProducts_, tCardOperationsUpdated: tCardOperations };
}

export const groupAndSumByCodeAndUom = (arr: TCardProductItem[], koef: number) => {
  // Группируем по code и uom, и суммируем qtu
  const groupedResult: { [key: string]: TCardProductItem } = {};

  arr.forEach(item => {
    // Создаем уникальный ключ для сочетания id, code, и uom
    const key = `${item.product.idc}_${item.code}`;

    if (!groupedResult[key]) {
      // Если ключ еще не существует, создаем новый элемент
      groupedResult[key] = { ...item, qtu: koef * item.qtu };
    } else {
      // Если ключ уже существует, суммируем qtu
      groupedResult[key].qtu += koef * item.qtu;
    }
  });

  // Преобразуем результат обратно в массив
  return Object.values(groupedResult);
};


// Сворачиваем массив по idc (продукту) обнуляя источник возникновения для дальнейшего пересчета
export const groupAndSumByIdc = (arr: TCardProductItem[]) => {
  // Группируем по code и uom, и суммируем qtu
  const groupedResult: { [key: string]: TCardProductItem } = {};

  arr.forEach(item => {
    // Создаем уникальный ключ для сочетания idc
    // const key = `${item.idc}_${item.code}_${item.uom.id}`; //  так не работает дальше
    const key = `${item.product.idc}`; // здесь продукт
    if (!groupedResult[key]) {
      // Если ключ еще не существует, создаем новый элемент с неизвесным источником
      groupedResult[key] = { ...item, qtu: item.qtu, code: "" };
    } else {
      // Если ключ уже существует, суммируем qtu
      groupedResult[key].qtu += item.qtu;
    }
  });

  // Преобразуем результат обратно в массив
  return Object.values(groupedResult);
};


// // Функция глубокого копирования для TCardItem
// export function deepCloneTCardItem(tCard: TCardItem): TCardItem {
//   return {
//     id: tCard.id,
//     date: tCard.date,
//     idc: tCard.idc,
//     modified: tCard.modified,
//     tCardProducts: tCard.tCardProducts ? tCard.tCardProducts.map(product => ({
//       ...product,
//       uom: { ...product.uom } // Если UOM является объектом, его тоже нужно клонировать
//     })) : [],
//     tCardWastes: tCard.tCardWastes ? tCard.tCardWastes.map(waste => ({
//       ...waste,
//       uom: { ...waste.uom }
//     })) : [],
//     tCardOperations: tCard.tCardOperations ? tCard.tCardOperations.map(operation => ({
//       ...operation,
//       stage: { ...operation.stage }, // Клонируем стадию
//       out: operation.out.map(product => ({ ...product })), // Клонируем продукты
//       inn: operation.inn.map(product => ({ ...product })), // Клонируем продукты
//       action: { ...operation.action }, // Клонируем действия
//     })) : [],
//     tCardMaterials: tCard.tCardMaterials ? tCard.tCardMaterials.map(material => ({
//       ...material,
//       uom: { ...material.uom }
//     })) : [],
//     tCardStages: tCard.tCardStages ? tCard.tCardStages.map(stage => ({ ...stage })) : [],
//     maxIdc: tCard.maxIdc,
//     coment: tCard.coment,
//     status: tCard.status,
//   };
// }
