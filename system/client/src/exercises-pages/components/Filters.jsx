import { crhochromatic_c_scale, seventh_chords_names, traduce_note } from '../utils/chords.js'
import styles from '../css/seventh-chords.module.css'

function Filters({
  setFilters,
  startNote,
  setStartNote,
  endNote,
  setEndNote,
  middleNotesMode,
  setMiddleNotesMode,
}) {
  function handleFilterCheckboxChange(event) {
    const text = event.target.parentElement.textContent.trim()
    setFilters((prev) => {
      const newFilters = { ...prev }
      newFilters[text] = event.target.checked
      return newFilters
    })
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Configuración</h2>
      <div className={styles.filtersGrid}>
        <div className={styles.filterBox}>
          <h3 className={styles.panelTitleSm}>Clasificaciones</h3>
          <form className={styles.checkboxGroup}>
            {seventh_chords_names.map((name) => (
              <label key={name}>
                <input type="checkbox" defaultChecked onChange={handleFilterCheckboxChange} />
                {name}
              </label>
            ))}
          </form>
        </div>

        <div className={styles.filterBox}>
          <h3 className={styles.panelTitleSm}>Registro cromático</h3>
          <div className={styles.rangeInputs}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="start-note">
                Nota inicial
              </label>
              <select id="start-note" value={startNote} onChange={(event) => setStartNote(event.target.value)}>
                {Object.keys(crhochromatic_c_scale).map((generalName) => (
                  <option key={generalName} value={generalName}>
                    {traduce_note(generalName, middleNotesMode)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="end-note">
                Nota final
              </label>
              <select id="end-note" value={endNote} onChange={(event) => setEndNote(event.target.value)}>
                {Object.keys(crhochromatic_c_scale).map((generalName) => (
                  <option key={generalName} value={generalName}>
                    {traduce_note(generalName, middleNotesMode)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.filterBox}>
          <h3 className={styles.panelTitleSm}>Notación</h3>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="notation-select">
              Notas intermedias
            </label>
            <select
              id="notation-select"
              value={middleNotesMode}
              onChange={(event) => setMiddleNotesMode(event.target.value)}
            >
              <option value="flat">Bemol (♭)</option>
              <option value="sharp">Sostenido (♯)</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Filters
