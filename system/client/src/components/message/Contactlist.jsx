import ContactCard from './Contactcard'
import styles from './ContactList.module.css'

export default function ContactList({ friendChats, currentFriendId, onSelect }) {
  return (
    <aside className={styles.panel} aria-label="Conversaciones">
      {Object.entries(friendChats).map(([id, c]) => (
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
    </aside>
  )
}