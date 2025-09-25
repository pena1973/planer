import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/translate/locale';
import { getTypedRepository } from './../../db/utilites'

import { Repository} from 'typeorm';
import { TeamTable } from './../../db/models/catalogs/teams'

import { TeamItem } from './../../types/types';

interface RequestBody {
  teamId:number,
  title: string,
  coment: string,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {

      case 'POST':
        // Извлекаем данные из тела запроса
        const {teamId, title, coment } = req.body as RequestBody;

        const resTeam = await updateTeam(teamId, title, coment, teamsRepository);

        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
          return;
        }

        const team = resTeam.savedTeam as TeamItem;  //  можно сразу привести типы простые

        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (team-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


async function updateTeam(
  teamId: number,
  title: string,
  coment: string,
  teamsRepository: Repository<TeamTable>,
): Promise<{ success: boolean, savedTeam: TeamItem, message: string }> {
  

    // Находим команду по id
    const team = await teamsRepository.findOne({ where: { id: teamId } });

    // Если команда не найдена
    if (!team) {
      return {
        success: false,
        savedTeam: {} as TeamItem,
        message: 'Команда не найдена.',
      };
    }

    // Обновляем поля команды
    team.title = title;
    team.coment = coment;

    // Сохраняем обновленную команду в базе данных
    const savedTeam = await teamsRepository.save(team);

    return {
      success: true,
      savedTeam: {
        id: savedTeam.id,
        title: savedTeam.title,
        coment: savedTeam.coment,
        prefix: savedTeam.prefix,
        main_team: savedTeam.main_team,
      },
      message: 'Команда успешно обновлена.',
    };
  
}
export default withAuth(handler)