import { withAuth } from '../../../lib/withAuth'
import type { NextApiRequest, NextApiResponse } from 'next';
import { pdf, Font } from '@react-pdf/renderer';
import path from 'node:path';
import React from 'react';
import PDFDoc from '../../../components/PDFDoc/pdfDoc';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites';

import { BillTable } from '../../../db/models/billing/bills';
import { BillRowTable } from '../../../db/models/billing/bill_row';
import { ClientTable } from '../../../db/models/billing/clients';
import { MainTable } from '../../../db/models/billing/main';
import { getBillById } from '../../../handlers/handlers-get';

// // === Шрифты (кириллица) ===
// const fontRegular = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
// const fontBold = path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf');
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: fontRegular, fontWeight: 'normal' },
//     { src: fontBold, fontWeight: 'bold' },
//   ],
// });

interface RequestBody {
  billId: number,
  teamId: number,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const billsRepository = getTypedRepository(db, 'BillTable', BillTable);
  const billRowsRepository = getTypedRepository(db, 'BillRowTable', BillRowTable);
  const mainRepository = getTypedRepository(db, 'MainTable', MainTable);
  const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);
  try {
    switch (req.method) {

      case 'POST':
        // Извлекаем данные из тела запроса
        const { billId, teamId } = req.body as RequestBody;
        try {
          const bill = await getBillById(teamId, billId, billsRepository, billRowsRepository, mainRepository, clientRepository);

          if (!bill) return;

          // Генерация PDF
          const instance = pdf(<PDFDoc bill={bill} />);
          const buffer = await instance.toBuffer();

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="invoice-${bill.id}.pdf"`);
          res.setHeader('Cache-Control', 'no-store');
          return res.status(200).send(buffer);
        } catch (e: unknown) {


          // let errorMessage = "Не удалось обработать запрос.";

          if (e instanceof Error) {

            if (e?.message === 'NOT_FOUND') {
              return res.status(404).json({ error: 'Bill not found' });
            }
            if (e?.message === 'NO_ROWS') {
              return res.status(400).json({ error: 'No bill rows' });
            }
            if (e?.message === 'MULTI_CURRENCY') {
              return res.status(400).json({ error: 'Multiple currencies in one bill are not supported' });
            }
            console.error('PDF render error:', e);
            return res.status(500).json({ error: 'Failed to render PDF' });
          }
        }
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)