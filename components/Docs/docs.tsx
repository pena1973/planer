// import React, { useState } from 'react';
// import styles from './helpTree.module.scss';
// import { useTranslation } from 'react-i18next';

// interface TreeNode {
//   title: string;
//   content?: string;
//   children?: TreeNode[];
// }

// const helpContent: TreeNode[] = [
//   {
//     title: 'section.general',
//     children: [
//       {
//         title: 'section.general.description',
//         content: 'section.general.description.text'
//       },
//       {
//         title: 'section.general.usage',
//         children: [
//           {
//             title: 'section.general.usage.sub1',
//             content: 'section.general.usage.sub1.text'
//           },
//           {
//             title: 'section.general.usage.sub2',
//             content: 'section.general.usage.sub2.text'
//           }
//         ]
//       }
//     ]
//   },
//   {
//     title: 'section.privacy',
//     children: [
//       {
//         title: 'section.privacy.cookies',
//         content: 'section.privacy.cookies.text'
//       }
//     ]
//   }
// ];

// const HelpTree: React.FC = () => {
//   const { t } = useTranslation('help');
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({});

//   const toggle = (path: string) => {
//     setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
//   };

//   const renderTree = (nodes: TreeNode[], path: string = ''): JSX.Element[] => {
//     return nodes.map((node, index) => {
//       const currentPath = `${path}${index}`;
//       const isOpen = expanded[currentPath];

//       return (
//         <div key={currentPath} className={styles.node}>
//           <div className={styles.title} onClick={() => toggle(currentPath)}>
//             <span className={styles.toggle}>{node.children ? (isOpen ? '−' : '+') : '•'}</span>
//             {t(node.title)}
//           </div>
//           {isOpen && node.children && (
//             <div className={styles.children}>{renderTree(node.children, `${currentPath}-`)}</div>
//           )}
//           {isOpen && node.content && (
//             <div className={styles.content}>{t(node.content)}</div>
//           )}
//         </div>
//       );
//     });
//   };

//   return <div className={styles.container}>{renderTree(helpContent)}</div>;
// };

// export default HelpTree;


// 👇 Sample help data for HelpTree component
export const items = [
  {
    title: 'Работа с карточками',
    content: 'Здесь вы узнаете, как создавать и редактировать карточки.',
    children: [
      {
        title: 'Создание карточки',
        content: 'Нажмите кнопку "Создать", чтобы открыть форму новой карточки.',
      },
      {
        title: 'Редактирование карточки',
        content: 'Выберите карточку из списка и нажмите "Редактировать".',
        children: [
          {
            title: 'Изменение статуса',
            content: 'Статус можно выбрать из выпадающего списка в правом углу карточки.',
          },
          {
            title: 'Удаление карточки',
            content: 'Кнопка "Удалить" станет доступна, если вы — администратор.',
          },
        ],
      },
    ],
  },
  {
    title: 'Планирование операций',
    content: 'Узнайте, как распределять операции по временной шкале.',
    children: [
      {
        title: 'Перетаскивание операций',
        content: 'Операции можно переносить мышью, удерживая левую кнопку.',
      },
      {
        title: 'Закрепление операций',
        content: 'Используйте значок "булавки", чтобы закрепить операцию в конкретном интервале.',
      },
    ],
  },
  {
    title: 'Отчётность',
    content: 'Система позволяет формировать отчёты по готовности и срокам.',
    children: [
      {
        title: 'Отчёт по состоянию карточек',
        content: 'В разделе "Отчёты" выберите вкладку "Карточки" и примените фильтры.',
      },
    ],
  },
];


import React, { useState } from "react";
import styles from "./docs.module.scss";
import { useTranslation } from "react-i18next";

export interface HelpItem {
  title: string;
  content?: string;
  children?: HelpItem[];
}

interface HelpTreeProps {
  // items: HelpItem[];
}

const HelpTree: React.FC<HelpTreeProps> = ({  }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.treeContainer}>
      {items.map((item, index) => (
        <TreeNode key={index} item={item} level={0} />
      ))}
    </div>
  );
};

const TreeNode: React.FC<{ item: HelpItem; level: number }> = ({ item, level }) => {
  const [expanded, setExpanded] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className={`${styles.treeNode} ${styles[`level${level}`]}`}> 
      <div className={styles.nodeHeader} onClick={() => setExpanded(!expanded)}>
        {hasChildren && (
          <span className={styles.toggle}>{expanded ? "−" : "+"}</span>
        )}
        <span className={styles.title}>{item.title}</span>
      </div>
      {expanded && (
        <div className={styles.nodeContent}>
          {item.content && <div className={styles.content}>{item.content}</div>}
          {hasChildren && item.children!.map((child, i) => (
            <TreeNode key={i} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpTree;
