import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./dropdownSelectCountry.module.scss";

export interface CountryOption {
  code: string;
  title: string;
}

interface Props {
  options: CountryOption[];
  selectedValue: string | null;
  onSelect: (option: CountryOption | null) => void;
  placeholder?: string;          // по умолчанию: "-- Select --"
  disabled?: boolean;
  
}

const DropdownSelectCountry: React.FC<Props> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "-- Select --",
  disabled = false,
  
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find(o => o.code === selectedValue) ?? null,
    [options, selectedValue]
  );

  const safeOptions = useMemo(
    () => [{ code: "__NULL__", title: placeholder }, ...options],
    [options, placeholder]
  );

  const selectedIndex = useMemo(() => {
    if (!selected) return 0; // placeholder
    const idx = options.findIndex(o => o.code === selected.code);
    return idx >= 0 ? idx + 1 : 0; // +1 из-за placeholder
  }, [options, selected]);

  const toggle = () => !disabled && setIsOpen(v => !v);
  const close = () => setIsOpen(false);

  const pickByIndex = (idx: number) => {
    const opt = safeOptions[idx];
    if (!opt) return;
    if (opt.code === "__NULL__") onSelect(null);
    else onSelect(opt);
    close();
  };

  // закрытие по клику вне
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // клавиатура
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setHoverIndex(selectedIndex);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIndex(i => Math.min((i < 0 ? selectedIndex : i) + 1, safeOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIndex(i => Math.max((i < 0 ? selectedIndex : i) - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickByIndex(hoverIndex >= 0 ? hoverIndex : selectedIndex);
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.dropdownContainer}
      onKeyDown={onKeyDown}
    >
      <div
        // type="button"
        className={styles.select}
        onClick={toggle}
        // disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.selectedItem}>
          {selected ? selected.title : placeholder}
        </span>
        <span className={styles.arrow} aria-hidden>▾</span>
      </div>

      {isOpen && (
        <ul className={styles.dropdownList} role="listbox">
          {safeOptions.map((opt, idx) => {
            const isSelected = idx === selectedIndex;
            const isHover = idx === hoverIndex;
            const itemCls = [
              styles.dropdownItem,
              isSelected ? styles.selected : "",
              isHover ? styles.hover : "",
              opt.code === "__NULL__" ? styles.placeholder : "",
            ].join(" ");
            return (
              <li
                key={opt.code}
                role="option"
                aria-selected={isSelected}
                className={itemCls}
                onMouseEnter={() => setHoverIndex(idx)}
                onClick={() => pickByIndex(idx)}
                tabIndex={-1}
              >
                {opt.title}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DropdownSelectCountry;
