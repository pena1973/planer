// 
export interface MyJwtPayload {
  login: string;
  userId: number;
  teamId: number;  
  exp?: number; // если у тебя есть срок действия
  iat?: number; // issued at — стандартное поле
}