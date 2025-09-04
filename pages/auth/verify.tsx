// pages/auth/verify.tsx
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { email } from 'zod';

export default function VerifyPage() {
    const router = useRouter();
    const [emailValue, setEmailValue] = useState('');
    const [purpose, setPurpose] = useState<'signup' | 'password_reset'>('signup');
    const [code, setCode] = useState('');
    const { t } = useTranslation();
    const [pass1Value, setPass1Value] = useState('');
    const [pass2Value, setPass2Value] = useState('');
    const [passMessage, setpassMessage] = useState('');
    const [message, setMessage] = useState('');
    const [step, setStep] = useState(0);

    // новое: состояния для смены пароля и редиректа
    const [isChanging, setIsChanging] = useState(false);
    const [redirectIn, setRedirectIn] = useState<number | null>(null);

    const verifyToken = useRef('');

    useEffect(() => {
        if (typeof router.query.email === 'string') setEmailValue(router.query.email);
        if (router.query.purpose === 'password_reset' || router.query.purpose === 'signup') {
            setPurpose(router.query.purpose);
        }
    }, [router.query]);

    // если запустили обратный отсчёт — тикаем и редиректим
    useEffect(() => {
        if (redirectIn == null) return;
        if (redirectIn <= 0) {
            router.push('/');
            return;
        }
        const id = setInterval(() => setRedirectIn((s) => (s == null ? null : s - 1)), 1000);
        return () => clearInterval(id);
    }, [redirectIn, router]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const r = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email: emailValue, purpose, code }),
        }).then((r) => r.json());

        if ((r?.success || r?.ok) && r.verifyToken) {
            verifyToken.current = r.verifyToken;
            if (purpose === 'password_reset') {
                setMessage('Можно сменить пароль');
                setStep(1);
            } else {
                setMessage('Email подтвержден. Через 10 секунд вы будете перенаправлены на главную страницу.');
                setRedirectIn(10); // ← запуск таймера редиректа
            }
        } else {
            setMessage('Код неверен или истёк.');
        }
    };

    // Смена пароля
    const changePass = async (e: React.FormEvent) => {
        e.preventDefault();
        setpassMessage('');
        setMessage('');

        if (!verifyToken.current) {
            setMessage('Сессия подтверждения отсутствует. Запросите код снова.');
            return;
        }

        if (pass1Value.length < 1) {
            setpassMessage(t('service.passLengthMustBe'));
            setpassMessage("Длина пароля должна быть не менее 12 символов. пароль должен содержать буквы, цифры  и специальные символы");
            return
        }

        if (pass1Value !== pass2Value) {
            setpassMessage(t('service.pass1NotEqualPass2'));
            setpassMessage("Пароль и его повтор не совпадают");
            return
        };

        try {
            setIsChanging(true);
            const res = await fetch('/api/auth/reset-pass-api', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Basic ' + verifyToken.current,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ email: emailValue, pass: pass1Value }),
            })

            if (res.status !== 200) {
                const receivedData = await res.json();
                const error = receivedData.error;
                setMessage(error);
            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    setStep(2);
                    setMessage('Пароль успешно изменён. Через 10 секунд вы будете перенаправлены на главную страницу.');
                    setRedirectIn(10); // старт отсчёта
                } else {
                    setMessage('Не удалось изменить пароль. Попробуйте ещё раз.');
                }
            }
        } catch (err) {
            setMessage('Ошибка сети. Попробуйте ещё раз.');
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="container_verify">
            <h1 className="title">Подтверждение кода</h1>

            <form className="form_verify" onSubmit={submit}>
                <p className="text">{emailValue}</p>

                {step < 1 && (
                    <input
                        className="input_verify"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Код из письма"
                        required
                    />
                )}
                {step < 1 && (
                    <button className="back_button" type="submit">
                        Подтвердить
                    </button>
                )}
            </form>

            {message && (
                <p className="text">
                    {message}
                    {redirectIn != null && redirectIn > 0 ? ` (${redirectIn}s)` : ''}
                </p>
            )}

            {/* смена пароля */}
            {step === 1 && (
                <>
                    <div className="change_pass_input_container">
                        <input
                            className="change_pass_input"
                            type="password"
                            id="password"
                            placeholder={t('register.pass')}
                            value={pass1Value}
                            onChange={(e) => {
                                const v = e.target.value;
                                setPass1Value(v);
                                if (pass2Value && pass2Value !== v) setpassMessage(t('register.compare'));
                                else setpassMessage('');
                            }}
                            required
                            autoComplete="off"
                        />

                        <div className="change_pass_message_container">&nbsp;&nbsp;{passMessage}</div>

                        <input
                            className="change_pass_input"
                            type="password"
                            id="passwordrepeat"
                            value={pass2Value}
                            placeholder={t('register.repeatpass')}
                            onChange={(e) => {
                                const v = e.target.value;
                                setPass2Value(v);
                                if (pass1Value && pass1Value !== v) setpassMessage(t('register.compare'));
                                else setpassMessage('');
                            }}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <button className="back_button" onClick={changePass} disabled={isChanging || redirectIn != null}>
                        {isChanging ? 'Сохраняю…' : 'Сменить пароль'}
                    </button>
                </>
            )}
        </div>
    );
}
