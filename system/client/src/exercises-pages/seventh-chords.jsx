import { useMemo, useState } from 'react'
import Filters from './components/Filters.jsx'
import ChordsGame from './components/ChordsGame.jsx'
import {
  general_notes_names,
  seventh_chords_names,
  seventh_chords,
  get_custom_crhochromatic_c_scale_part,
  traduce_note,
} from './utils/chords.js'
import styles from './css/seventh-chords.module.css'

function SeventhChordsExercise() {
  const [filters, setFilters] = useState(
    Object.fromEntries(seventh_chords_names.map((name) => [name, true]))
  )
  const [startNote, setStartNote] = useState(general_notes_names[0])
  const [endNote, setEndNote] = useState(general_notes_names[0])
  const [middleNotesMode, setMiddleNotesMode] = useState('flat')

  const customChromaticScalePart = useMemo(
    () => get_custom_crhochromatic_c_scale_part(startNote, endNote),
    [startNote, endNote]
  )

  const filteredChords = useMemo(() => {
    return Object.keys(filters)
      .filter((classification) => filters[classification])
      .reduce((acc, classification) => {
        const chords = Object.entries(seventh_chords[classification])
          .filter(([, chordNotes]) => customChromaticScalePart.includes(chordNotes[0]))
          .reduce((obj, [chordName, chordNotes]) => {
            obj[traduce_note(chordName, middleNotesMode)] = chordNotes.map((note) =>
              traduce_note(note, middleNotesMode)
            )
            return obj
          }, {})

        acc[classification] = chords
        return acc
      }, {})
  }, [customChromaticScalePart, filters, middleNotesMode])

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <h1>Averiguar notas de acordes</h1>
        <p className={styles.pageSubtitle}>
          Practica identificando las notas de acordes de séptima con el teclado.
        </p>
      </header>

      <Filters
        setFilters={setFilters}
        startNote={startNote}
        setStartNote={setStartNote}
        endNote={endNote}
        setEndNote={setEndNote}
        middleNotesMode={middleNotesMode}
        setMiddleNotesMode={setMiddleNotesMode}
      />
      <ChordsGame filteredChords={filteredChords} />
    </main>
  )
}

export default SeventhChordsExercise
