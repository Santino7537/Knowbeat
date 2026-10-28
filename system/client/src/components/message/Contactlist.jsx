import ContactCard from './Contactcard'
import styles from './ContactList.module.css'

// Este componente es "tonto" a propósito: no sabe de dónde vienen los contactos ni qué pasa
// al elegir uno. Recibe todo por props y la página decide. Así es reutilizable y fácil de probar.
export default function ContactList({ contacts, activeId, onSelect }) {
  return (
    <aside className={styles.panel} aria-label="Conversaciones">
      {contacts.map((c) => (
        <ContactCard
          key={c.id}
          name={c.name}
          avatar={c.avatar}
          lastMessage={c.lastMessage}
          unreadCount={c.unreadCount}
          isActive={c.id === activeId}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </aside>
  )
}