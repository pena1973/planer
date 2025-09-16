
import { TCardTable } from './models/data/t_cards';
import { TCardOperationTable } from './models/data/t_card_operations';
import { TCardProductTable } from './models/data/t_card_products';
import { TCardStageTable } from './models/data/t_card_stages';
import { ProductTable } from './models/data/products';

import { UOMsTable } from './models/catalogs/uoms';
import { ActionTable } from './models/catalogs/actions';
import { TeamTable } from './models/catalogs/teams';
import { UserTable } from './models/catalogs/users';
import { UnitTable } from './models/catalogs/units';
import { UnitActionTable } from './models/catalogs/unit_actions';
import { AgreementTable } from './models/catalogs/agreements';
import { UserAgreeTable } from './models/catalogs/user_agree';
import { UserUnitTable } from './models/catalogs/user_unit';
import { TemplateTable } from './models/catalogs/templates';

import { TeamScheduleTable } from './models/plan/team_schedule';
import { UnitExceptionTable } from './models/plan/unit_exceptions';
import { UnitLoadTable } from './models/plan/unit_loads';
import { SettingsTable } from './models/plan/settings';

import { SupportTable } from './models/support/support';
import { JobSettingsTable } from './models/job/job-settings';
import { BillRowTable } from './models/billing/bill_row';
import { ClientTable } from './models/billing/clients';
import { BanerTable } from './models/support/baners';
import { BalanceTable } from './models/billing/balance';
import { ActiveTimeTable } from './models/billing/active_time';
import { MainTable } from './models/billing/main';
import { VerificationCodeTable } from './models/auth/verification_code';
import {InvoiceTable} from './models/billing/invoice'; 

export const entities = {
  TCardTable,
  TCardOperationTable,
  TCardProductTable,
  TCardStageTable,
  UOMsTable,
  ActionTable,
  TeamTable,
  UserTable,
  UnitTable,
  UnitActionTable,
  AgreementTable,
  UserAgreeTable,
  UserUnitTable,
  TemplateTable,
  TeamScheduleTable,
  UnitExceptionTable,
  UnitLoadTable,
  SettingsTable,
  SupportTable,  
  ProductTable,
  BanerTable,
  BillRowTable,
  ClientTable,
  BalanceTable,
  ActiveTimeTable,
  MainTable,
  VerificationCodeTable,
  InvoiceTable,
  JobSettingsTable
};

export const getEntities = () => Object.values(entities);