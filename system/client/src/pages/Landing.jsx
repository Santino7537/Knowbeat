import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useNavigate
} from "react-router-dom";

import styles from './CSS/Landing.module.css';

const Landing = () => {

  /* =====================================
      NAVIGATE
  ===================================== */

  const navigate = useNavigate();

  /* =====================================
      SCROLL REVEAL
  ===================================== */

  const featuresRef = useRef(null);

  const [featuresVisible, setFeaturesVisible] =
    useState(false);

  useEffect(() => {

    const observer = new IntersectionObserver(

      ([entry]) => {

        if(entry.isIntersecting){

          setFeaturesVisible(true);

        }

      },

      {
        threshold:0.2
      }

    );

    if(featuresRef.current){

      observer.observe(
        featuresRef.current
      );

    }

    return () => {

      if(featuresRef.current){

        observer.unobserve(
          featuresRef.current
        );

      }

    };

  }, []);

  return (

    <main className={styles.landing}>

      {/* =========================
          BACKGROUND
      ========================= */}

      <div className={styles.background_elements}>

        <div className={styles.glow, styles.glow_1}></div>
        <div className={styles.glow, styles.glow_2}></div>
        <div className={styles.glow, styles.glow_3}></div>

        {/* PARTITURA */}

        <div className={styles.music_waves}>

          <svg
            className={styles.waves_svg}
            viewBox="0 0 2200 1800"
            preserveAspectRatio="none"
          >

            <g className={styles.staff_group}>

              <path d="M-200 260 Q400 120 900 260 T2400 260" />
              <path d="M-200 300 Q400 160 900 300 T2400 300" />
              <path d="M-200 340 Q400 200 900 340 T2400 340" />
              <path d="M-200 380 Q400 240 900 380 T2400 380" />
              <path d="M-200 420 Q400 280 900 420 T2400 420" />

            </g>

            <g className={styles.floating_notes}>

              <g className={styles.music_note ,styles.note_1}>
                <ellipse cx="320" cy="280" rx="10" ry="8" />
                <line x1="329" y1="280" x2="329" y2="200" />
              </g>

              <g className="music-note note-2">
                <ellipse
                  cx="680"
                  cy="350"
                  rx="10"
                  ry="8"
                  fill="transparent"
                />
                <line x1="689" y1="350" x2="689" y2="260" />
              </g>

              <g className="music-note note-3">
                <ellipse cx="1080" cy="260" rx="10" ry="8" />
                <line x1="1089" y1="260" x2="1089" y2="160" />
                <path d="M1089 160 Q1125 180 1110 220" />
              </g>

              <g className="music-note note-4">
                <ellipse cx="1520" cy="340" rx="10" ry="8" />
                <line x1="1529" y1="340" x2="1529" y2="220" />
                <path d="M1529 220 Q1565 240 1548 280" />
                <path d="M1529 255 Q1560 272 1545 305" />
              </g>

              <g className="music-note note-5">
                <ellipse cx="1820" cy="280" rx="10" ry="8" />
                <line x1="1829" y1="280" x2="1829" y2="180" />
              </g>

              <g className="music-note note-6">
                <ellipse cx="1320" cy="430" rx="10" ry="8" />
                <line x1="1329" y1="430" x2="1329" y2="320" />
              </g>

              <g className="music-note note-7">
                <ellipse cx="520" cy="430" rx="10" ry="8" />
                <line x1="529" y1="430" x2="529" y2="340" />
              </g>

            </g>

          </svg>

        </div>

        {/* LOWER NOTES */}

        <div className="bottom-floating-notes">

          <div className="music-gradient"></div>

          <span className="float-note fn1">♪</span>
          <span className="float-note fn2">♫</span>
          <span className="float-note fn3">♬</span>
          <span className="float-note fn4">♩</span>
          <span className="float-note fn5">♪</span>
          <span className="float-note fn6">♫</span>
          <span className="float-note fn7">♬</span>
          <span className="float-note fn8">♩</span>
          <span className="float-note fn9">♪</span>
          <span className="float-note fn10">♫</span>
          <span className="float-note fn11">♬</span>
          <span className="float-note fn12">♩</span>

        </div>

      </div>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">

        <p className="mini-tag">
          Música · Comunidad · Aprendizaje
        </p>

        <h1 className="title">
          KNOWBEAT
        </h1>

        <p className="slogan">
          Descubrí una nueva forma de aprender,
          practicar y compartir música.
        </p>

        <p className="desc">
          Una plataforma moderna donde cualquier persona
          puede explorar teoría musical, practicar ejercicios
          y formar parte de una comunidad creativa.
        </p>

        <div className="hero-buttons">

          {/* =====================================
              BOTÓN FUNCIONAL
          ===================================== */}

          <button
            className="primary-btn"

            onClick={() =>
              navigate("/Login")
            }
          >
            <span>
              Comenzá ahora
            </span>
          </button>

        </div>

      </section>

      {/* =========================
          FEATURES
      ========================= */}

      <section
        ref={featuresRef}

        className={`features-section scroll-section ${
          featuresVisible
            ? 'show-section'
            : ''
        }`}
      >

        <div className="features-transition"></div>

        <div className="features-header">

          <p className="features-mini">
            TODO EN UN SOLO LUGAR
          </p>

          <h2>
            Aprendé música con una experiencia
            visual, moderna e interactiva.
          </h2>

        </div>

        <div className="features">

          <article className="card">

            <div className="card-blur"></div>

            <div className="card-line"></div>

            <h3>
              Aprendizaje práctico
            </h3>

            <p>
              Accedé a teoría musical y ejercicios dinámicos
              diseñados para aprender a tu ritmo.
            </p>

          </article>

          <article className="card">

            <div className="card-blur"></div>

            <div className="card-line"></div>

            <h3>
              Comunidad activa
            </h3>

            <p>
              Compartí ideas, descubrí contenido
              y conectate con personas apasionadas por la música.
            </p>

          </article>

          <article className="card">

            <div className="card-blur"></div>

            <div className="card-line"></div>

            <h3>
              Ejercicios personalizados
            </h3>

            <p>
              Practicá distintas habilidades musicales
              mediante rutas adaptadas a tus objetivos.
            </p>

          </article>

        </div>

      </section>

    </main>

  );

};

export default Landing;