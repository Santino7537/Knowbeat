import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import BrandLogo from "../components/general/BrandLogo.jsx";
import ThemeToggle from "../components/general/ThemeToggle.jsx";
import MusicStaff from "../components/general/MusicStaff.jsx";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma
import styles from "./CSS/Landing.module.css";

/* =====================================================================
   DATOS
   ===================================================================== */

// Una octava (Do4 → Do5). `key` = tecla de la computadora que la toca.
const WHITE_KEYS = [
  { note: "Do", freq: 261.63, key: "a" },
  { note: "Re", freq: 293.66, key: "s" },
  { note: "Mi", freq: 329.63, key: "d" },
  { note: "Fa", freq: 349.23, key: "f" },
  { note: "Sol", freq: 392.0, key: "g" },
  { note: "La", freq: 440.0, key: "h" },
  { note: "Si", freq: 493.88, key: "j" },
  { note: "Do", freq: 523.25, key: "k" },
];

// Teclas negras: `after` = índice de la tecla blanca a su izquierda
const BLACK_KEYS = [
  { note: "Do#", freq: 277.18, key: "w", after: 0 },
  { note: "Re#", freq: 311.13, key: "e", after: 1 },
  { note: "Fa#", freq: 369.99, key: "t", after: 3 },
  { note: "Sol#", freq: 415.3, key: "y", after: 4 },
  { note: "La#", freq: 466.16, key: "u", after: 5 },
];

const KEY_MAP = Object.fromEntries(
  [...WHITE_KEYS.map((k, i) => [k.key, { ...k, id: `w${i}` }]),
   ...BLACK_KEYS.map((k, i) => [k.key, { ...k, id: `b${i}` }])]
);

const EQ_BARS = 28;

const TEAM = [
  { name: "Renata Gallucci", github: "Renaaa189" },
  { name: "Alejo Guerra", github: "AlejoGuerraa" },
  { name: "Esteban Gonzalez", github: "EstebanGonzalez20" },
  { name: "Santino Martinez", github: "Santino7537" },
];

// Pseudoaleatorio con semilla: los destellos quedan siempre en el mismo lugar
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* =====================================================================
   AUDIO (Web Audio API, sin dependencias)
   ===================================================================== */

function usePianoSound() {
  const ctxRef = useRef(null);

  return useCallback((freq) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctxRef.current) ctxRef.current = new AudioCtx();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(0.32, now + 0.015);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      out.connect(ctx.destination);

      // Fundamental + armónicos suaves
      [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([mult, type, vol]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq * mult;
        gain.gain.value = vol;
        osc.connect(gain).connect(out);
        osc.start(now);
        osc.stop(now + 1.7);
      });
    } catch {
      // Si el navegador bloquea el audio, la animación igual funciona
    }
  }, []);
}

/* =====================================================================
   SUBCOMPONENTES
   ===================================================================== */

function Sparkles({ count = 8 }) {
  const items = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 100).toFixed(2)}%`,
      size: 2 + rand() * 4,
      delay: `${(rand() * 6).toFixed(2)}s`,
      duration: `${(3 + rand() * 4).toFixed(2)}s`,
      star: rand() > 0.78,
    }));
  }, [count]);

  return (
    <div className={styles.sparkles} aria-hidden="true">
      {items.map((s) => (
        <span
          key={s.id}
          className={s.star ? styles.sparkleStar : styles.sparkle}
          style={{
            left: s.left,
            top: s.top,
            width: s.star ? s.size * 3 : s.size,
            height: s.star ? s.size * 3 : s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

function Equalizer({ energy, bars = EQ_BARS, className = "" }) {
  return (
    <div className={`${styles.eq} ${energy ? styles.eqHot : ""} ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            animationDelay: `${((i * 137) % 1000) / 1000}s`,
            animationDuration: `${0.9 + ((i * 53) % 70) / 100}s`,
          }}
        />
      ))}
    </div>
  );
}

function MiniKeyboard({ onPlay, activeKeys }) {
  const { t } = useLanguage();
  return (
    <div className={styles.keyboard} role="group" aria-label={t("landing.piano_aria")}>
      {WHITE_KEYS.map((k, i) => (
        <button
          key={`w${i}`}
          type="button"
          className={`${styles.whiteKey} ${activeKeys.has(`w${i}`) ? styles.keyActive : ""}`}
          onPointerDown={(e) => { e.preventDefault(); onPlay({ ...k, id: `w${i}` }); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay({ ...k, id: `w${i}` }); }
          }}
          aria-label={`${k.note} (tecla ${k.key.toUpperCase()})`}
        >
          <span className={styles.keyNote}>{k.note}</span>
          <kbd className={styles.keyHint}>{k.key.toUpperCase()}</kbd>
        </button>
      ))}
      {BLACK_KEYS.map((k, i) => (
        <button
          key={`b${i}`}
          type="button"
          tabIndex={-1}
          className={`${styles.blackKey} ${activeKeys.has(`b${i}`) ? styles.keyActive : ""}`}
          style={{ left: `calc(${((k.after + 1) / WHITE_KEYS.length) * 100}% - 5.5%)` }}
          onPointerDown={(e) => { e.preventDefault(); onPlay({ ...k, id: `b${i}` }); }}
          aria-label={k.note}
        />
      ))}
    </div>
  );
}

function TopicsCarousel() {
  const { t } = useLanguage();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const TOPICS = [
    { title: t("landing.topics.t1_title"), text: t("landing.topics.t1_text"), level: t("landing.levels.intermediate") },
    { title: t("landing.topics.t2_title"), text: t("landing.topics.t2_text"), level: t("landing.levels.initial") },
    { title: t("landing.topics.t3_title"), text: t("landing.topics.t3_text"), level: t("landing.levels.initial") },
    { title: t("landing.topics.t4_title"), text: t("landing.topics.t4_text"), level: t("landing.levels.intermediate") },
    { title: t("landing.topics.t5_title"), text: t("landing.topics.t5_text"), level: t("landing.levels.initial") },
    { title: t("landing.topics.t6_title"), text: t("landing.topics.t6_text"), level: t("landing.levels.initial") },
    { title: t("landing.topics.t7_title"), text: t("landing.topics.t7_text"), level: t("landing.levels.intermediate") },
    { title: t("landing.topics.t8_title"), text: t("landing.topics.t8_text"), level: t("landing.levels.initial") },
    { title: t("landing.topics.t9_title"), text: t("landing.topics.t9_text"), level: t("landing.levels.advanced") },
  ];

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const total = TOPICS.length;
    const next = (index + total) % total;
    const card = track.children[next];
    if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActive(next);
  }, [TOPICS.length]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => scrollToIndex(active + 1), 3800);
    return () => clearInterval(id);
  }, [active, scrollToIndex]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.children[0]?.getBoundingClientRect().width || 1;
    const idx = Math.round(track.scrollLeft / (cardWidth + 18));
    if (idx !== active) setActive(Math.min(TOPICS.length - 1, Math.max(0, idx)));
  };

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carrusel"
      aria-label={t("landing.topics_aria")}
    >
      <div className={styles.carouselHead}>
        <h2>{t("landing.topics_title")}</h2>
        <div className={styles.carouselNav}>
          <button type="button" className={styles.carouselBtn} onClick={() => scrollToIndex(active - 1)} aria-label={t("landing.prev_topic")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className={styles.carouselBtn} onClick={() => scrollToIndex(active + 1)} aria-label={t("landing.next_topic")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div ref={trackRef} className={styles.carouselTrack} onScroll={handleScroll}>
        {TOPICS.map((item, i) => (
          <article
            key={item.title}
            className={`${styles.topicCard} ${i === active ? styles.topicActive : ""}`}
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${TOPICS.length}: ${item.title}`}
          >
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span className={styles.topicLevel}>{item.level}</span>
          </article>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label={t("landing.select_topic_aria")}>
        {TOPICS.map((item, i) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={item.title}
            className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   PÁGINA
   ===================================================================== */

const Landing = () => {
  const navigate = useNavigate();
  const playSound = usePianoSound();
  const { t } = useLanguage(); // <-- Consumir hook de idioma

  const STEPS = [
    { title: t("landing.steps.s1_title"), text: t("landing.steps.s1_text") },
    { title: t("landing.steps.s2_title"), text: t("landing.steps.s2_text") },
    { title: t("landing.steps.s3_title"), text: t("landing.steps.s3_text") },
    { title: t("landing.steps.s4_title"), text: t("landing.steps.s4_text") },
  ];

  const [activeKeys, setActiveKeys] = useState(() => new Set());
  const [energy, setEnergy] = useState(false);
  const [floating, setFloating] = useState([]);
  const [lastNote, setLastNote] = useState(null);
  const energyTimer = useRef(null);
  const noteId = useRef(0);

  const play = useCallback((key) => {
    playSound(key.freq);
    setLastNote(key.note);

    setActiveKeys((prev) => new Set(prev).add(key.id));
    setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key.id);
        return next;
      });
    }, 220);

    setEnergy(true);
    clearTimeout(energyTimer.current);
    energyTimer.current = setTimeout(() => setEnergy(false), 650);

    const id = noteId.current++;
    const glyphs = ["♪", "♫", "♩", "♬"];
    setFloating((prev) => [
      ...prev.slice(-10),
      { id, glyph: glyphs[id % glyphs.length], left: 8 + Math.random() * 84 },
    ]);
    setTimeout(() => setFloating((prev) => prev.filter((n) => n.id !== id)), 1800);
  }, [playSound]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key) play(key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(energyTimer.current);
    };
  }, [play]);

  const revealRefs = useRef([]);
  const [revealed, setRevealed] = useState(() => new Set());
  const registerReveal = (index) => (el) => { revealRefs.current[index] = el; };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.reveal);
          setRevealed((prev) => new Set(prev).add(index));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const revealClass = (index) => `${styles.reveal} ${revealed.has(index) ? styles.revealed : ""}`;
  const goToLogin = () => navigate("/Login");
  const goToRegister = () => navigate("/Login", { state: { mode: "register" } });

  return (
    <main className={styles.landing} data-route-anim="off">

      {/* ============ FONDO GLOBAL ============ */}
      <div className={styles.backdrop} aria-hidden="true">
        <div className={`${styles.aurora} ${styles.aurora1}`} />
        <div className={`${styles.aurora} ${styles.aurora2}`} />
        <div className={`${styles.aurora} ${styles.aurora3}`} />
        <div className={styles.grain} />
      </div>

      {/* ============ NAV ============ */}
      <header className={styles.nav}>
        <a href="/" className={styles.navLogo} aria-label={t("landing.nav.logo_aria")}>
          <BrandLogo />
        </a>
        <nav className={styles.navLinks} aria-label={t("landing.nav.sections_aria")}>
          <a href="#funciones">{t("landing.nav.features")}</a>
          <a href="#como-empezar">{t("landing.nav.how_to_start")}</a>
          <a href="#comunidad">{t("landing.nav.community")}</a>
        </nav>
        <div className={styles.navActions}>
          <ThemeToggle />
          <button type="button" className={styles.navLogin} onClick={goToLogin}>
            {t("landing.nav.login")}
          </button>
        </div>
      </header>

      {/* ============ PORTADA: KNOWBEAT ============ */}
      <section className={styles.cover}>
        <MusicStaff staves={1} notes={30} lineGap={46} className={styles.coverStaff} />
        <Sparkles count={7} />
        <p className={styles.coverKicker}>{t("landing.cover.kicker")}</p>
        <h1 className={styles.wordmark} aria-label="Knowbeat">
          {"KNOWBEAT".split("").map((letter, i) => (
            <span key={i} className={styles.wordmarkLetter} style={{ "--i": i }} aria-hidden="true">{letter}</span>
          ))}
        </h1>
        <p className={styles.coverText}>
          {t("landing.cover.text")}
        </p>
        <div className={styles.coverActions}>
          <button type="button" className={styles.ctaPrimary} onClick={goToRegister}>
            {t("landing.cover.cta_primary")}
          </button>
          <a href="#probalo" className={styles.ctaSecondary}>
            {t("landing.cover.cta_secondary")}
          </a>
        </div>
        <a href="#probalo" className={styles.scrollCue} aria-label={t("landing.cover.scroll_aria")}>
          <span />
        </a>
      </section>

      {/* ============ HERO ============ */}
      <section id="probalo" className={styles.hero}>
        <Sparkles />
        <MusicStaff staves={1} notes={10} className={styles.heroStaff} />

        <div className={styles.heroCopy}>
          <h2 className={styles.heroTitle}>
            <span className={styles.heroLine}>{t("landing.hero.title_1")}</span>
            <span className={styles.heroLine}>{t("landing.hero.title_2")}</span>
            <span className={`${styles.heroLine} ${styles.heroLineGlow}`}>{t("landing.hero.title_3")}</span>
          </h2>
          <p className={styles.heroText}>
            {t("landing.hero.text")}
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.ctaPrimary} onClick={goToRegister}>
              {t("landing.hero.cta_register")}
            </button>
            <button type="button" className={styles.ctaSecondary} onClick={goToLogin}>
              {t("landing.hero.cta_login")}
            </button>
          </div>
        </div>

        {/* Instrumento interactivo */}
        <div className={styles.instrument}>
          <div className={styles.instrumentGlow} aria-hidden="true" />
          <div className={styles.instrumentCard}>
            <div className={styles.instrumentTop}>
              <div className={`${styles.markWrap} ${energy ? styles.markPulse : ""}`}>
                <BrandLogo variant="mark" className={styles.mark} label="" />
              </div>
              <div className={styles.nowPlaying} aria-live="polite">
                <span className={styles.nowLabel}>{lastNote ? t("landing.instrument.playing") : t("landing.instrument.try_it")}</span>
                <strong className={styles.nowNote}>{lastNote ?? t("landing.instrument.prompt")}</strong>
              </div>
            </div>

            <Equalizer energy={energy} />

            <div className={styles.keyboardWrap}>
              {floating.map((n) => (
                <span key={n.id} className={styles.flyingNote} style={{ left: `${n.left}%` }} aria-hidden="true">
                  {n.glyph}
                </span>
              ))}
              <MiniKeyboard onPlay={play} activeKeys={activeKeys} />
            </div>

            <p className={styles.instrumentHint}>
              {t("landing.instrument.hint")} <kbd>A</kbd> {t("landing.instrument.hint_to")} <kbd>K</kbd> {t("landing.instrument.hint_keyboard")}.
            </p>
          </div>
        </div>
      </section>

      {/* ============ CARRUSEL DE TEMAS ============ */}
      <TopicsCarousel />

      {/* ============ FUNCIONES (bento) ============ */}
      <section id="funciones" className={styles.section}>
        <div ref={registerReveal(0)} data-reveal="0" className={`${styles.sectionHead} ${revealClass(0)}`}>
          <h2>{t("landing.bento.main_title")}</h2>
          <p>{t("landing.bento.main_subtitle")}</p>
        </div>

        <div className={styles.bento}>
          {/* Clases guiadas */}
          <article ref={registerReveal(1)} data-reveal="1" className={`${styles.tile} ${styles.tileWide} ${revealClass(1)}`}>
            <div className={styles.tileText}>
              <h3>{t("landing.bento.classes_title")}</h3>
              <p>{t("landing.bento.classes_text")}</p>
            </div>
            <div className={styles.lessonMap} aria-hidden="true">
              <svg viewBox="0 0 520 150" className={styles.lessonSvg}>
                {[20, 45, 70, 95, 120].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} />)}
                {[
                  [60, 95, "done"], [160, 70, "done"], [260, 45, "current"], [360, 70, "locked"], [460, 95, "locked"],
                ].map(([x, y, state]) => (
                  <g key={x} className={styles[`map_${state}`]}>
                    <ellipse cx={x} cy={y} rx="13" ry="10" transform={`rotate(-20 ${x} ${y})`} />
                    <line x1={x + 12} y1={y - 3} x2={x + 12} y2={y - 58} />
                  </g>
                ))}
              </svg>
              <div className={styles.lessonMeta}>
                <span>{t("landing.bento.lesson_progress")}</span>
                <div className={styles.miniProgress}><span style={{ width: "25%" }} /></div>
              </div>
            </div>
          </article>

          {/* Ejercicios */}
          <article ref={registerReveal(2)} data-reveal="2" className={`${styles.tile} ${revealClass(2)}`}>
            <div className={styles.tileText}>
              <h3>{t("landing.bento.exercises_title")}</h3>
              <p>{t("landing.bento.exercises_text")}</p>
            </div>
            <div className={styles.chordGame} aria-hidden="true">
              <span className={styles.chordName}>Cmaj7</span>
              <div className={styles.chordSlots}>
                <span className={styles.slotOk}>C</span>
                <span className={styles.slotOk}>E</span>
                <span className={styles.slotOk}>G</span>
                <span className={styles.slotEmpty}>?</span>
              </div>
            </div>
          </article>

          {/* Comunidad */}
          <article id="comunidad" ref={registerReveal(3)} data-reveal="3" className={`${styles.tile} ${revealClass(3)}`}>
            <div className={styles.tileText}>
              <h3>{t("landing.bento.community_title")}</h3>
              <p>{t("landing.bento.community_text")}</p>
            </div>
            <div className={styles.postPreview} aria-hidden="true">
              <div className={styles.postHead}>
                <span className={styles.postAvatar}>A</span>
                <div>
                  <strong>ana_piano</strong>
                  <small>{t("landing.bento.post_time")}</small>
                </div>
              </div>
              <p>{t("landing.bento.post_text")}</p>
              <span className={styles.postLikes}>♥ 42</span>
            </div>
          </article>

          {/* Mensajes */}
          <article ref={registerReveal(4)} data-reveal="4" className={`${styles.tile} ${revealClass(4)}`}>
            <div className={styles.tileText}>
              <h3>{t("landing.bento.messages_title")}</h3>
              <p>{t("landing.bento.messages_text")}</p>
            </div>
            <div className={styles.chatPreview} aria-hidden="true">
              <span className={styles.bubbleOther}>{t("landing.bento.chat_other")}</span>
              <span className={styles.bubbleOwn}>{t("landing.bento.chat_own")}</span>
            </div>
          </article>

          {/* Carpetas */}
          <article ref={registerReveal(5)} data-reveal="5" className={`${styles.tile} ${revealClass(5)}`}>
            <div className={styles.tileText}>
              <h3>{t("landing.bento.folders_title")}</h3>
              <p>{t("landing.bento.folders_text")}</p>
            </div>
            <div className={styles.folders} aria-hidden="true">
              <span>{t("landing.bento.folder_1")}</span>
              <span>{t("landing.bento.folder_2")}</span>
              <span>{t("landing.bento.folder_3")}</span>
            </div>
          </article>
        </div>
      </section>

      {/* ============ CÓMO EMPEZAR (escala ascendente) ============ */}
      <section id="como-empezar" className={styles.section}>
        <div ref={registerReveal(6)} data-reveal="6" className={`${styles.sectionHead} ${revealClass(6)}`}>
          <h2>{t("landing.steps_title")}</h2>
          <p>{t("landing.steps_subtitle")}</p>
        </div>

        <ol ref={registerReveal(7)} data-reveal="7" className={`${styles.steps} ${revealClass(7)}`}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step} style={{ "--step": i }}>
              <span className={styles.stepNote} aria-hidden="true"><span>{i + 1}</span></span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section ref={registerReveal(8)} data-reveal="8" className={`${styles.finalCta} ${revealClass(8)}`}>
        <Equalizer energy={false} bars={40} className={styles.finalEq} />
        <h2>{t("landing.final_cta.title")}</h2>
        <p>{t("landing.final_cta.text")}</p>
        <button type="button" className={styles.ctaPrimary} onClick={goToRegister}>
          {t("landing.final_cta.btn")}
        </button>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className={styles.footer}>
        <div className={styles.footerWave} aria-hidden="true">
          <Equalizer energy={false} bars={64} className={styles.footerEq} />
        </div>

        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <BrandLogo className={styles.footerLogo} />
            <p>{t("landing.footer.brand_desc")}</p>
            <button type="button" className={styles.ctaPrimary} onClick={goToRegister}>
              {t("landing.footer.start_free")}
            </button>
          </div>

          <nav className={styles.footerCol} aria-label={t("landing.footer.col_platform")}>
            <h3>{t("landing.footer.platform")}</h3>
            <a href="#funciones">{t("landing.nav.features")}</a>
            <a href="#funciones">{t("landing.bento.exercises_title")}</a>
            <a href="#comunidad">{t("landing.nav.community")}</a>
            <a href="#probalo">{t("landing.cover.cta_secondary")}</a>
          </nav>

          <nav className={styles.footerCol} aria-label={t("landing.footer.col_account")}>
            <h3>{t("landing.footer.your_account")}</h3>
            <button type="button" onClick={goToLogin}>{t("landing.nav.login")}</button>
            <button type="button" onClick={goToRegister}>{t("landing.hero.cta_register")}</button>
            <a href="#como-empezar">{t("landing.nav.how_to_start")}</a>
          </nav>

          <div className={styles.footerCol}>
            <h3>{t("landing.footer.team")}</h3>
            {TEAM.map((m) => (
              <a key={m.github} href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" className={styles.teamLink}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
                </svg>
                {m.name}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Knowbeat. {t("landing.footer.made_with")}</span>
          <button
            type="button"
            className={styles.backToTop}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {t("landing.footer.back_to_top")}
          </button>
        </div>
      </footer>
    </main>
  );
};

export default Landing;