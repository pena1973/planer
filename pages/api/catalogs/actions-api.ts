// pages/api/catalogs/actions-api.ts
// API для получения и обновления действий (actions)
// Используется в настройках команд (TeamSettings) и при создании/редактировании карт (TCardForm)

import { ulogger } from "./../../../lib/common/universal-logger";

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../../db/database';

import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'
import { ActionTable } from './../../../db/models/catalogs/actions';
import { ActionItem } from './../../../types/types';
import { getActions } from './../../../handlers/handlers-get';
import { updateActions } from './../../../handlers/handlers-update';

interface RequestBody {
  userId: number,
  teamId: number,
  actions: ActionItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const actionsRepository = getTypedRepository(db, 'ActionTable', ActionTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET': //!
        const { teamId: teamIdget, userId: userIdget } = req.query;
        const actionsGet = await getActions(Number(userIdget), locale, Number(teamIdget), actionsRepository)

        actionsGet.sort((a, b) => a.id - b.id);

        res.status(200).json({
          success: true,
          actions: actionsGet,
        });

        break;

      case 'POST':

        const { actions, userId, teamId } = req.body as RequestBody;

        const resActions = await updateActions(
          Number(userId),
          locale,
          actionsRepository,
          actions,
          Number(teamId),
        )

        if (!resActions.success) {
          res.status(500).json({ error: resActions.message });
          return;
        }

        const savedActions = resActions.savedActions as ActionTable[];

        const actionsPost = savedActions
          .map(action => {
            return {
              id: action.id,
              code: action.code,
              title: action.title,
              interruptible: action.interruptible,
            };
          });

        actionsPost.sort((a, b) => a.id - b.id);

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actionsPost,
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
      location: "pages/api/action-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)