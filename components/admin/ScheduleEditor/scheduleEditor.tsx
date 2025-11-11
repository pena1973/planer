import React, { useMemo, useState } from 'react';
import styles from './scheduleEditor.module.scss';
import { JobSettingItem, } from '@/types/service-types'
import { TimeZoneEnum } from '@/types/types'
import { runJobOnce } from "@/services/admin/runJobOnce";

type Props = {
    initial?: JobSettingItem;
    onSubmit: (data: JobSettingItem) => void;
    token: string;
    userId: number;
    setMessage: (msg: string) => void;
};

const tzOptions = [
    'Europe/Riga',
    'Europe/Moscow',
    'UTC',
    'Europe/Lisbon',
    'America/New_York',
];

export const ScheduleEditor: React.FC<Props> = ({ initial, onSubmit, token, userId, setMessage }) => {
    // --- локальноесостояние формы
    const [form, setForm] = useState<JobSettingItem>({
        job_key: '',
        enabled: true,
        timezone: 'Europe/Riga',
        schedule_type: 'monthly',
        monthly_day: 1,
        monthly_end_of_month: false,
        daily_time: '03:00',
        hourly_minute: 0,
        every_minutes: 15,
        ...initial,
    });

    // --- универсальный апдейтер
    const set = <K extends keyof JobSettingItem>(key: K, value: JobSettingItem[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // --- текстовая подсказка
    const hint = useMemo(() => {
        switch (form.schedule_type) {
            case 'monthly': return 'Запуск раз в месяц: выберите день или конец месяца.';
            case 'daily': return 'Запуск раз в день в заданное время.';
            case 'hourly': return 'Запуск каждый час в указанную минуту.';
            case 'every_x_minutes': return 'Запуск с заданной периодичностью в минутах.';
            default: return '';
        }
    }, [form.schedule_type]);

    // --- простая валидация под режим
    const validate = (): string | null => {
        if (!form.job_key?.trim()) return 'Укажите ключ задания';
        if (!form.timezone?.trim()) return 'Укажите часовой пояс';

        if (form.schedule_type === 'monthly') {
            if (!form.monthly_end_of_month) {
                const d = form.monthly_day ?? null;
                if (d === null || Number.isNaN(d) || d < 1 || d > 31) return 'День месяца: 1..31';
            }
        }
        if (form.schedule_type === 'daily') {
            if (!form.daily_time) return 'Задайте время для ежедневного запуска';
        }
        if (form.schedule_type === 'hourly') {
            const m = form.hourly_minute ?? null;
            if (m === null || Number.isNaN(m) || m < 0 || m > 59) return 'Минута часа: 0..59';
        }
        if (form.schedule_type === 'every_x_minutes') {
            const x = form.every_minutes ?? null;
            if (x === null || Number.isNaN(x) || x < 1) return 'Интервал должен быть >= 1 минуты';
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            alert(err); // можно заменить на твой UI уведомлений
            return;
        }
        // нормализуем взаимоисключающие поля для monthly
        const payload: JobSettingItem = {
            ...form,
            monthly_day: form.monthly_end_of_month ? null : (form.monthly_day ?? null),
        };
        onSubmit(payload);
    };

    const forceStart = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await runJobOnce(
            form.job_key,
            token,
            setMessage, // можно заменить на твой UI уведомлений
            userId,
            null // параметры job, если нужны
        );       
    };

    // --- подкомпоненты полей по режимам
    const MonthlyFields = () => (
        <div className={styles.block}>
            <label className={styles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={!!form.monthly_end_of_month}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        set('monthly_end_of_month', checked);
                        if (checked) set('monthly_day', null);
                    }}
                />
                <span>На конец месяца</span>
            </label>

            <label className={styles.inputRow}>
                <span>День месяца:</span>
                <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={!!form.monthly_end_of_month}
                    className={styles.input}
                    value={form.monthly_day ?? ''}
                    onChange={(e) => {
                        const v = e.target.value === '' ? null : Number(e.target.value);
                        set('monthly_day', v);
                        if (v !== null) set('monthly_end_of_month', false);
                    }}
                />
            </label>

            <p className={styles.hint}>Выберите конкретный день (1..31) или отметьте «На конец месяца».</p>
        </div>
    );

    const DailyFields = () => (
        <div className={styles.block}>
            <label className={styles.inputRow}>
                <span>Время (HH:mm):</span>
                <input
                    type="time"
                    className={styles.input}
                    value={form.daily_time ?? ''}
                    onChange={(e) => set('daily_time', e.target.value)}
                />
            </label>
        </div>
    );

    const HourlyFields = () => (
        <div className={styles.block}>
            <label className={styles.inputRow}>
                <span>Минута часа (0..59):</span>
                <input
                    type="number"
                    min={0}
                    max={59}
                    className={styles.input}
                    value={form.hourly_minute ?? 0}
                    onChange={(e) => set('hourly_minute', Number(e.target.value))}
                />
            </label>
        </div>
    );

    const EveryXFields = () => (
        <div className={styles.block}>
            <label className={styles.inputRow}>
                <span>Каждые X минут:</span>
                <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={form.every_minutes ?? 1}
                    onChange={(e) => set('every_minutes', Number(e.target.value))}
                />
            </label>
        </div>
    );

    return (
        <form className={`${styles.form}`} onSubmit={handleSubmit}>
            <div className={styles.block}>
                <label className={styles.inputRow}>
                    <span>Ключ задания:</span>
                    <input
                        className={styles.input}
                        placeholder="billing:charge"
                        value={form.job_key}
                        onChange={(e) => set('job_key', e.target.value)}
                    />
                    <div className={styles.actions}>
                        <button type='button' className={styles.submit} onClick={forceStart}>Запустить принудительно</button>
                    </div>
                </label>

                <label className={styles.inputRow}>
                    <span>Часовой пояс:</span>
                    <select
                        className={styles.input}
                        value={form.timezone}
                        onChange={(e) => set('timezone', e.target.value)}
                    >
                        {tzOptions.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </label>

                <label className={styles.checkboxRow}>
                    <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(e) => set('enabled', e.target.checked)}
                    />
                    <span>Включено</span>
                </label>
            </div>

            <div className={styles.block}>
                <div className={styles.label}>Тип расписания:</div>
                <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                        <input
                            type="radio"
                            value="monthly"
                            checked={form.schedule_type === 'monthly'}
                            onChange={() => set('schedule_type', 'monthly')}
                        />
                        <span>Месяц</span>
                    </label>
                    <label className={styles.radioItem}>
                        <input
                            type="radio"
                            value="daily"
                            checked={form.schedule_type === 'daily'}
                            onChange={() => set('schedule_type', 'daily')}
                        />
                        <span>День</span>
                    </label>
                    <label className={styles.radioItem}>
                        <input
                            type="radio"
                            value="hourly"
                            checked={form.schedule_type === 'hourly'}
                            onChange={() => set('schedule_type', 'hourly')}
                        />
                        <span>Час</span>
                    </label>
                    <label className={styles.radioItem}>
                        <input
                            type="radio"
                            value="every_x_minutes"
                            checked={form.schedule_type === 'every_x_minutes'}
                            onChange={() => set('schedule_type', 'every_x_minutes')}
                        />
                        <span>X минут</span>
                    </label>
                </div>
            </div>

            {form.schedule_type === 'monthly' && <MonthlyFields />}
            {form.schedule_type === 'daily' && <DailyFields />}
            {form.schedule_type === 'hourly' && <HourlyFields />}
            {form.schedule_type === 'every_x_minutes' && <EveryXFields />}

            <p className={styles.hint}>{hint}</p>

            <div className={styles.actions}>
                <button type="submit" className={styles.submit}>Сохранить</button>
            </div>
        </form>
    );
};

export default ScheduleEditor;
