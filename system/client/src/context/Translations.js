// src/locales/translations.js
export const translations = {
  "es-AR": {
    sidebar: {
      home: "Inicio",
      exercises: "Ejercicios",
      community: "Comunidad",
      profile: "Perfil",
      settings: "Configuración"
    },
    settings: {
        title: "Configuración",
        subtitle: "Administrá tu cuenta y preferencias",
        tabs: {
            notifications: "Notificaciones",
            privacy: "Privacidad",
            appearance: "Apariencia"
        },
        privacy: {
            title: "Privacidad",
            private_account: "Cuenta Privada",
            private_desc: "Solo seguidores aprobados podrán ver tu perfil",
            show_activity: "Mostrar Actividad",
            activity_desc: "Mostrar actividad reciente"
        },
        appearance: {
            language_title: "Idioma",
            language_desc: "Elegí el idioma en el que querés usar Knowbeat.",
            theme_title: "Tema",
            theme_desc: "Elegí cómo querés ver Knowbeat. Se aplica en toda la app.",
            dark: "Oscuro",
            light: "Claro"
        },
        errors: {
            save_failed: "No se pudo guardar el cambio en tu cuenta."
        }
    },
    admin: {
      title: "Panel de Administración",
      subtitle: "Gestiona usuarios, permisos y moderación de KnowBeat",
      badge: "ADMIN",
      tabs: {
        users: "Usuarios",
        reports: "Reportes",
        announcements: "Anuncios"
      },
      stats: {
        total_users: "Total usuarios",
        admins: "Administradores",
        mods: "Moderadores",
        reports: "Reportes"
      },
      users_section: {
        title: "Gestión de Usuarios",
        subtitle: "Administrá permisos, roles y usuarios del sistema",
        filters: {
          all: "Todos",
          users: "Usuarios",
          admins: "Administradores",
          mods: "Moderadores"
        },
        roles: {
          admin: "Administrador",
          mod: "Moderador",
          user: "Usuario",
          you: "Vos"
        },
        delete_btn: "Eliminar"
      },
      reports_section: {
        title: "Reportes",
        subtitle: "Sistema preparado para conexión backend",
        reports_count: "reportes",
        reported_by: "Reportado por: "
      },
      announcements_section: {
        title: "Anuncios",
        subtitle: "Publicaciones para toda la comunidad",
        title_placeholder: "Título",
        message_placeholder: "Mensaje...",
        publish_btn: "Publicar anuncio",
        alert_prepared: "Sistema preparado para conexión backend"
      },
      modal: {
        title: "Eliminar usuario",
        confirmation: "¿Estás seguro que deseas eliminar a",
        cancel: "Cancelar",
        confirm: "Eliminar"
      },
      alerts: {
        cant_delete_admin: "No podés eliminar otro administrador"
      }
    },
    community: {
        title: "Comunidad",
        subtitle: "Preguntá, compartí tus avances y aprendé con otros músicos.",
        search_placeholder: "Buscar publicaciones, carpetas o personas",
        search_aria: "Buscar en la comunidad",
        clear_search_aria: "Borrar búsqueda",
        loading_aria: "Cargando publicaciones",
        error_title: "No se pudo cargar",
        retry_btn: "Reintentar",
        types: {
            threads: "Publicaciones",
            folders: "Carpetas",
            users: "Usuarios"
        },
        composer: {
            default_user: "Vos",
            prompt_prefix: "¿Qué estás practicando hoy",
            publish_btn: "Publicar"
        },
        empty: {
            no_types: "Elegí al menos un tipo de contenido en los filtros.",
            no_search_results: "No se encontraron resultados para tu búsqueda.",
            no_content: "Todavía no hay contenido para mostrar.",
            search_title: "Sin resultados",
            default_title: "Todavía no hay publicaciones",
            create_first: "Crear la primera publicación"
        },
        errors: {
            load_failed: "No se pudo cargar el contenido de la comunidad."
        }
    },
    community_modal: {
        title: "Nueva publicación",
        posting_as: "Publicás como",
        default_user: "vos",
        close_aria: "Cerrar",
        kinds_aria: "Tipo de publicación",
        kinds: {
            pregunta: "Pregunta",
            logro: "Logro",
            consejo: "Consejo",
            recurso: "Recurso"
        },
        placeholders: {
            pregunta: "¿Qué te gustaría saber?",
            logro: "¿Qué conseguiste hoy?",
            consejo: "Compartí un truco que te sirvió",
            recurso: "Una partitura, un video, un ejercicio…"
        },
        default_title_placeholder: "Escribí un título",
        title_aria: "Título",
        text_placeholder: "Contá con detalle: qué estás practicando, qué te trabó, qué descubriste…",
        text_aria: "Cuerpo de la publicación",
        tags_label: "Etiquetas",
        tag_input_placeholder: "Escribí y apretá Enter",
        remove_tag_aria: "Quitar etiqueta",
        suggested_label: "Sugeridas:",
        hint_publish: "para publicar",
        cancel_btn: "Cancelar",
        publish_btn: "Publicar",
        publishing_btn: "Publicando…",
        success_toast: "¡Listo! Tu publicación ya está en la comunidad.",
        errors: {
            max_tags: "Podés agregar hasta {max} etiquetas.",
            title_required: "Poné un título para que otros sepan de qué trata.",
            text_required: "Contanos un poco más en el cuerpo de la publicación.",
            tags_required: "Agregá al menos una etiqueta (por ejemplo, Guitarra).",
            general_bold: "No se pudo publicar.",
            publish_failed: "No se pudo publicar. Probá de nuevo."
        }
    },
    filter_panel: {
        title: "Filtros",
        show_title: "Mostrar",
        tags_title: "Etiquetas",
        tag_input_placeholder: "Buscar por etiqueta…",
        remove_tag_aria: "Quitar etiqueta",
        popular_title: "Populares"
    }
  },
  "en-US": {
    sidebar: {
      home: "Home",
      exercises: "Exercises",
      community: "Community",
      profile: "Profile",
      settings: "Settings"
    },
    settings: {
        title: "Settings",
        subtitle: "Manage your account and preferences",
        tabs: {
            notifications: "Notifications",
            privacy: "Privacy",
            appearance: "Appearance"
        },
        privacy: {
            title: "Privacy",
            private_account: "Private Account",
            private_desc: "Only approved followers can see your profile",
            show_activity: "Show Activity",
            activity_desc: "Show recent activity"
        },
        appearance: {
            language_title: "Language",
            language_desc: "Choose the language you want to use Knowbeat in.",
            theme_title: "Theme",
            theme_desc: "Choose how you want Knowbeat to look. Applied app-wide.",
            dark: "Dark",
            light: "Light"
        },
        errors: {
            save_failed: "Could not save the change to your account."
        }
    },
    admin: {
      title: "Admin Panel",
      subtitle: "Manage users, permissions, and KnowBeat moderation",
      badge: "ADMIN",
      tabs: {
        users: "Users",
        reports: "Reports",
        announcements: "Announcements"
      },
      stats: {
        total_users: "Total users",
        admins: "Administrators",
        mods: "Moderators",
        reports: "Reports"
      },
      users_section: {
        title: "User Management",
        subtitle: "Manage permissions, roles, and system users",
        filters: {
          all: "All",
          users: "Users",
          admins: "Administrators",
          mods: "Moderators"
        },
        roles: {
          admin: "Administrator",
          mod: "Moderator",
          user: "User",
          you: "You"
        },
        delete_btn: "Delete"
      },
      reports_section: {
        title: "Reports",
        subtitle: "System ready for backend connection",
        reports_count: "reports",
        reported_by: "Reported by: "
      },
      announcements_section: {
        title: "Announcements",
        subtitle: "Publications for the entire community",
        title_placeholder: "Title",
        message_placeholder: "Message...",
        publish_btn: "Publish announcement",
        alert_prepared: "System ready for backend connection"
      },
      modal: {
        title: "Delete user",
        confirmation: "Are you sure you want to delete",
        cancel: "Cancel",
        confirm: "Delete"
      },
      alerts: {
        cant_delete_admin: "You cannot delete another administrator"
      }
    },
    community: {
        title: "Community",
        subtitle: "Ask questions, share your progress, and learn with other musicians.",
        search_placeholder: "Search posts, folders, or people",
        search_aria: "Search in community",
        clear_search_aria: "Clear search",
        loading_aria: "Loading posts",
        error_title: "Could not load",
        retry_btn: "Retry",
        types: {
            threads: "Posts",
            folders: "Folders",
            users: "Users"
        },
        composer: {
            default_user: "You",
            prompt_prefix: "What are you practicing today",
            publish_btn: "Publish"
        },
        empty: {
            no_types: "Choose at least one content type in the filters.",
            no_search_results: "No results found for your search.",
            no_content: "There is no content to show yet.",
            search_title: "No results",
            default_title: "No posts yet",
            create_first: "Create the first post"
        },
        errors: {
            load_failed: "Could not load community content."
        }
    },
    community_modal: {
        title: "New post",
        posting_as: "Posting as",
        default_user: "you",
        close_aria: "Close",
        kinds_aria: "Post type",
        kinds: {
            pregunta: "Question",
            logro: "Achievement",
            consejo: "Tip",
            recurso: "Resource"
        },
        placeholders: {
            pregunta: "What would you like to know?",
            logro: "What did you achieve today?",
            consejo: "Share a trick that worked for you",
            recurso: "Sheet music, a video, an exercise..."
        },
        default_title_placeholder: "Write a title",
        title_aria: "Title",
        text_placeholder: "Share details: what you are practicing, what you got stuck on, what you discovered...",
        text_aria: "Post body",
        tags_label: "Tags",
        tag_input_placeholder: "Type and press Enter",
        remove_tag_aria: "Remove tag",
        suggested_label: "Suggested:",
        hint_publish: "to publish",
        cancel_btn: "Cancel",
        publish_btn: "Publish",
        publishing_btn: "Publishing...",
        success_toast: "Done! Your post is now in the community.",
        errors: {
            max_tags: "You can add up to {max} tags.",
            title_required: "Add a title so others know what this is about.",
            text_required: "Tell us a bit more in the body of the post.",
            tags_required: "Add at least one tag (for example, Guitar).",
            general_bold: "Could not publish.",
            publish_failed: "Could not publish. Try again."
        }
    },
    filter_panel: {
        title: "Filters",
        show_title: "Show",
        tags_title: "Tags",
        tag_input_placeholder: "Search by tag...",
        remove_tag_aria: "Remove tag",
        popular_title: "Popular"
    }
  }
};