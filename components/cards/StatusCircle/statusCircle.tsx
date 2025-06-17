import React from 'react';
import { StatusEnum } from '@/types/types'; 
import styles from "./statusCircle.module.scss";


// Маппинг статуса → цвет
const statusColors: Record<StatusEnum, string> = {
  [StatusEnum.cancelled]: styles.load_cancelled,
  [StatusEnum.performed]: styles.load_performed,
  [StatusEnum.ready]:     styles.load_ready,
  [StatusEnum.planed]:    styles.load_planed,
  [StatusEnum.prepared]:  styles.load_prepared,
  [StatusEnum.defective]: styles.load_defected,
  [StatusEnum.draft]:     styles.load_draft,
  [StatusEnum.closed]:    styles.load_closed,
};

interface StatusCircleProps {
  status: StatusEnum;  
}

export const StatusCircle: React.FC<StatusCircleProps> = ({
  status,
  
}) => {

  const color = statusColors[status] || '#000'; // на случай неизвестного статуса

  return (
    <div
      className={`status ${color} ${styles.circle}`}
      
      title={status}
    />
  );
};
