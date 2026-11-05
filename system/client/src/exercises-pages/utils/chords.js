export const crhochromatic_c_scale = {
  C: ['C', 'B#'],
  CD: ['C#', 'Db'],
  D: ['D'],
  DE: ['D#', 'Eb'],
  E: ['E', 'Fb'],
  F: ['F', 'E#'],
  FG: ['F#', 'Gb'],
  G: ['G'],
  GA: ['G#', 'Ab'],
  A: ['A'],
  AB: ['A#', 'Bb'],
  B: ['B', 'Cb'],
}

export const translate_notes = {
  flat: {
    CD: 'Db',
    DE: 'Eb',
    FG: 'Gb',
    GA: 'Ab',
    AB: 'Bb',
  },
  sharp: {
    CD: 'C#',
    DE: 'D#',
    FG: 'F#',
    GA: 'G#',
    AB: 'A#',
  },
  general: {
    C: ['B#'],
    CD: ['C#', 'Db'],
    DE: ['D#', 'Eb'],
    E: ['Fb'],
    F: ['E#'],
    FG: ['F#', 'Gb'],
    GA: ['G#', 'Ab'],
    AB: ['A#', 'Bb'],
    B: ['Cb'],
  },
}

export const traduce_note = (note, mode) => {
  return Object.entries(translate_notes[mode]).reduce((currentNote, [key, value]) => currentNote.replace(key, value), note)
}

export const traduce_general_note = (note, mode) => {
  if (mode === 'general') {
    return Object.entries(translate_notes[mode]).reduce(
      (currentNote, [key, valueList]) => valueList.reduce((acc, value) => acc.replace(value, key), currentNote),
      note
    )
  }

  return Object.entries(translate_notes[mode]).reduce((currentNote, [key, value]) => currentNote.replace(value, key), note)
}

export const general_notes_names = Object.keys(crhochromatic_c_scale)
export const notes_names = Object.values(crhochromatic_c_scale)

export const seventh_chords_recipe = {
  'Major 7th': {
    symbol: 'maj7',
    semitones: [4, 3, 4],
  },
  'Dominant 7th': {
    symbol: '7',
    semitones: [4, 3, 3],
  },
  'Minor 7th': {
    symbol: 'm7',
    semitones: [3, 4, 3],
  },
  'Half diminished 7th': {
    symbol: 'ø7',
    semitones: [3, 3, 4],
  },
  'Diminished 7th': {
    symbol: 'dim7',
    semitones: [3, 3, 3],
  },
}

export const seventh_chords_names = Object.keys(seventh_chords_recipe)

export const get_note_from_semitones_up = (note, semitones) => {
  const noteIndex = general_notes_names.indexOf(note)
  return general_notes_names[(noteIndex + semitones) % general_notes_names.length]
}

export const get_custom_crhochromatic_c_scale_part = (startNote, endNote) => {
  let current = general_notes_names.indexOf(startNote)
  const endIndex = general_notes_names.indexOf(endNote)
  const result = []

  while (true) {
    result.push(general_notes_names[current])

    if (current === endIndex) {
      break
    }

    current = (current + 1) % general_notes_names.length
  }

  return result
}

export const create_seventh_chord = (note, semitones) => {
  const notes = [note]
  for (const semitone of semitones) {
    notes.push(get_note_from_semitones_up(notes.at(-1), semitone))
  }

  return notes
}

export const generate_seventh_chords = () => {
  const result = {}

  for (const [classification, recipe] of Object.entries(seventh_chords_recipe)) {
    result[classification] = {}

    for (const note of general_notes_names) {
      const symbol = note + recipe.symbol
      result[classification][symbol] = create_seventh_chord(note, recipe.semitones)
    }
  }

  return result
}

export const seventh_chords = generate_seventh_chords()
