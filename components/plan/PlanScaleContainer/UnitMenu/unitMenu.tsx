
import { UnitActionItem } from '@/types/types';
import React from 'react';
import styles from "./unitMenu.module.scss";

interface UnitMenuProps {
  unitActions: UnitActionItem[]

}

const UnitMenu: React.FC<UnitMenuProps> = ({
  unitActions,

}) => {

  const unitActionsReactNodes = unitActions.map(elem => {
    return (
      <div key={elem.id} className={styles.container_menu_item} >
        <div className={styles.menu_title}>{elem.action.title}</div>
        <div className={styles.menu_koef}>koef:{elem.koef}   </div>
      </div>
    )
  });
  return (
    <div className={styles.container_unit_menu}>    
      {unitActionsReactNodes}
    </div>
  )
};

export default UnitMenu;
