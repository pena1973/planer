//pages/api/catalogs/templates-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { TemplateTable } from './../../../db/models/catalogs/templates';
import { TemplateItem } from './../../../types/types';
import { updateTemplates } from './../../../handlers/handlers-update';
import { getTemplates } from './../../../handlers/handlers-get';


interface RequestBody {
  teamId: number,
  userId: number,
  templates: TemplateItem[],
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const templateRepository = getTypedRepository(db, 'TemplateTable', TemplateTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); 

    switch (req.method) {
      case 'GET':
        const { teamId: teamIdget, userId: userIdget } = req.query;
        const templatesGet = await getTemplates(Number(userIdget), locale, Number(teamIdget), templateRepository);

        res.status(200).json({
          success: true,
          templates: templatesGet,
        });
        break;

      case 'POST':
        // Извлекаем данные из тела запроса
        const { templates, userId, teamId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resTemplates = await updateTemplates(
          Number(userId),
          locale,
          templateRepository,
          templates,
          Number(teamId)
        )
        if (!resTemplates.success) {
          res.status(200).json({
            success: false,
            message: resTemplates.message,
          });
          break;
        }

        const savedTemplates = resTemplates.savedTemplates as TemplateTable[];

        const templatesPost = savedTemplates
          .map(template => {
            return {
              id: template.id,
              name: template.name,
              fileContent: template.fileContent
            };
          });

        // отправляем ответ
        res.status(200).json({
          success: true,
          templates: templatesPost,
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
      location: "pages/api/catalogs/templates-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)