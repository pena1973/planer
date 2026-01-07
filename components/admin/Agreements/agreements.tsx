// components/admin/AgreementsAdmin/agreementsAdmin.tsx
// Это шаблоны соглашения в админке
import React, { useEffect, useMemo, useState } from 'react';
import styles from './agreements.module.scss';

import { useTranslation } from 'react-i18next';
import { AgreementItem } from '@/types/service-types';

import { getAgreements } from '@/services/admin/getAgreements';
import { createAgreement } from '@/services/admin/createAgreement';

interface AgreementsProps {
    setMessage: (message: string) => void;
    userId: number;
    token: string;
}

const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const formatIso = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(d);
};

export const Agreements: React.FC<AgreementsProps> = ({
    setMessage,
    userId,
    token,
}) => {
    const { t, i18n } = useTranslation();

    const [openAgreement, setOpenAgreement] = useState<AgreementItem | null>(null);

    const [agreements, setAgreements] = useState<AgreementItem[]>([]);
    const [date, setDate] = useState<string>(() => toYYYYMMDD(new Date()));
    const [locale, setLocale] = useState<string>(() => i18n.language || 'ru');
    const [text, setText] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const getAgreementsHandler = async () => {
        await getAgreements(userId, token, t, i18n.language, setMessage, setAgreements);
    };

    useEffect(() => {
        getAgreementsHandler();        
    }, []);

    const onSave = async () => {
        const trimmed = text.trim();
        if (!trimmed) {
            setMessage('Текст соглашения пустой');
            return;
        }
        if (!date) {
            setMessage('Укажи дату начала действия');
            return;
        }
        if (!locale) {
            setMessage('Укажи язык (локаль)');
            return;
        }

        setIsSaving(true);
        try {
            await createAgreement(
                userId,
                token,
                { date, locale, text: trimmed },
                t,
                i18n.language,
                setMessage,
                setAgreements
            );

            setText('');
            // дата/локаль оставляем как есть (удобно добавлять рядом версии)
            setMessage('Соглашение сохранено');
        } finally {
            setIsSaving(false);
        }
    };

    const agreementsNodes = useMemo(() => {
        return agreements.map((a) => (
            <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.locale}</td>
                <td>{a.date}</td>
                <td title={a.created_at}>{formatIso(a.created_at)}</td>
                <td
                    className={styles.previewClick}
                    title="Открыть соглашение"
                    onClick={() => setOpenAgreement(a)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setOpenAgreement(a);
                    }}
                >
                    <span className={styles.previewText}>{a.text}</span>
                </td>

            </tr>
        ));
    }, [agreements]);


    return (
        <React.Fragment>
            <div className={styles.addBlock}>

                <div className={styles.field}>
                    <div className={styles.col}>
                        <label className={styles.label}>Дата начала действия</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.col}>
                        <label className={styles.label}>locale</label>
                        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                            <option value="ru">ru</option>
                            <option value="en">en</option>
                        </select>
                    </div>

                    <div className={styles.actions}>                        
                        <button type="button" onClick={onSave} disabled={isSaving}>
                            {isSaving ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    </div>
                </div>

                <label className={styles.label}>ТЕКСТ СОГЛАШЕНИЯ</label>
                <textarea
                    className={styles.coment}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Вставь новый текст соглашения сюда…"
                />
            </div>

            <table className={styles._table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>LOCALE</th>
                        <th>ACTIVE FROM</th>
                        <th>CREATED</th>
                        <th>TEXT PREVIEW</th>
                    </tr>
                </thead>
                <tbody>{agreementsNodes}</tbody>
            </table>
            {openAgreement && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setOpenAgreement(null)}
                >
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                СОГЛАШЕНИЕ ID {openAgreement.id} • {openAgreement.locale} • С {openAgreement.date}
                            </div>

                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setOpenAgreement(null)}
                            >
                                Закрыть
                            </button>
                        </div>

                        <textarea
                            className={styles.modalText}
                            readOnly
                            value={openAgreement.text}
                        />
                    </div>
                </div>
            )}

        </React.Fragment>
    );
};
