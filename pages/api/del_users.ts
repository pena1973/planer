
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { UserTable } from '@/pages/db/models/catalogs/users';

import { getRepository } from 'typeorm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDb();
  const userRepository = getRepository(UserTable);
  
  switch (req.method) {
    case 'GET':
      const users = await userRepository.find();
      res.status(200).json(users);
      break;
    case 'POST':
      const {email,login,pass,loginhash,locale,cookieagree,role,confirmed,coment,teamId } = req.body;
      // const newUser = userRepository.create({ email, login, pass,loginhash,locale,cookieagree,role,confirmed,coment,teamId });
      // await userRepository.save(newUser);
      // res.status(201).json(newUser);
      break;
    default:
      res.status(405).end(); // Метод не поддерживается
  }
}

