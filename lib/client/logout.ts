import 'client-only'
import {
    UOMItem, ActionItem, UnitItem, SettingsItem,
    TCardItem, UnitLoadItem, ScheduleItem,
    UnitExceptionItem, UserItem,
    TeamItem
} from './../../types/types'

import { store } from './../../store'
import {
  setToken,
  setUser,
  setTeam,
  setSettings,
  setSignedAgreement,
  setUnit
} from './../../store/slices'

import {
  setActions,
  setUOMs,
  setUnits,
  setTCards,
  setTCardIndex,
  setSchedule,
  setUnitLoads,
  setUnitExceptions
} from './../../store/slices'

import Router from 'next/router'

export function logout(redirectTo = '/') {
  console.warn('[AUTH] 🚪 Полный logout. Очищаем Redux...')

  // authSlice
  store.dispatch(setToken(''))
  store.dispatch(setUser({} as UserItem))
  store.dispatch(setTeam({} as TeamItem))
  store.dispatch(setSettings({} as SettingsItem))
  store.dispatch(setSignedAgreement(false))
  store.dispatch(setUnit({} as UnitItem))

  // dataSlice и другие
  store.dispatch(setActions([] as ActionItem[]))
  store.dispatch(setUOMs([] as UOMItem[]))
  store.dispatch(setUnits([] as UnitItem[]))
  store.dispatch(setTCards([] as TCardItem[]))
  store.dispatch(setTCardIndex(0))
  store.dispatch(setSchedule({} as ScheduleItem))
  store.dispatch(setUnitLoads([] as UnitLoadItem[]))
  store.dispatch(setUnitExceptions([] as UnitExceptionItem[]))

  Router.push(redirectTo)
}
