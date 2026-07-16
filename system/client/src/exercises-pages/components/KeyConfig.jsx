import { useState } from 'react'
import styles from '../css/seventh-chords.module.css'

const NOTE_LABELS = {
  C: 'Do (C)',
  D: 'Re (D)',
  E: 'Mi (E)',
  F: 'Fa (F)',
  G: 'Sol (G)',
  A: 'La (A)',
  B: 'Si (B)',
  Sharper: 'Sostenido (♯)',
  Flater: 'Bemol (♭)',
}

function KeyConfig({ keyboardConfiguration, setKeyboardConfiguration }) {
  const letters = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))
  const [allowedKeys, setAllowedKeys] = useState(
    Object.fromEntries([...letters, 'Shift', 'Control'].map((key) => [key, !Object.values(keyboardConfiguration).includes(key)]))
  )

  function handleKeyboardConfigurationChange(name, key) {
    setKeyboardConfiguration((prev) => {
      const newKeyboardConfiguration = { ...prev }
      newKeyboardConfiguration[name] = key
      return newKeyboardConfiguration
    })
  }

  function handleAllowedKeysChange(event) {
    const name = event.target.id.replace('-key', '')
    const newKey = event.target.value
    const oldKey = keyboardConfiguration[name]

    setAllowedKeys((prev) => {
      const newAllowedKeys = { ...prev }
      newAllowedKeys[newKey] = false
      newAllowedKeys[oldKey] = true
      return newAllowedKeys
    })

    handleKeyboardConfigurationChange(name, newKey)
  }

  return (
    <div className={styles.keyboardHelpArea}>
      <h3 className={styles.panelTitleSm}>Teclado</h3>
      <div className={styles.keyboardGrid}>
        {Object.entries(keyboardConfiguration).map(([name, key]) => (
          <div key={name} className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`${name}-key`}>
              {NOTE_LABELS[name] ?? name}
            </label>
            <select id={`${name}-key`} value={keyboardConfiguration[name]} onChange={handleAllowedKeysChange}>
              {Object.keys(allowedKeys)
                .filter((allowedKey) => allowedKeys[allowedKey] || allowedKey === keyboardConfiguration[name])
                .map((allowedKey) => (
                  <option key={allowedKey} value={allowedKey}>
                    {allowedKey}
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>
      <p className={styles.keyboardHint}>
        Mantén Shift o Control junto a una nota para añadir ♯ o ♭.
      </p>
    </div>
  )
}

export default KeyConfig
