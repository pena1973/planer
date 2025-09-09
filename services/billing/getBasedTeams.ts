

import { Dispatch } from "redux";
import { UOMItem, TeamItem, UserItem } from "./../../types/types";
import { setUOMs } from "./../../store/slices";

export const getBasedTeams = async (teamId: number, token: string) => {

  // TODO: заменить на реальный запрос
  // return { title, reg_n, adress, email, phonel, person }
  return null as null | {
    title: string; reg_n: string; adress: string; email: string; phone: string; person: string;
  };
}