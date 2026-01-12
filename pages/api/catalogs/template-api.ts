//pages/api/catalogs/template-api.ts
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
import { TCardItem, TemplateItem } from './../../../types/types'; // Ваш тип TCardItem для работы с шаблонами

import { padNumberToFourDigits } from "./../../../lib/common/utils"

interface RequestBody {
    teamId: number,
    userId: number,
    tCard: TCardItem,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const db = await connectDb();
        const tCardTemplateRepository = getTypedRepository(db, 'TemplateTable', TemplateTable);
        const locale = getLocaleFromHeader(req.headers["x-lang"]);
        const t = getServerT(locale, 'sermes'); 

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
            location: "pages/api/catalogs/template-api",
            event: "api_error",
            message: `catch: ${error}`,
            context: "",
        }).catch(() => { console.error("logger error") });
        res.status(500).json({ error: `${error}` });
    }
}
export default withAuth(handler)