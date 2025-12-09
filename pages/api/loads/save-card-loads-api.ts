//pages/api/loads/save-card-loads-api.ts
// API для сохранения запланированных лоадов карты
// Используется в планировании карт (CardPlanning)
import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getTCardOperationsByCardId } from './../../../handlers/handlers-get';  // расчеты
import { updateStatusOperationsByOperIds, updateStatusTCard } from './../../../handlers/handlers-update';  // 
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { TCardTable } from './../../../db/models/data/t_cards'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { getStatusPriority } from "./../../../lib/common/utils"
import { TCardItem, UnitLoadItem, StatusEnum, TCardOperationItem } from "./../../../types/types";
import { saveNewLoads } from './../../../handlers/handlers-update';  // расчеты

interface RequestBody {
  tCardLoads: UnitLoadItem[];  // запланированные лоады в статусе prepared  по данной карте
  tCard: TCardItem & { status: StatusEnum },
  teamId: number,
  userId: number
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      // ЗАПИСЬ ЗАПЛАНИРОВАННОЙ КАРТЫ
      case 'POST':
        //  лоады по карте только draft
        const { tCardLoads, tCard, teamId, userId } = req.body as RequestBody;
        // tCardLoads- приходит всегда в статусе prepared, нужно считать остальное      

        // просто сохраняем в базу потому что это всегда новые подготовленные
        const resLoads = await saveNewLoads(Number(userId), locale, unitLoadRepository, tCardLoads, Number(teamId))
        if (!resLoads.success) {
          res.status(200).json({
            success: false,            
            message: `${t('mes.loadsNotSaved')}:  ${resLoads.message}`
          });
          break;
        }
        const savedUnitLoads = resLoads.savedUnitLoads as UnitLoadItem[];

        // Статус Операций  меняем на planed
        const savedOpersIds = Array.from(new Set(savedUnitLoads.map(load => load.id_oper)));

        const resOpers = await updateStatusOperationsByOperIds(Number(userId), locale, tCardOperationsRepository, savedOpersIds, StatusEnum.planed)
        if (!resOpers.success) {
          res.status(200).json({
            success: false,            
            message: `${t('mes.operStatusesNotSaved')}  + ${resOpers.message}`
          });
          break;
        }

        // проверяем все операции карты и если  статусы не ниже текущего  меняем статус самой карты
        const tCardOperations = await getTCardOperationsByCardId(Number(userId), locale, tCard.id, tCardOperationsRepository)

        /////ПРОВЕРКА каждой операции на предмет статуса//////
        // получаю все операции и проверяю их статусы
        // Проверка всех операций карты: если все не ниже текущего статуса
        const isAllOperationsNotLowerThanStatus = tCardOperations.every(operation => {
          // Функция для рекурсивной проверки статуса
          const checkOperationStatus = (op: TCardOperationItem): boolean => {
            if (op.status === StatusEnum.defective) {
              const fixOperation = tCardOperations.find(o => o.fixOperIdc === op.idc);
              if (fixOperation) {
                // Если исправляющая операция тоже дефектная, продолжаем цепочку
                return checkOperationStatus(fixOperation);
              } else {
                // Если исправляющей операции нет или она не дефектная, возвращаем статус операции
                return getStatusPriority(op.status) >= getStatusPriority(StatusEnum.planed);
              }
            } else {
              // Если операция не дефектная, просто возвращаем её статус
              return getStatusPriority(op.status) >= getStatusPriority(StatusEnum.planed);
            }
          };

          // Применяем проверку для текущей операции
          return checkOperationStatus(operation);
        });

        const tCardStatus = (isAllOperationsNotLowerThanStatus) ? StatusEnum.planed : tCard.status
        // Статус Карты  меняем на planed если все операции не ниже текущего статуса

        const resCard = await updateStatusTCard(Number(userId), locale, tCardRepository, tCard.id, tCardStatus)
        if (!resCard.success) {
          res.status(200).json({
            success: false,
            message: `${t('mes.cardStatusNotUpdated')}  + ${resCard.message}`            
          });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardStatus: tCardStatus,
          savedUnitLoads: savedUnitLoads,
        });
        break;

      default:
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/loads/save-card-loads-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)
