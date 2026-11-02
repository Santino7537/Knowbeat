import Avatar from '../general/Avatar.jsx'
import styles from './Contactcard.module.css'

export default function ContactCard({ username, picture, last_message, unread_count = 0, currentFriendId, onClick }) {
  const badgeText = unread_count > 99 ? '+99' : unread_count
  const hasUnread = unread_count > 0

  return (
    <button
      type="button"
      className={`${styles.card} ${currentFriendId ? styles.active : ''} ${hasUnread ? styles.hasUnread : ''}`}
      aria-current={currentFriendId ? 'true' : undefined}
      onClick={onClick}
    >
      <Avatar name={username} src={picture} size={46} />
      <span className={styles.info}>
        <span className={styles.name}>{username}</span>
        <span className={styles.lastMessage}>{last_message || 'Todavía no hay mensajes'}</span>
      </span>
      {hasUnread && <span className={styles.badge} aria-label={`${unread_count} sin leer`}>{badgeText}</span>}
    </button>
  )
}
