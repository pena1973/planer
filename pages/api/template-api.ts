import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database'; // Подключение к базе данных
import { TemplateTable } from '@/db/models/catalogs/templates';
import { TCardItem, TemplateItem } from '@/types/types'; // Ваш тип TCardItem для работы с шаблонами

import { padNumberToFourDigits } from "@/utils"

interface RequestBody {
    teamId: number,
    userId: number,
    tCard: TCardItem,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const dbConnection = await connectDb();  // Устанавливаем подключение

        // Репозиторий для работы с шаблонами
        const tCardTemplateRepository = dbConnection.getRepository(TemplateTable);

        const { teamId: getTeamId } = req.query;

        switch (req.method) {
            // case 'GET':
            //     // Получаем все шаблоны для команды
            //     const templates = await tCardTemplateRepository.find({ where: { team_id: Number(getTeamId) } });

            //     // Возвращаем найденные шаблоны
            //     res.status(200).json({
            //         success: true,
            //         templates: templates,
            //     });
            //     break;

            // нужно переименование
            case 'POST':
                // Извлекаем данные из тела запроса
                const { teamId, userId, tCard } = req.body as RequestBody;

                const name = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date}`

                // Prepare data to export
                const exportData = {
                    date: tCard.date,
                    idc: tCard.idc,
                    tCardProducts: tCard.tCardProducts?.map(product => ({
                        idc: product.idc,
                        code: product.code,
                        title: product.title,
                        qtu: product.qtu,
                        uom: {
                            title: product.uom.title,
                            code: product.uom.code
                        }
                    })) || [],
                    tCardWastes: tCard.tCardWastes?.map(waste => ({
                        idc: waste.idc,
                        code: waste.code,
                        title: waste.title,
                        qtu: waste.qtu,
                        uom: {
                            title: waste.uom.title,
                            code: waste.uom.code
                        }
                    })) || [],
                    tCardOperations: tCard.tCardOperations?.map(operation => ({
                        idc: operation.idc,
                        stage: operation.stage ? {
                            idc: operation.stage.idc,
                            code: operation.stage.code
                        } : undefined,
                        out: operation.out?.map(outItem => ({
                            idc: outItem.idc,
                            code: outItem.code,
                            title: outItem.title,
                            qtu: outItem.qtu,
                            uom: {
                                title: outItem.uom.title,
                                code: outItem.uom.code
                            }
                        })) || [],
                        inn: operation.inn?.map(innItem => ({
                            idc: innItem.idc,
                            code: innItem.code,
                            title: innItem.title,
                            qtu: innItem.qtu,
                            uom: {
                                title: innItem.uom.title,
                                code: innItem.uom.code
                            }
                        })) || [],
                        action: operation.action ? {
                            code: operation.action.code,
                            title: operation.action.title
                        } : undefined,
                        duration: operation.duration,
                        status: operation.status,
                        coment: operation.coment
                    })) || [],
                    tCardStages: tCard.tCardStages?.map(stage => ({
                        idc: stage.idc,
                        code: stage.code
                    })) || [],
                    maxIdc: tCard.maxIdc,
                    coment: tCard.coment,
                    status: tCard.status
                };

                // Convert data to JSON
                const jsonContent = JSON.stringify(exportData, null, 2);

                // Создаем новый шаблон
                const newTemplate = new TemplateTable();
                newTemplate.name = name;
                newTemplate.team_id = teamId;
                newTemplate.fileContent = jsonContent;  // Сохраняем содержимое JSON файла

                // Сохраняем в базу данных
                const savedTemplate = await tCardTemplateRepository.save(newTemplate);

                const template={
                    id:savedTemplate.id,
                    name:savedTemplate.name,
                    fileContent:savedTemplate.fileContent
                } as TemplateItem;

                // Возвращаем успешный ответ
                res.status(200).json({
                    success: true,
                    template: template,
                });
                break;
            
                // Нужно Удаление

            default:
                res.status(405).end(); // Метод не поддерживается
        }
    } catch (error) {
        console.error('Ошибка подключения или выполнения запроса (template-api):', error);
        res.status(500).json({ error: 'Не удалось обработать запрос' });
    }
}
export default withAuth(handler)