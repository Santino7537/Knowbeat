import { useEffect, useState } from 'react'
import KeyConfig from './KeyConfig.jsx'
import { traduce_general_note } from '../utils/chords.js'
import styles from '../css/seventh-chords.module.css'

function ChordsGame({ filteredChords }) {
  const [keyboardConfiguration, setKeyboardConfiguration] = useState({
    C: 'D',
    D: 'L',
    E: 'K',
    F: 'J',
    G: 'A',
    A: 'S',
    B: 'F',
    Sharper: 'Shift',
    Flater: 'Control',
  })

  const [playingGame, setPlayingGame] = useState(false)
  const [seconds, setSeconds] = useState(60)
  const [chordsQuantity, setChordsQuantity] = useState(10)
  const [gameTimer, setGameTimer] = useState(seconds)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [currentChordLength, setCurrentChordLength] = useState(4)
  const [notesList, setNotesList] = useState([])
  const [randomChords, setRandomChords] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [chordIndex, setChordIndex] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)

  useEffect(() => {
    const pressed = new Set()

    const handleKeyDown = (event) => {
      if (event.repeat) return
      pressed.add(event.key.toLowerCase())

      if (
        playingGame &&
        pressed.size <= 2 &&
        [...pressed].filter((key) => key.length === 1).length === 1 &&
        notesList.length < currentChordLength
      ) {
        let pressedNote = ''
        const sortedKeyboardConfiguration = Object.entries(keyboardConfiguration).sort((a, b) => {
          const keyA = a[0]
          const keyB = b[0]

          if (keyA.length !== keyB.length) {
            return keyA.length - keyB.length
          }

          return keyA.localeCompare(keyB)
        })

        for (const [note, key] of sortedKeyboardConfiguration) {
          if (pressed.has(key.toLowerCase())) {
            const changeNote = { Sharper: '#', Flater: 'b' }
            const normalizedNote = changeNote[note] ?? note
            pressedNote += normalizedNote
          }
        }

        if (!['', '#', 'b'].includes(pressedNote)) {
          handleNoteListInsertion(pressedNote)
        }
      }
    }

    const handleKeyUp = (event) => {
      pressed.delete(event.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [playingGame, notesList, currentChordLength, keyboardConfiguration])

  useEffect(() => {
    if (!playingGame) return

    if (gameTimer === 0) {
      setPlayingGame(false)
      setGameFinished(true)
      return
    }

    const timer = window.setTimeout(() => {
      setGameTimer((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [playingGame, gameTimer])

  useEffect(() => {
    if (notesList.length === currentChordLength) {
      setShowResults(true)

      if (isSameList(notesList, randomChords[chordIndex]?.notes ?? [])) {
        setCorrectAnswers((prev) => prev + 1)
      }

      const timer = window.setTimeout(() => {
        nextChord()
        setNotesList([])
        setShowResults(false)
      }, 1000)

      return () => window.clearTimeout(timer)
    }
  }, [currentChordLength, chordIndex, notesList, randomChords])

  function isSameList(a, b) {
    if (a.length === b.length) {
      const sortedA = [...a].sort().map((note) => traduce_general_note(note, 'general'))
      const sortedB = [...b].sort().map((note) => traduce_general_note(note, 'general'))
      return sortedA.join('|') === sortedB.join('|')
    }
    return false
  }

  function isSameNote(a, b) {
    return traduce_general_note(a, 'general') === traduce_general_note(b, 'general')
  }

  function handleNoteListInsertion(note) {
    if (notesList.length < currentChordLength) {
      setNotesList((prev) => {
        const newNotesList = [...prev]
        newNotesList.push(note)
        return newNotesList
      })
    }
  }

  function nextChord() {
    if (chordIndex === randomChords.length - 1) {
      setPlayingGame(false)
      setGameFinished(true)
    } else {
      setChordIndex((prev) => prev + 1)
      setCurrentChordLength(randomChords[chordIndex]?.notes?.length ?? 4)
    }
  }

  function startGame() {
    setGameTimer(seconds)
    setCorrectAnswers(0)
    setGameFinished(false)
    setChordIndex(0)
    setNotesList([])
    setShowResults(false)
    setCurrentChordLength(4)

    const allChords = Object.values(filteredChords).flatMap((group) =>
      Object.entries(group).map(([name, notes]) => ({ name, notes }))
    )

    const randomChordsList = Array.from({ length: chordsQuantity }, () =>
      allChords[Math.floor(Math.random() * allChords.length)]
    )

    setRandomChords(randomChordsList)
    setCurrentChordLength(randomChordsList[0]?.notes.length ?? 4)
    setPlayingGame(true)
  }

  const showIdle = !playingGame && randomChords.length === 0 && !gameFinished
  const showFinished = !playingGame && gameFinished
  const currentChord = randomChords[chordIndex]

  return (
    <section id="game-section" className={styles.panel}>
      <h2 className={styles.panelTitle}>Ejercicio</h2>

      <div className={styles.exerciseConfig}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="game-time">
            Tiempo (segundos)
          </label>
          <input
            id="game-time"
            type="number"
            value={seconds}
            disabled={playingGame}
            onChange={(event) => setSeconds(Math.min(600, Math.max(10, Number(event.target.value))))}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="chords-quantity">
            Cantidad de acordes
          </label>
          <input
            id="chords-quantity"
            type="number"
            value={chordsQuantity}
            disabled={playingGame}
            onChange={(event) => setChordsQuantity(Math.min(100, Math.max(5, Number(event.target.value))))}
          />
        </div>
      </div>

      <button
        className={`${styles.primaryButton}${playingGame ? ` ${styles.disabledButton}` : ''}`}
        disabled={playingGame}
        onClick={startGame}
      >
        {showFinished ? 'Jugar de nuevo' : 'Iniciar ejercicio'}
      </button>

      <div className={styles.exerciseArea}>
        <div className={styles.exerciseTopbar}>
          {playingGame && (
            <>
              <span className={styles.statBadge}>
                Aciertos: <strong>{correctAnswers}</strong> / {chordsQuantity}
              </span>
              <span className={styles.statBadge}>
                Tiempo: <strong>{gameTimer}</strong>s
              </span>
            </>
          )}
        </div>

        {showFinished && (
          <p className={styles.gameFinished}>
            Ejercicio terminado — obtuviste <strong>{correctAnswers}</strong> de <strong>{chordsQuantity}</strong> aciertos.
          </p>
        )}

        <div className={`${styles.currentChord}${showIdle ? ` ${styles.currentChordIdle}` : ''}`}>
          {showIdle ? 'Pulsa «Iniciar ejercicio» para comenzar' : currentChord?.name ?? '—'}
        </div>

        {playingGame && <p className={styles.gameHint}>Escribe las notas con el teclado configurado abajo</p>}

        <div className={styles.answerBox}>
          {Array.from({ length: currentChordLength }, (_, index) => (
            <div
              key={index}
              className={`${styles.noteSlot}${showResults && playingGame
                ? isSameNote(notesList[index], currentChord?.notes?.[index])
                  ? ` ${styles.noteSlotGoodAnswer}`
                  : ` ${styles.noteSlotBadAnswer}`
                : ''}`}
            >
              {playingGame ? notesList[index] ?? null : null}
            </div>
          ))}
        </div>
      </div>

      <KeyConfig keyboardConfiguration={keyboardConfiguration} setKeyboardConfiguration={setKeyboardConfiguration} />
    </section>
  )
}

export default ChordsGame
