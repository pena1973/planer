import React from 'react';
import styles from "./arrowButton.module.scss";

interface ArrowButtonProps {
  onClick?: () => void; 
}

// Кнопка "вперед" — стрелка вправо
export const ForwardButton: React.FC<ArrowButtonProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className={styles.arrow_button_forward}      
    />
  );
};

// Кнопка "назад" — стрелка влево
export const BackwardButton: React.FC<ArrowButtonProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className={styles.arrow_button_backward}      
    />
  );
};
