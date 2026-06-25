import Sidebar from "../components/Sidebar";

import styles from "./CSS/Exercises.module.css";

const Exercises = () => {

  /*
  const token =
    localStorage.getItem("token");
  */

  const exerciseTypes = [
    "Solfeo",
    "Ritmo",
    "Escalas",
    "Intervalos",
    "Acordes",
    "Armonía"
  ];

  return (
    <div className={styles.exercises_layout}>

      <Sidebar />

      <main className={styles.exercises_main}>

        {/* HEADER */}

        <div className={styles.exercises_header}>

          <div>

            <h1>
              Ejercicios Musicales
            </h1>

            <p>
              Configurá y practicá distintos
              ejercicios musicales.
            </p>

          </div>

        </div>

        {/* CONTENT */}

        <div className={styles.content_container}>

          {/* LEFT PANEL */}

          <aside className={styles.types_panel}>

            <h3>
              Tipos de Ejercicio
            </h3>

            {
              exerciseTypes.map((type) => (
                <button
                  key={type}
                  className={styles.type_button}
                >
                  {type}
                </button>
              ))
            }

          </aside>

          {/* MAIN PANEL */}

          <section className={styles.exercise_panel}>

            <div className={styles.exercise_card}>

              <h2>
                Ejercicio de Lectura Musical
              </h2>

              <p>
                Practicá la lectura de notas
                en pentagrama.
              </p>

              {/* PREVIEW */}

              <div className={styles.preview_box}>

                <div
                  className={
                    styles.preview_content
                  }
                >
                  🎵

                  <span>
                    El ejercicio aparecerá aquí
                  </span>

                </div>

              </div>

              {/* SETTINGS */}

              <div className={styles.settings_grid}>

                <div>
                  <label>
                    Tempo
                  </label>

                  <input
                    type="range"
                    min="40"
                    max="200"
                  />
                </div>

                <div>
                  <label>
                    Clave
                  </label>

                  <select>
                    <option>
                      Clave de Sol
                    </option>
                    <option>
                      Clave de Fa
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    Nota mínima
                  </label>

                  <select>
                    <option>
                      C3
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    Nota máxima
                  </label>

                  <select>
                    <option>
                      A5
                    </option>
                  </select>
                </div>

              </div>

              <button
                className={styles.start_button}
              >
                Comenzar Ejercicio
              </button>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
};

export default Exercises;