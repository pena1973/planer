import React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Check, ArrowRight, Timer, BarChart3, CalendarDays, Shield, Zap, Globe2, Layers, ChevronDown } from "lucide-react";
import styles from "./landing.module.scss";
import { LeadItem } from "../../types/leads-types";
import { saveLead } from "@/services/landing/saveLead";

import { useAppDispatch } from '@/store/hooks';

import { useTranslation } from 'react-i18next';

import { setStep } from '@/store/slices'
import Image from "next/image";
import planing from '@/public/planing1.png';


export const TEST_IDS = {
  hero: "hero-section",
  pricing: "pricing-section",
  pricingCards: {
    trial: "pricing-card-trial",
    standard: "pricing-card-standard",
    custom: "pricing-card-custom",
  },
  faq: "faq-section",
};


const Logo: React.FC = () => (
  <div className={styles.logo}>
    <span className={styles.logoText}>plan-track.pro</span>
  </div>
);

// Умеет принимать "герой" и "pad" как дополнительные классы, которые берутся из CSS Module.
const Section: React.FC<
  React.PropsWithChildren<{ id?: string; className?: string }>
> = ({ id, className, children }) => {
  const map = (cls?: string) =>
    cls
      ? cls
        .split(/\s+/)
        .map((c) => (c in styles ? styles[c as keyof typeof styles] : c))
        .join(" ")
      : "";

  return (
    <section id={id} className={`${styles.container} ${styles.section} ${map(className)}`}>
      {children}
    </section>
  );
};

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
  <button {...rest} className={`${styles.btn} ${styles.btnPrimary} ${className || ""}`.trim()} />
);

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
  <button {...rest} className={`${styles.btn} ${styles.btnGhost} ${className || ""}`.trim()} />
);


const LangMenu: React.FC = () => {
  const { t, i18n } = useTranslation('landing');
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const LANGS = ['ru', 'en']; // потом просто добавишь новые коды

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      if (btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={styles.langWrap}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('ui.changeLanguage')}
        className={styles.langBtn}
        onClick={() => setOpen(v => !v)}
      >
        <span style={{ margin: "0 6px" }}>{(i18n.language || 'ru').toUpperCase()}</span>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <div ref={menuRef} role="menu" className={styles.langMenu}>
          {LANGS.map(lng => (
            <button
              key={lng}
              role="menuitem"
              className={styles.langItem}
              onClick={() => { i18n.changeLanguage(lng); setOpen(false); }}
            >
              <span style={{ width: 24, display: 'inline-block' }}>{lng.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export default function LandingPlanner() {
  const { t, i18n } = useTranslation('landing');
  const router = useRouter();
  const dispatch = useAppDispatch();
  // ⬅️ NEW: утилита-охранник, чтобы t(...) всегда давал массив
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  const iconByKey: Record<string, JSX.Element> = {
    calendar: <CalendarDays size={24} aria-hidden />,
    layers: <Layers size={24} aria-hidden />,
    timer: <Timer size={24} aria-hidden />,
    bar: <BarChart3 size={24} aria-hidden />,
    shield: <Shield size={24} aria-hidden />,
  };

  const features = asArr<{ icon: string; title: string; desc: string }>(t('features', { returnObjects: true }));
  const benefits = asArr<string>(t('benefits', { returnObjects: true }));
  const kpiItems = asArr<{ num: string; label: string }>(t('kpi', { returnObjects: true }));
  const faqItems = asArr<{ q: string; a: string }>(t('faq.items', { returnObjects: true }));

  // отправка формы 
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      name: fd.get("name")?.toString().trim() || "",
      email: fd.get("email")?.toString().trim() || "",
      company: fd.get("company")?.toString().trim() || "",
      time: fd.get("time")?.toString().trim() || "",
      message: fd.get("message")?.toString().trim() || "",
      agree: (fd.get("agree") as string) === "on",
    };

    // простая валидация
    if (!payload.name || !payload.email || !payload.agree) {
      alert(t("consult.errorAlert"));
      return;
    }

    try {
      // 1) формируем объект лида под твой API
      const lead: LeadItem = {
        name: payload.name,
        email: payload.email,
        company: payload.company,
        time: payload.time,
        message: payload.message,
        agree: payload.agree,
        source: "landing",
        type: "consultation",
        leadStatus: "new",
      } as LeadItem;

      // 2) отправляем через сервис
      const res = await saveLead(lead, i18n.language || "en");

      if (!res.ok) throw new Error(res.error);

      // 3) успех
      (e.currentTarget as HTMLFormElement).reset();
      alert(t("consult.successMsg"));
    } catch {
      // запасной вариант — откроем почтовый клиент
      const subject = encodeURIComponent(t("consult.mailSubject"));
      const body = encodeURIComponent(
        `${t("consult.labels.name")}: ${payload.name}\nEmail: ${payload.email}\n${t(
          "consult.labels.company"
        )}: ${payload.company}\n${t("consult.labels.time")}: ${payload.time
        }\n${t("consult.labels.message")}:\n${payload.message}\n`
      );
      window.location.href = `mailto:support@plan-track.pro?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className={styles.page}>
      {/* Локальный скролл — чтобы страница скролилась даже при body/html { overflow: hidden } */}
      <div className={styles.scroll}>
        <header className={styles.header}>
          <Section>
            <div className={styles.navbar}>
              <Logo />
              <nav className={styles.nav}>
                <a href="#features">{t('ui.features')}</a>
                <a href="#pricing">{t('ui.pricing')}</a>
                <a href="#faq">{t('ui.faq')}</a>
              </nav>

              <div className={styles.actions}>
                <GhostButton
                  className={styles.consultBtn}
                  onClick={() => (window.location.hash = "#consult")}
                >
                  {t('ui.onlineConsult')}
                </GhostButton>
                <PrimaryButton
                  className={styles.ctaBtn}
                  onClick={() => {
                    dispatch(setStep(1));
                    router.push("/");
                  }}
                >
                  {t('ui.tryFree')} <ArrowRight size={16} aria-hidden />
                </PrimaryButton>
              </div>
              <div className={styles.tools}>
                <LangMenu />
              </div>
            </div>
          </Section>
        </header>


        {/* Герой */}
        <Section className="hero" data-testid={TEST_IDS.hero}>
          <div className={styles.grid2}>
            {/* Левая колонка: тексты + CTA */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >

                <span className={styles.badge}>
                  <Zap size={16} aria-hidden /> {t('hero.badge')}
                </span>

                <h1 className={styles.heroTitle} dangerouslySetInnerHTML={{ __html: t('hero.title') }} />

                <p className={styles.heroP} dangerouslySetInnerHTML={{ __html: t('hero.p') }} />
                <div className={styles.heroCta}>
                  <PrimaryButton onClick={() => router.push("/")}>{t('hero.primaryCta')}</PrimaryButton>
                  <GhostButton onClick={() => window.open("/intro.mp4", "_blank")}>{t('hero.secondaryCta')}</GhostButton>
                </div>


                <p className={styles.heroNote}>{t('hero.note')}</p>
              </motion.div>
            </div>

            {/* Правая колонка: видео-мокап */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={styles.mock}
            >
              {/* Если видео пока нет — положи /intro.mp4 позже; блок просто не сломается */}
              <div className={styles.window}>
                <video
                  className={styles.mockVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/intro.mp4"
                />
              </div>

              <div className={styles.float}>
                <Timer size={20} aria-hidden />
                <span style={{ fontSize: 14 }}>{t('hero.float')}</span>
              </div>
            </motion.div>
          </div>
        </Section>


        {/* Соц‑доказательства (временно скрыто) */}
        <Section className={styles.hiddenBlock}>
          <div className={styles.brandsNote}>Нам доверяют команды из производства, печати, монтажа</div>
          <div className={styles.brands}>
            {["NovaPrint", "MontagePro", "Steel&Co", "CraftLab"].map((n) => (
              <div key={n} className={styles.brand}>{n}</div>
            ))}
          </div>
        </Section>

        {/* Фичи */}
        <Section id="features" className="pad">
          <h2 className={`${styles.cardTitle} ${styles.center}`} style={{ fontSize: "28px" }}>{t('featuresTitle')}</h2>
          <div className={styles.cards}>
            {features.map((f) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className={styles.card}>
                <div className={styles.iconWrap}>{iconByKey[f.icon] ?? <Globe2 size={24} aria-hidden />}</div>
                <div className={styles.cardTitle}>{f.title}</div>
                <p className={styles.cardP}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>


        {/* Польза в цифрах */}
        <Section className="pad">
          <div className={styles.card1}>
            <div className={styles.twoCol}>

              <div>
                <h2 className={styles.cardTitle} style={{ fontSize: 28 }}>{t('benefitsTitle')}</h2>
                <ul className={styles.ul}>
                  {benefits.map((b) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Check size={20} aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.kpiGrid}>
                {kpiItems.map((i) => (
                  <div key={i.label} className={styles.kpiItem}>
                    <div className={styles.kpiNum}>{i.num}</div>
                    <div className={styles.kpiLbl}>{i.label}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </Section>

        {/* Цены */}
        <Section id="pricing" className="pad" data-testid={TEST_IDS.pricing}>
          <h2 className={`${styles.cardTitle} ${styles.center}`} style={{ fontSize: "28px" }}>{t('pricing.title')}</h2>
          <p className={styles.center} style={{ color: "var(--muted)", marginTop: 8 }}>{t('pricing.subtitle')}</p>

          <div className={styles.pricingGrid}>
            <div className={styles.priceCard} data-testid={TEST_IDS.pricingCards.trial}>
              <div className={styles.priceTitle}>Trial</div>
              <div className={styles.priceMain}>€0</div>
              <div className={styles.priceSub}>{t('pricing.trial.period')}</div>
              <ul className={styles.ul}>
                {(t('pricing.trial.points', { returnObjects: true }) as string[]).map(li => <li key={li}>{li}</li>)}
              </ul>
              <div style={{ marginTop: 16 }}>
                <PrimaryButton onClick={() => router.push("/")} style={{ width: '100%' }}>{t('pricing.start')}</PrimaryButton>
              </div>
            </div>

            <div className={`${styles.priceCard} ${styles.outline}`} data-testid={TEST_IDS.pricingCards.standard}>
              <div className={styles.priceTitle}>
                Standard
                <span
                  style={{ fontSize: 12, background: 'var(--brand)', color: '#fff', padding: '2px 6px', borderRadius: 999, marginLeft: 8 }}>
                  {/* основной */}
                  {t('pricing.mainTag')}
                </span>
              </div>

              <div className={styles.priceMain}>€100<span className={styles.priceSub}>{t('pricing.vatSuffix')}</span></div>


              <div className={styles.priceSub}>{t('pricing.standard.sub')}</div>
              <ul className={styles.ul}>
                {(t('pricing.standard.points', { returnObjects: true }) as string[]).map(li => <li key={li}>{li}</li>)}
              </ul>
              <div style={{ marginTop: 16 }}>
                <PrimaryButton onClick={() => router.push("/")} style={{ width: '100%' }}>{t('pricing.buy')}</PrimaryButton>
              </div>
            </div>

            <div className={styles.priceCard} data-testid={TEST_IDS.pricingCards.custom}>

              <div className={styles.priceTitle}>{t('pricing.custom.title')}</div>
              <div className={styles.priceMain}>Custom</div>

              <div className={styles.priceSub}>{t('pricing.custom.sub')}</div>

              <ul className={styles.ul}>
                {(t('pricing.custom.points', { returnObjects: true }) as string[]).map(li => <li key={li}>{li}</li>)}
              </ul>
              <div style={{ marginTop: 16 }}>
                <GhostButton onClick={() => (window.location.hash = "#consult")} style={{ width: '100%' }}>{t('pricing.contact')}</GhostButton>
              </div>
            </div>
          </div>
        </Section>

        {/* Онлайн-консультация */}
        <Section id="consult" className="pad">
          <div className={styles.demoWrap}>
            <div className={styles.twoCol}>
              {/* Левая колонка: текст + форма */}
              <div>
                <h2 className={styles.cardTitle} style={{ fontSize: "28px" }}>{t('consult.title')}</h2>
                <p className={styles.cardP}>{t('consult.p')}</p>

                <form
                  className={styles.form}
                  onSubmit={onSubmit}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.formControl}>
                      <label htmlFor="name">{t('consult.labels.name')}</label>
                      <input id="name" name="name" className={styles.input} required />
                    </div>
                    <div className={styles.formControl}>
                      <label htmlFor="email">Email *</label>
                      <input id="email" name="email" type="email" className={styles.input} required />
                    </div>
                    <div className={styles.formControl}>
                      <label htmlFor="company">{t('consult.labels.company')}</label>
                      <input id="company" name="company" className={styles.input} />
                    </div>
                    <div className={styles.formControl}>
                      <label htmlFor="time">{t('consult.labels.time')}</label>
                      <input id="time" name="time" placeholder="Напр.: вт 11:00–13:00, Europe/Riga" className={styles.input} />
                    </div>
                    <div className={styles.formControl} style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="message">{t('consult.labels.message')}</label>
                      <textarea id="message" name="message" rows={4} className={styles.textarea} />
                    </div>
                    <label className={styles.check} style={{ gridColumn: '1 / -1' }}>
                      <input type="checkbox" name="agree" />
                      <span>{t('consult.labels.agree')}</span>
                    </label>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <button type="submit" className={styles.btn + " " + styles.btnPrimary}>
                      {t('consult.submit')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Правая колонка: иллюстрация */}
              <div className={styles.media}>
                <Image
                  src={planing}
                  alt="Планирование в plan-track.pro"
                  fill
                  sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
                  className={styles.mediaImg}
                  priority={false}
                  placeholder="empty"
                />
                <div className={styles.mediaBadge}>
                  {t('hero.float')}
                </div>
              </div>


            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" className="pad" data-testid={TEST_IDS.faq}>
          <h2 className={`${styles.cardTitle} ${styles.center}`} style={{ fontSize: "28px" }}>{t('faq.title')}</h2>
          <div className={styles.faqGrid} style={{ marginTop: 16 }}>
            {faqItems.map((f) => (
              <div key={f.q} className={styles.card}>
                <div className={styles.priceTitle} style={{ fontWeight: 600 }}>{f.q}</div>
                <div className={styles.cardP} style={{ marginTop: 8 }}>{f.a}</div>
              </div>
            ))}

          </div>
        </Section>

        {/* CTA */}
        <Section id="signup" className="pad">
          <div className={styles.cta}>
            <div className={styles.ctaGrid}>
              <div>
                <h2 className={styles.cardTitle} style={{ fontSize: "28px", color: '#fff' }}>{t('cta.title')}</h2>
                <p style={{ marginTop: 8, color: 'rgba(255,255,255,.9)' }}>{t('cta.p')}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button className={styles.ctaBtn1} onClick={() => {
                  dispatch(setStep(1));
                  router.push("/")
                }}>
                  {t('cta.button')} <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Подвал */}
        <footer className={styles.footer} id="contact">
          <Section>
            <div className={styles.footerRow}>
              <Logo />
              <div style={{ color: "var(--muted)" }}>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
              <div className={styles.footerLinks}>

              </div>
            </div>
          </Section>
        </footer>
      </div>
    </div>
  );
}
