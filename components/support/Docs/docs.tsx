
export const items = [
  { title: 'general.title', content: 'general.content' },
  { title: 'cards.title', content: 'cards.content' },
  { title: 'plan.title', content: 'plan.content' },
  { title: 'defects.title', content: 'defects.content' },
  { title: 'mohitor.title', content: 'mohitor.content' },
  { title: 'outsourcing.title', content: 'outsourcing.content' },
  { title: 'resources.title', content: 'resources.content' },  
  { title: 'quickstart.title', content: 'quickstart.content' },

];

import React, { useState } from "react";
import styles from "./docs.module.scss";
import { Trans, useTranslation } from "react-i18next";

export interface HelpItem {
  title: string;
  content?: string;
  children?: HelpItem[];
}

interface HelpTreeProps {
  //  items: HelpItem[];
}

const HelpTree: React.FC<HelpTreeProps> = ({ }) => {
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
  const { t } = useTranslation('help');
  const [expanded, setExpanded] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className={`${styles.treeNode} ${styles[`level${level}`]}`}>
      <div className={styles.nodeHeader} onClick={() => setExpanded(!expanded)}>
        {hasChildren && (
          <span className={styles.toggle}>{expanded ? "−" : "+"}</span>
        )}
        <span className={styles.title}>{t(item.title)}</span>
      </div>
      {expanded && (
        <div className={styles.nodeContent}>
          {item.content && (
            <div className={styles.content}>
              <Trans i18nKey={item.content} 
              t={t} 
              components={{ 
                p: <p />, 
                ul: <ul />, 
                li: <li />, 
                strong: <strong />,
                h4:<h4 />, 
                h3:<h3 />, 
                code:<code />,
                
                }} />
            </div>
          )}
          
          {/* {item.content && <div className={styles.content}>{item.content}</div>} */}
          {hasChildren && item.children!.map((child, i) => (
            <TreeNode key={i} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpTree;
