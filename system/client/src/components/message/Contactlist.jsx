import { useState } from 'react'
import ContactCard from './Contactcard'
import styles from './Contactlist.module.css'

// Lista de conversaciones con buscador
export default function ContactList({ friendChats, currentFriendId, onSelect, loaded = true }) {
  const [filter, setFilter] = useState('')
  const entries = Object.entries(friendChats)
  const visible = entries.filter(([, c]) => (c.username ?? '').toLowerCase().includes(filter.trim().toLowerCase()))
  const unreadTotal = entries.reduce((sum, [, c]) => sum + (Number(c.unread_count) || 0), 0)

  return (
    <aside className={styles.panel} aria-label="Conversaciones">
      <div className={styles.head}>
        <h2>Mensajes {unreadTotal > 0 && <span className={styles.unread}>{unreadTotal}</span>}</h2>
        <input
          type="search"
          className={styles.search}
          placeholder="Buscar conversación"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Buscar conversación"
        />
      </div>

      <div className={styles.items}>
        {!loaded && [0, 1, 2].map((n) => <div key={n} className={styles.skeleton} />)}
        {loaded && entries.length > 0 && visible.length === 0 && (
          <p className={styles.empty}>No hay conversaciones con “{filter}”.</p>
        )}
        {visible.map(([id, c]) => (
          <ContactCard
            key={id}
            username={c.username}
            picture={c.picture}
            last_message={c.last_message}
            unread_count={c.unread_count}
            currentFriendId={id === currentFriendId}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </aside>
  )
}
