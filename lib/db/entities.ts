
import { TCardTable } from './../../db/models/data/t_cards';
import { TCardOperationTable } from './../../db/models/data/t_card_operations';
import { TCardProductTable } from './../../db/models/data/t_card_products';
import { TCardStageTable } from './../../db/models/data/t_card_stages';

import { UOMsTable } from './../../db/models/catalogs/uoms';
import { ActionTable } from './../../db/models/catalogs/actions';
import { TeamTable } from './../../db/models/catalogs/teams';
import { UserTable } from './../../db/models/catalogs/users';
import { UnitTable } from './../../db/models/catalogs/units';
import { UnitActionTable } from './../../db/models/catalogs/unit_actions';
import { AgreementTable } from './../../db/models/catalogs/agreements';
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { UserUnitTable } from './../../db/models/catalogs/user_unit';
import { TemplateTable } from './../../db/models/catalogs/templates';

import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { UnitExceptionTable } from './../../db/models/plan/unit_exceptions';
import { UnitLoadTable } from './../../db/models/plan/unit_loads';
import { SettingsTable } from './../../db/models/plan/settings';

import { SupportTable } from './../../db/models/support/support';
import { BillTable } from './../../db/models/support/bills';

export const getEntities = () => [
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
  BillTable,
];
