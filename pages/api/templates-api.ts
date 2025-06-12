import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database'; // Подключение к базе данных
import { TemplateTable } from '@/pages/db/models/catalogs/templates';
import { Repository } from 'typeorm';
import { TemplateItem } from '@/types'; // Ваш тип TCardItem для работы с шаблонами
import fs from 'fs';
import path from 'path';
import { updateTemplates } from './handlers-update';  // расчеты



interface RequestBody {
    teamId: number,
    userId: number,
    templates: TemplateItem[],
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const dbConnection = await connectDb();  // Устанавливаем подключение

        // Репозиторий для работы с шаблонами
        const templateRepository = dbConnection.getRepository(TemplateTable);

        const { teamId: getTeamId } = req.query;

        switch (req.method) {
            case 'GET':
                // Получаем все шаблоны для команды
                const templates_ = await templateRepository.find({ where: { team_id: Number(getTeamId) } });

                // Возвращаем найденные шаблоны
                res.status(200).json({
                    success: true,
                    templates: templates_,
                });
                break;
         
            case 'POST':
                  // Извлекаем данные из тела запроса
                        const { templates, userId, teamId } = req.body as RequestBody;
                
                        // СПИСОК ДЕЙСТВИЙ 
                        const resTemplates = await updateTemplates(
                            templateRepository,
                            templates,
                             Number(teamId)
                        )
                        if (!resTemplates.success) {
                          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTemplates.message });
                          return;
                        }
                
                        const savedTemplates = resTemplates.savedTemplates as TemplateTable[];
                
                        const templates__ = savedTemplates
                          .map(template => {
                            return {
                              id: template.id,
                              name: template.name,
                              fileContent:template.fileContent
                            };
                          });
                
                        // отправляем ответ
                        res.status(200).json({
                          success: true,
                          templates: templates__,
                        });
                        break;
               default:
                res.status(405).end(); // Метод не поддерживается
        }
    } catch (error) {
        console.error('Ошибка подключения или выполнения запроса (templates-api):', error);
        res.status(500).json({ error: 'Не удалось обработать запрос' });
    }
}
