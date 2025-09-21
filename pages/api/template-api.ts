import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

import { TemplateTable } from './../../db/models/catalogs/templates';
import { TCardItem, TemplateItem } from './../../types/types'; // Ваш тип TCardItem для работы с шаблонами

import { padNumberToFourDigits } from "./../../lib/common/utils"

interface RequestBody {
    teamId: number,
    userId: number,
    tCard: TCardItem,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const db = await connectDb();
    const tCardTemplateRepository = getTypedRepository(db, 'TemplateTable', TemplateTable);

    try {

        const { teamId: getTeamId } = req.query;

        switch (req.method) {
            case 'POST':
                // Извлекаем данные из тела запроса
                const { teamId, userId, tCard } = req.body as RequestBody;

                const name = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date}`

                // Prepare data to export
                const exportData = {
                    date: tCard.date,
                    idc: tCard.idc,
                    products: tCard.products?.map(product => ({
                        idc: product.idc,
                        title: product.title,
                        sync: product.sync,
                        uom: {
                            title: product.uom.title,
                            code: product.uom.code
                        },
                    })) || [],
                    tCardProducts: tCard.tCardProducts?.map(tProduct => ({
                        code: tProduct.code,
                        qtu: tProduct.qtu,
                        productIdc: tProduct.product.idc,

                    })) || [],
                    tCardWastes: tCard.tCardWastes?.map(waste => ({
                        code: waste.code,
                        qtu: waste.qtu,
                        productIdc: waste.product.idc,

                    })) || [],
                    tCardOperations: tCard.tCardOperations?.map(operation => ({
                        idc: operation.idc,
                        stage: operation.stage ? {
                            idc: operation.stage.idc,
                            code: operation.stage.code
                        } : undefined,
                        out: operation.out?.map(outItem => ({
                            code: outItem.code,
                            qtu: outItem.qtu,
                            productIdc: outItem.product.idc,
                        })) || [],
                        inn: operation.inn?.map(innItem => ({
                            code: innItem.code,
                            qtu: innItem.qtu,
                            productIdc: innItem.product.idc,

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

                const template = {
                    id: savedTemplate.id,
                    name: savedTemplate.name,
                    fileContent: savedTemplate.fileContent
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