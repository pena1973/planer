import React from 'react';

interface ArrowButtonProps {
  onClick?: () => void;
  style?: React.CSSProperties;
}

// Кнопка "вперед" — стрелка вправо
export const ForwardButton: React.FC<ArrowButtonProps> = ({ onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        width: 0,
        height: 0,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent',
        borderLeft: '15px solid black',
        cursor: 'pointer',
        ...style,
      }}
    />
  );
};

// Кнопка "назад" — стрелка влево
export const BackwardButton: React.FC<ArrowButtonProps> = ({ onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        width: 0,
        height: 0,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent',
        borderRight: '15px solid black',
        cursor: 'pointer',
        ...style,
      }}
    />
  );
};
