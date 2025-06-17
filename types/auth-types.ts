// 
export interface MyJwtPayload {
  login: string;
  userId: number;
  teamId: number;
  role?: string;
  exp?: number; // если у тебя есть срок действия
  iat?: number; // issued at — стандартное поле
}