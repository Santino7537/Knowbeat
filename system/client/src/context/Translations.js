// src/locales/translations.js
export const translations = {
  "es-AR": {
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
      },
      users_section: {
        filters: {
          all: "Todos los roles",
          users: "Usuarios",
          admins: "Administradores",
          mods: "Moderadores"
        }
      },
      modal: {
        cancel: "Cancelar",
        confirm: "Confirmar eliminación"
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
    },
    landing: {
      piano_aria: "Piano de una octava",
      topics_aria: "Temas que vas a aprender",
      topics_title: "Lo que vas a aprender",
      prev_topic: "Tema anterior",
      next_topic: "Tema siguiente",
      select_topic_aria: "Elegí un tema",
      levels: {
        initial: "Inicial",
        intermediate: "Intermedio",
        advanced: "Avanzado"
      },
      topics: {
        t1_title: "Acordes de séptima",
        t1_text: "Mayores, menores, dominantes y disminuidos: escuchalos y armalos.",
        t2_title: "Escalas mayores",
        t2_text: "La base de todo: aprendé el patrón de tonos y semitonos.",
        t3_title: "Lectura en pentagrama",
        t3_text: "Leé notas en clave de sol y de fa sin contar líneas.",
        t4_title: "Intervalos",
        t4_text: "Reconocé la distancia entre dos notas de oído y en papel.",
        t5_title: "Ritmo y compás",
        t5_text: "Figuras, silencios y subdivisiones con metrónomo.",
        t6_title: "Partes de la guitarra",
        t6_text: "Conocé tu instrumento antes de tocar el primer acorde.",
        t7_title: "Armonía básica",
        t7_text: "Por qué algunos acordes suenan bien juntos.",
        t8_title: "Solfeo",
        t8_text: "Entoná melodías y entrená tu oído musical.",
        t9_title: "Progresiones",
        t9_text: "Las secuencias de acordes de tus canciones favoritas."
      },
      nav: {
        logo_aria: "Knowbeat, inicio",
        sections_aria: "Secciones",
        features: "Qué podés hacer",
        how_to_start: "Cómo empezar",
        community: "Comunidad",
        login: "Iniciar sesión"
      },
      cover: {
        kicker: "Aprendé · Practicá · Compartí",
        text: "La plataforma para aprender música desde cero, practicar con ejercicios interactivos y crecer junto a una comunidad de músicos.",
        cta_primary: "Empezar gratis",
        cta_secondary: "Probá el piano",
        scroll_aria: "Bajar a la siguiente sección"
      },
      hero: {
        title_1: "La música",
        title_2: "se aprende",
        title_3: "tocando.",
        text: "Lecciones guiadas, ejercicios para practicar a tu ritmo y una comunidad para compartir lo que vas aprendiendo. No hace falta saber nada antes.",
        cta_register: "Crear mi cuenta",
        cta_login: "Ya tengo cuenta"
      },
      instrument: {
        playing: "Sonando",
        try_it: "Probalo",
        prompt: "Tocá una tecla",
        hint: "Hacé clic en las teclas o usá",
        hint_to: "a",
        hint_keyboard: "en tu teclado"
      },
      bento: {
        main_title: "Todo lo que necesitás para aprender, practicar y compartir",
        main_subtitle: "Teoría, práctica y gente con la que tocar, en un solo lugar.",
        classes_title: "Clases guiadas",
        classes_text: "Cada curso es un recorrido sobre el pentagrama: completás una lección y se ilumina la siguiente. Podés repetir las que quieras.",
        lesson_progress: "Lección 3 de 12",
        exercises_title: "Ejercicios a tu medida",
        exercises_text: "Elegí qué practicar y con qué dificultad, sin seguir un orden.",
        community_title: "Comunidad",
        community_text: "Publicá dudas y avances, dale me gusta a otros y seguí a quien te inspire.",
        post_time: "hace 5 horas",
        post_text: "Terminé el curso de armonía básica. Ahora entiendo las progresiones.",
        messages_title: "Mensajes en tiempo real",
        messages_text: "Chateá con tus amigos o sumate a conversaciones grupales.",
        chat_other: "¿Practicamos los acordes mañana?",
        chat_own: "Dale, a las 18.",
        folders_title: "Carpetas para tu material",
        folders_text: "Guardá partituras y archivos, públicos o privados, y explorá los de otros.",
        folder_1: "Partituras",
        folder_2: "Tablaturas",
        folder_3: "Mis grabaciones"
      },
      steps_title: "Empezá en cuatro pasos",
      steps_subtitle: "Como una escala: cada paso un poco más arriba.",
      steps: {
        s1_title: "Creá tu cuenta",
        s1_text: "Es gratis y no necesitás saber nada de música para empezar.",
        s2_title: "Elegí un curso",
        s2_text: "Guitarra o piano, con lecciones cortas que avanzan de a poco.",
        s3_title: "Practicá",
        s3_text: "Ejercicios de acordes, escalas e intervalos, en el orden que quieras.",
        s4_title: "Compartí",
        s4_text: "Publicá tus avances, resolvé dudas y seguí a otros músicos."
      },
      final_cta: {
        title: "Tu primera lección te está esperando",
        text: "Creá tu cuenta gratis y empezá hoy, con o sin experiencia.",
        btn: "Crear mi cuenta"
      },
      footer: {
        brand_desc: "Aprendé música a tu ritmo, practicá todos los días y compartí lo que vas descubriendo.",
        start_free: "Empezar gratis",
        platform: "Plataforma",
        your_account: "Tu cuenta",
        team: "Equipo",
        made_with: "Hecho con ♪ por estudiantes, para músicos.",
        back_to_top: "Volver arriba ↑",
        col_platform: "Plataforma",
        col_account: "Cuenta"
      }
    },
    courses_page: {
      title: "Mis Cursos",
      subtitle: "Continuá aprendiendo donde lo dejaste.",
      explore_catalog: "Explorar catálogo",
      retry: "Reintentar",
      empty: {
        title: "Todavía no estás anotado a ningún curso",
        desc: "Cuando te inscribas a un curso aparecerá aquí."
      },
      errors: {
        load_failed: "No pudimos cargar tus cursos."
      }
    },
    catalog_page: {
      title: "Catálogo de cursos",
      subtitle: "Explorá los cursos disponibles para aprender.",
      my_courses_btn: "Mis Cursos",
      messages: {
        registered_success: "Ya estás anotado al curso. Lo encontrarás en Mis Cursos.",
        already_registered: "Ya estabas anotado a este curso."
      },
      empty: {
        title: "No hay cursos disponibles",
        desc: "Cuando se agreguen cursos, aparecerán en este catálogo."
      },
      errors: {
        load_failed: "No se pudo cargar el catálogo. Probá nuevamente.",
        register_failed: "No se pudo completar la inscripción."
      }
    },
    lesson_map_page: {
      back_to_courses: "Volver a mis cursos",
      map_aria: "Recorrido de lecciones",
      course_fallback: "Curso",
      lesson_fallback: "Lección",
      lesson_upcoming: "El contenido de esta lección estará disponible próximamente.",
      lesson_type: "Lección",
      loading_progress: "Cargando el progreso del curso...",
      all_completed: "Completaste todas las lecciones de este curso.",
      errors: {
        invalid_course: "El curso solicitado no es válido.",
        invalid_progress_response: "La respuesta de progreso del servidor no es válida.",
        not_enrolled: "No estás anotado a este curso.",
        invalid_progress_data: "Los datos de progreso del curso no son válidos.",
        load_progress_failed: "No se pudo cargar el progreso del curso.",
        progress_changed: "El progreso del curso cambió. Volvé al curso y actualizá el mapa.",
        invalid_update_response: "La respuesta de actualización del progreso no es válida.",
        save_progress_failed: "No se pudo guardar el progreso. Intentá nuevamente.",
        lesson_not_available: "El contenido de esta lección todavía no está disponible."
      }
    },
    exercises_page: {
      title: "Ejercicios Musicales",
      subtitle: "Elegí un tipo de ejercicio y empezá a practicar.",
      filter_title: "Filtrar por tipo",
      all_types: "Todos",
      all_exercises: "Todos los ejercicios",
      exercises_of: "Ejercicios de {type}",
      coming_soon: "Próximamente",
      start_link: "Empezar →",
      stats: {
        available_singular: "disponible",
        available_plural: "disponibles"
      },
      empty: {
        title: "Sin ejercicios por ahora",
        desc: "Probá con otra categoría o volvé más adelante cuando agreguemos nuevos ejercicios.",
        reset_btn: "Ver todos los ejercicios"
      }
    },
    messages_page: {
      friendship_subtitle: "Amistad en Knowbeat",
      view_profile: "Ver perfil",
      close_alert: "Cerrar aviso",
      loading_older: "Cargando mensajes anteriores…",
      composer_placeholder: "Escribile a {username}…",
      days: {
        today: "Hoy",
        yesterday: "Ayer"
      },
      empty_chats: {
        title: "Todavía no tenés conversaciones",
        desc: "Cuando agregues amigos vas a poder chatear con ellos desde acá. Buscá gente en la comunidad.",
        btn: "Ir la comunidad"
      },
      empty_conversation: {
        title: "Empezá la charla con {username}",
        desc: "Un saludo rápido para romper el hielo:"
      },
      errors: {
        load_chats_failed: "No se pudieron cargar las conversaciones.",
        load_messages_failed: "No se pudieron cargar los mensajes.",
        load_more_failed: "No se pudieron cargar más mensajes.",
        send_failed: "No se pudo enviar el mensaje. Probá de nuevo."
      }
    },
    profile_page: {
      loading: "Cargando perfil…",
      header_aria: "Información del perfil",
      courses_aria: "Cursos del perfil",
      courses_title: "Cursos en progreso",
      friends: {
        delete: "Eliminar amigo",
        cancel_request: "Cancelar solicitud",
        add: "Agregar amigo",
        send_message: "Enviar mensaje",
        status_friends: "Amigos · Eliminar",
        status_pending: "Solicitud enviada · Cancelar"
      },
      requests: {
        accept_aria: "Aceptar solicitud",
        accept_title: "Aceptar",
        reject_aria: "Rechazar solicitud",
        reject_title: "Rechazar",
        loading: "Cargando…",
        empty: "No hay solicitudes pendientes"
      },
      modal: {
        close_aria: "Cerrar ventana",
        edit_title: "Editar perfil",
        requests_title: "Solicitudes de amistad"
      },
      streak: {
        aria: "Racha de aprendizaje",
        loading: "Cargando racha…",
        day: "día",
        days: "días",
        positive: "· Seguí así",
        zero: "· practicá hoy para empezar"
      },
      bio: {
        add_prompt: "+ Agregá una biografía para que la comunidad te conozca",
        empty_other: "Este músico todavía no escribió su biografía."
      },
      actions: {
        edit: "Editar perfil",
        requests: "Solicitudes"
      },
      stats: {
        aria: "Estadísticas",
        total_score: "score total",
        course_singular: "curso en progreso",
        course_plural: "cursos en progreso",
        lesson_singular: "lección completada",
        lesson_plural: "lecciones completadas"
      },
      form: {
        username: "Nombre de usuario",
        email: "Email",
        biography: "Biografía",
        bio_placeholder: "Contale a la comunidad quién sos",
        password: "Nueva contraseña",
        optional: "opcional",
        saving: "Guardando...",
        save_btn: "Guardar cambios"
      },
      private: {
        title: "El progreso es privado",
        desc: "Este usuario eligió mantener sus cursos fuera de su perfil público."
      },
      empty_courses: {
        title: "Todavía no hay cursos en progreso",
        owner_desc: "Elegí tu primer curso y empezá a aprender hoy.",
        other_desc: "Cuando se inscriba en un curso, va a aparecer acá.",
        explore_btn: "Explorar cursos"
      },
      toast: {
        goal_updated: "Meta diaria actualizada.",
        profile_updated: "Perfil actualizado."
      },
      errors: {
        friend_action_failed: "No se pudo completar la acción de amistad.",
        streak_unavailable: "Racha no disponible",
        not_found: "Usuario no encontrado.",
        load_failed: "No se pudo cargar el perfil.",
        goal_invalid: "La meta diaria debe ser un número entero entre 1 y 5000.",
        goal_update_failed: "No se pudo actualizar la meta diaria.",
        profile_save_failed: "No se pudo guardar el perfil."
      }
    },
    daily_score: {
      goal_label: "Meta diaria",
      goal_placeholder: "Puntos",
      goal_aria: "Objetivo diario de puntos",
      saving: "Guardando...",
      save_btn: "Guardar",
      section_aria: "Objetivo diario e historial de score",
      eyebrow: "Historial de score",
      title: "Actividad de los últimos 7 días",
      loading: "Cargando actividad…",
      chart_aria: "Gráfico de actividad diaria",
      points_unit: "puntos"
    },
    message_input: {
      default_placeholder: "Escribí un mensaje…",
      aria_label: "Escribí un mensaje",
      send_aria: "Enviar mensaje"
    },
    course_card: {
      lesson_singular: "lección",
      lesson_plural: "lecciones",
      lessons_count_label: "lecciones",
      remaining_label: "restantes",
      progress_aria: "Progreso de {name}",
      continue_btn: "Continuar",
      status: {
        completed: "Completado",
        in_progress: "En progreso"
      },
      catalog: {
        already_enrolled: "Ya estás anotado",
        available: "Disponible",
        coming_soon_title: "Disponible próximamente",
        view_content: "Ver contenido",
        enrolled_badge: "Inscripto",
        registering: "Inscribiendo...",
        register_btn: "Inscribirme"
      }
    },
    lesson_completion: {
      eyebrow: "LECCIÓN FINALIZADA",
      passed_title: "¡Buen trabajo!",
      failed_title: "Seguí practicando",
      correct_answers: "Respuestas correctas:",
      of: "de",
      replay_message: "Terminaste la práctica. Tu progreso del curso se mantiene sin cambios.",
      passed_message: "Aprobaste esta lección y tu progreso quedó guardado.",
      fail_message: "Terminaste la lección, pero no alcanzaste el requisito para aprobarla.",
      retry_btn: "Reintentar lección",
      return_btn: "Volver al curso"
    },
    lesson_player: {
      exit_aria: "Salir de la lección",
      exit_btn: "Salir",
      progress_aria: "Progreso de la lección",
      lesson_label: "Lección",
      prev_btn: "Anterior",
      next_btn: "Siguiente",
      finish_btn: "Finalizar lección",
      saving: "Guardando...",
      retry_save: "Reintentar guardado",
      registered_answers: "Respuestas registradas: {count}.",
      errors: {
        save_failed: "No se pudo guardar el progreso. Intentá nuevamente."
      }
    },
    exercise_slide: {
      check_btn: "Comprobar respuesta"
    },
    sidebar: {
      nav: {
        label: "Menú Principal",
        learn: "Aprender",
        community: "Comunidad",
        exercises: "Ejercicios",
        folders: "Carpetas",
        messages: "Mensajes"
      },
      profile: {
        fallback: "Perfil"
      },
      aria: {
        close_menu: "Cerrar menú",
        open_menu: "Abrir menú",
        sidebar_label: "Sidebar principal",
        expand_menu: "Expandir menú lateral",
        collapse_menu: "Minimizar menú lateral",
        go_home: "Ir al inicio",
        main_menu: "Menú principal",
        profile_of: "Ir al perfil de {username}",
        profile: "Ir al perfil",
        settings: "Configuración"
      },
      titles: {
        expand: "Expandir menú",
        collapse: "Minimizar menú",
        profile_of: "Perfil de {username}",
        profile: "Perfil",
        settings: "Configuración"
      }
    },
    lessons: {
      "guitar-intro-parts-001": {
        title: "Introducción a la guitarra: sus partes",
        description: "Conoce las piezas principales de la guitarra y descubre para qué sirve cada una.",
        slides: {
          "slide-01": {
            title: "Conociendo la guitarra",
            blocks: [
              "La guitarra es un instrumento de cuerda presente en muchísimos estilos musicales. Puede acompañar una canción con acordes, tocar melodías o llevar solos.",
              "Existen distintos tipos, como la guitarra clásica, la acústica y la eléctrica. Su forma y algunos de sus componentes cambian, pero comparten varias partes y principios de funcionamiento.",
              "En esta lección vamos a reconocer las partes principales. No hace falta memorizarlas todas de golpe: por ahora, intenta relacionar cada nombre con la pieza correspondiente."
            ],
            imageAlt: "Vista general de una guitarra con sus partes principales"
          },
          "slide-02": {
            title: "¿De qué está hecha?",
            blocks: [
              "La guitarra está formada por varias piezas que trabajan juntas para que podamos tocar y producir sonido.",
              "Algunas sujetan y afinan las cuerdas; otras nos permiten elegir las notas; y otras ayudan a transmitir o proyectar las vibraciones. Vamos a conocerlas una por una."
            ],
            imageAlt: "Diagrama con las partes principales de una guitarra"
          },
          "slide-03": {
            title: "La cabeza o pala",
            blocks: [
              "La cabeza, también llamada pala, está en el extremo superior de la guitarra. Allí se encuentran las clavijas, que sirven para ajustar la tensión de las cuerdas y afinar el instrumento.",
              "Su diseño depende del modelo: algunas guitarras tienen tres clavijas a cada lado, mientras que otras las colocan en una sola línea. La forma de la pala también puede variar."
            ],
            imageAlt: "Detalle de la cabeza o pala de la guitarra"
          },
          "slide-04": {
            title: "Clavijero, clavijas y cejuela",
            blocks: [
              { heading: "El clavijero", text: "Es el conjunto de mecanismos que sostiene las clavijas. Al girar una clavija, el mecanismo enrolla o libera un poco de cuerda y cambia su tensión, lo que permite afinarla." },
              { heading: "Las clavijas", text: "Son las piezas que giramos para afinar. Hazlo con movimientos pequeños: un cambio de tensión puede modificar bastante la nota." },
              { heading: "La cejuela", text: "Es una pieza pequeña situada entre la pala y el diapasón. Tiene ranuras que mantienen las cuerdas separadas y a la altura adecuada antes de que recorran el mástil." }
            ],
            imageAlt: "Detalle de las clavijas, el clavijero y la cejuela"
          },
          "slide-05": {
            title: "El mástil",
            blocks: [
              "El mástil es la parte larga y estrecha que conecta la cabeza con el cuerpo de la guitarra. Cuando tocamos acordes o notas, normalmente apoyamos la mano sobre esta zona.",
              { heading: "El diapasón", text: "Es la superficie delantera del mástil, la que queda debajo de las cuerdas. Allí presionamos una cuerda para cambiar la longitud que vibra y producir distintas notas." },
              { heading: "Marcas de posición", text: "Muchas guitarras tienen puntos en el diapasón o en el borde del mástil. Funcionan como referencias visuales para encontrar posiciones con más facilidad. Su ubicación puede variar según el instrumento." },
              { heading: "El alma", text: "Algunas guitarras, especialmente muchas acústicas y eléctricas, tienen una varilla interna llamada alma. Sirve para ajustar la curvatura del mástil. No es una pieza que un principiante deba ajustar sin orientación." }
            ],
            imageAlt: "Vista del mástil y el diapasón de una guitarra"
          },
          "slide-06": {
            title: "Los trastes",
            blocks: [
              "Los trastes son las barras metálicas finas que cruzan el diapasón, de forma perpendicular a las cuerdas.",
              "En el habla cotidiana también llamamos «traste» al espacio donde colocamos el dedo, entre dos barras. Para obtener una nota clara, normalmente presionamos la cuerda justo detrás de la barra del traste elegido, no encima de ella.",
              "Cada posición cambia la longitud vibrante de la cuerda y, por lo tanto, la nota que escuchamos. No necesitas aprender todas las notas ahora: primero, identifica las barras y los espacios."
            ],
            imageAlt: "Detalle de los trastes metálicos y los espacios del diapasón"
          },
          "slide-07": {
            title: "El cuerpo de la guitarra",
            blocks: [
              "El cuerpo es la parte más grande de la guitarra. En una guitarra clásica o acústica, la caja ayuda a proyectar el sonido y está formada por una tapa, un fondo y unos laterales llamados aros.",
              "En una guitarra acústica, las vibraciones de las cuerdas se transmiten al cuerpo y contribuyen al sonido que escuchamos. En una eléctrica de cuerpo sólido, el sonido se capta principalmente con pastillas electrónicas, por lo que su construcción es diferente.",
              "Aunque los materiales y las formas cambien según el modelo, el cuerpo también es una referencia importante para ubicar otras piezas, como el puente."
            ],
            imageAlt: "Vista del cuerpo de una guitarra"
          },
          "slide-08": {
            title: "Puente y golpeador",
            blocks: [
              { heading: "El puente", text: "Está ubicado en el cuerpo, debajo de las cuerdas. Sujeta las cuerdas y transmite parte de sus vibraciones al instrumento. Su diseño cambia entre guitarras clásicas, acústicas y eléctricas." },
              { heading: "El golpeador", text: "Es una lámina protectora que aparece en muchos modelos. Ayuda a evitar rayones en la superficie cuando rozamos la guitarra con la púa o con los dedos al tocar." }
            ],
            imageAlt: "Zona del puente y posible ubicación del golpeador"
          },
          "slide-09": {
            title: "Las seis cuerdas",
            blocks: [
              "Las cuerdas son las que hacemos vibrar para producir las notas. En una guitarra común hay seis y se numeran desde la más fina hasta la más gruesa: la primera es la más fina y la sexta, la más gruesa.",
              { heading: "Afinación habitual", text: "En la afinación estándar, de la sexta cuerda a la primera, las notas son Mi, La, Re, Sol, Si y Mi. La sexta suena más grave y la primera más aguda." },
              { heading: "¿De qué material son?", text: "Depende del tipo de guitarra. Las guitarras clásicas suelen usar cuerdas de nailon en las tres primeras y cuerdas entorchadas en las más graves. Las acústicas y eléctricas suelen usar cuerdas metálicas, con materiales y recubrimientos que varían según el juego." },
              "Por ahora, quédate con esta idea: primera significa cuerda más fina; sexta significa cuerda más gruesa. Más adelante practicaremos sus nombres y su afinación."
            ],
            imageAlt: "Detalle de las seis cuerdas de la guitarra"
          },
          "slide-10": {
            title: "¡A reconocer las partes!",
            description: "Lee cada pista y elige la parte de la guitarra que cumple esa función.",
            questions: {
              q1: {
                prompt: "¿Qué pieza giras para cambiar la tensión de una cuerda y afinarla?",
                options: { a: "El puente", b: "La clavija", c: "El golpeador" },
                feedbackCorrect: "¡Correcto! La clavija permite ajustar la tensión de la cuerda para afinarla.",
                feedbackIncorrect: "Prueba otra vez. Busca la pieza que está en la cabeza de la guitarra y que puedes girar."
              },
              q2: {
                prompt: "¿Cómo se llama la superficie delantera del mástil donde presionamos las cuerdas?",
                options: { a: "El diapasón", b: "La caja", c: "La pala" },
                feedbackCorrect: "¡Exacto! El diapasón es la superficie donde colocamos los dedos para tocar distintas notas.",
                feedbackIncorrect: "Pista: está sobre el mástil, justo debajo de las cuerdas."
              },
              q3: {
                prompt: "¿Qué parte ayuda a sujetar las cuerdas en el cuerpo de la guitarra?",
                options: { a: "La cejuela", b: "El clavijero", c: "El puente" },
                feedbackCorrect: "¡Bien! El puente sujeta las cuerdas en el cuerpo y transmite parte de sus vibraciones.",
                feedbackIncorrect: "Pista: está en el cuerpo de la guitarra, no en la cabeza."
              }
            }
          }
        }
      }
    },
    folders_page: {
      scopes: {
        mine: "Mis carpetas",
        public: "Carpetas públicas",
        shared: "Compartidas conmigo"
      },
      categories: {
        all: "Todos los archivos",
        documents: "Documentos",
        images: "Imágenes",
        audio: "Audio",
        video: "Videos",
        other: "Otros"
      },
      library_heading: "Biblioteca",
      file_type_heading: "Tipo de archivo",
      storage: {
        used: "Almacenamiento usado",
        no_quota: "Sin cuota configurada"
      },
      breadcrumbs: {
        folders: "Carpetas"
      },
      header: {
        folder_desc: "Archivos organizados en esta carpeta.",
        main_desc: "Tu espacio personal para guardar y organizar archivos."
      },
      actions: {
        new_folder: "＋ Nueva carpeta",
        upload_files: "↑ Subir archivos"
      },
      search: {
        folder_placeholder: "Buscar archivos en esta carpeta",
        main_placeholder: "Buscar carpetas",
        clear_aria: "Limpiar búsqueda"
      },
      meta: {
        public: "Pública",
        private: "Privada",
        owner: "Propietario",
        rename: "Renombrar",
        make_private: "Hacer privada",
        make_public: "Hacer pública",
        share: "Compartir",
        revoke: "Revocar acceso",
        delete_folder: "Eliminar carpeta"
      },
      toolbar: {
        file_singular: "archivo",
        file_plural: "archivos",
        sort_label: "Ordenar por",
        sort_name: "Nombre",
        sort_size: "Tamaño"
      },
      dropzone: {
        text_prefix: "Arrastrá archivos acá o",
        select_btn: "seleccionalos",
        limit: "Máximo 50 MB por archivo."
      },
      upload: {
        uploading_status: "Subiendo",
        ready_status: "Listo",
        cancelled_status: "Cancelada",
        error_status: "Error",
        cancel_btn: "Cancelar"
      },
      states: {
        retry: "Reintentar",
        loading: "Cargando contenido…"
      },
      empty: {
        no_folders_query: "No encontramos carpetas",
        no_folders: "Todavía no hay carpetas",
        try_other: "Probá con otro nombre.",
        create_prompt: "Creá una carpeta para empezar a organizar tus archivos.",
        no_files_query: "No encontramos archivos",
        folder_empty: "La carpeta está vacía",
        upload_prompt: "Subí archivos para tenerlos disponibles acá.",
        no_access: "No hay archivos disponibles en esta carpeta."
      },
      folder_card: {
        your_folder: "Tu carpeta",
        shared: "Compartida"
      },
      file_list: {
        name: "Nombre",
        type: "Tipo",
        size: "Tamaño",
        actions: "Acciones",
        open: "Abrir",
        download: "Descargar",
        delete: "Eliminar"
      },
      pagination: {
        prev: "Anterior",
        next: "Siguiente",
        pages: "Página {current} de {total}"
      },
      dialog: {
        create_title: "Crear carpeta",
        rename_title: "Renombrar carpeta",
        unshare_title: "Revocar acceso",
        share_title: "Compartir carpeta",
        username_label: "Nombre de usuario",
        name_label: "Nombre",
        username_placeholder: "usuario",
        name_placeholder: "Por ejemplo, Mis partituras",
        share_desc: "La persona podrá ver y descargar archivos, pero no modificarlos.",
        cancel_btn: "Cancelar",
        share_btn: "Compartir",
        revoke_btn: "Revocar",
        save_btn: "Guardar"
      },
      toasts: {
        folder_created: "Carpeta creada.",
        folder_renamed: "Carpeta renombrada.",
        folder_shared: "Acceso de solo lectura compartido.",
        folder_unshared: "Se revocó el acceso compartido.",
        made_private: "La carpeta ahora es privada.",
        made_public: "La carpeta ahora es pública.",
        folder_deleted: "Carpeta eliminada.",
        upload_complete: "{name}: carga completada.",
        file_deleted: "Archivo eliminado."
      },
      confirm: {
        delete_folder: "¿Eliminar \"{name}\" y todos sus archivos? Esta acción no se puede deshacer.",
        delete_file: "¿Eliminar \"{name}\"?"
      },
      aria: {
        filters: "Filtros de carpetas",
        pagination: "Paginación"
      },
      errors: {
        load_failed: "No se pudo cargar el contenido."
      }
    }
  },
  "en-US": {
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
      },
      users_section: {
        filters: {
          all: "All roles",
          users: "Users",
          admins: "Administrators",
          mods: "Moderators"
        }
      },
      modal: {
        cancel: "Cancel",
        confirm: "Confirm deletion"
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
    },
    courses_page: {
      title: "My Courses",
      subtitle: "Continue learning where you left off.",
      explore_catalog: "Explore catalog",
      retry: "Retry",
      empty: {
        title: "You are not enrolled in any courses yet",
        desc: "When you enroll in a course, it will appear here."
      },
      errors: {
        load_failed: "We couldn't load your courses."
      }
    },
    catalog_page: {
      title: "Course Catalog",
      subtitle: "Explore available courses to learn from.",
      my_courses_btn: "My Courses",
      messages: {
        registered_success: "You are now enrolled in the course. You will find it in My Courses.",
        already_registered: "You were already enrolled in this course."
      },
      empty: {
        title: "No courses available",
        desc: "When courses are added, they will appear in this catalog."
      },
      errors: {
        load_failed: "Could not load the catalog. Please try again.",
        register_failed: "Could not complete enrollment."
      }
    },
    lesson_map_page: {
      back_to_courses: "Back to my courses",
      map_aria: "Lessons path",
      course_fallback: "Course",
      lesson_fallback: "Lesson",
      lesson_upcoming: "The content for this lesson will be available soon.",
      lesson_type: "Lesson",
      loading_progress: "Loading course progress...",
      all_completed: "You have completed all lessons in this course.",
      errors: {
        invalid_course: "The requested course is not valid.",
        invalid_progress_response: "The server's progress response is not valid.",
        not_enrolled: "You are not enrolled in this course.",
        invalid_progress_data: "The course progress data is not valid.",
        load_progress_failed: "Could not load course progress.",
        progress_changed: "Course progress changed. Return to the course and refresh the map.",
        invalid_update_response: "The progress update response is not valid.",
        save_progress_failed: "Could not save progress. Please try again.",
        lesson_not_available: "The content for this lesson is not yet available."
      }
    },
    exercises_page: {
      title: "Musical Exercises",
      subtitle: "Choose an exercise type and start practicing.",
      filter_title: "Filter by type",
      all_types: "All",
      all_exercises: "All exercises",
      exercises_of: "{type} exercises",
      coming_soon: "Coming soon",
      start_link: "Start →",
      stats: {
        available_singular: "available",
        available_plural: "available"
      },
      empty: {
        title: "No exercises for now",
        desc: "Try another category or check back later when we add new exercises.",
        reset_btn: "View all exercises"
      }
    },
    messages_page: {
      friendship_subtitle: "Knowbeat Friendship",
      view_profile: "View profile",
      close_alert: "Close alert",
      loading_older: "Loading older messages...",
      composer_placeholder: "Message {username}...",
      days: {
        today: "Today",
        yesterday: "Yesterday"
      },
      empty_chats: {
        title: "You don't have any conversations yet",
        desc: "When you add friends, you'll be able to chat with them from here. Find people in the community.",
        btn: "Go to community"
      },
      empty_conversation: {
        title: "Start chatting with {username}",
        desc: "A quick greeting to break the ice:"
      },
      errors: {
        load_chats_failed: "Could not load conversations.",
        load_messages_failed: "Could not load messages.",
        load_more_failed: "Could not load more messages.",
        send_failed: "Could not send the message. Please try again."
      }
    },
    profile_page: {
      loading: "Loading profile...",
      header_aria: "Profile information",
      courses_aria: "Profile courses",
      courses_title: "Courses in progress",
      friends: {
        delete: "Remove friend",
        cancel_request: "Cancel request",
        add: "Add friend",
        send_message: "Send message",
        status_friends: "Friends · Remove",
        status_pending: "Request sent · Cancel"
      },
      requests: {
        accept_aria: "Accept request",
        accept_title: "Accept",
        reject_aria: "Reject request",
        reject_title: "Reject",
        loading: "Loading...",
        empty: "No pending requests"
      },
      modal: {
        close_aria: "Close window",
        edit_title: "Edit profile",
        requests_title: "Friend requests"
      },
      streak: {
        aria: "Learning streak",
        loading: "Loading streak...",
        day: "day",
        days: "days",
        positive: "· Keep it up",
        zero: "· practice today to start"
      },
      bio: {
        add_prompt: "+ Add a biography so the community can get to know you",
        empty_other: "This musician hasn't written their biography yet."
      },
      actions: {
        edit: "Edit profile",
        requests: "Requests"
      },
      stats: {
        aria: "Statistics",
        total_score: "total score",
        course_singular: "course in progress",
        course_plural: "courses in progress",
        lesson_singular: "completed lesson",
        lesson_plural: "completed lessons"
      },
      form: {
        username: "Username",
        email: "Email",
        biography: "Biography",
        bio_placeholder: "Tell the community who you are",
        password: "New password",
        optional: "optional",
        saving: "Saving...",
        save_btn: "Save changes"
      },
      private: {
        title: "Progress is private",
        desc: "This user chose to keep their courses off their public profile."
      },
      empty_courses: {
        title: "No courses in progress yet",
        owner_desc: "Choose your first course and start learning today.",
        other_desc: "When they enroll in a course, it will appear here.",
        explore_btn: "Explore courses"
      },
      toast: {
        goal_updated: "Daily goal updated.",
        profile_updated: "Profile updated."
      },
      errors: {
        friend_action_failed: "Could not complete friend action.",
        streak_unavailable: "Streak unavailable",
        not_found: "User not found.",
        load_failed: "Could not load profile.",
        goal_invalid: "The daily goal must be an integer between 1 and 5000.",
        goal_update_failed: "Could not update the daily goal.",
        profile_save_failed: "Could not save profile."
      }
    },
    daily_score: {
      goal_label: "Daily goal",
      goal_placeholder: "Points",
      goal_aria: "Daily score goal",
      saving: "Saving...",
      save_btn: "Save",
      section_aria: "Daily goal and score history",
      eyebrow: "Score history",
      title: "Activity from the last 7 days",
      loading: "Loading activity...",
      chart_aria: "Daily activity chart",
      points_unit: "points"
    },
    message_input: {
      default_placeholder: "Type a message...",
      aria_label: "Type a message",
      send_aria: "Send message"
    },
    course_card: {
      lesson_singular: "lesson",
      lesson_plural: "lessons",
      lessons_count_label: "lessons",
      remaining_label: "remaining",
      progress_aria: "{name} progress",
      continue_btn: "Continue",
      status: {
        completed: "Completed",
        in_progress: "In progress"
      },
      catalog: {
        already_enrolled: "You are already enrolled",
        available: "Available",
        coming_soon_title: "Available soon",
        view_content: "View content",
        enrolled_badge: "Enrolled",
        registering: "Enrolling...",
        register_btn: "Enroll"
      }
    },
    lesson_completion: {
      eyebrow: "LESSON COMPLETED",
      passed_title: "Great job!",
      failed_title: "Keep practicing",
      correct_answers: "Correct answers:",
      of: "of",
      replay_message: "You finished the practice. Your course progress remains unchanged.",
      passed_message: "You passed this lesson and your progress has been saved.",
      fail_message: "You finished the lesson, but you didn't reach the requirement to pass.",
      retry_btn: "Retry lesson",
      return_btn: "Return to course"
    },
    lesson_player: {
      exit_aria: "Exit lesson",
      exit_btn: "Exit",
      progress_aria: "Lesson progress",
      lesson_label: "Lesson",
      prev_btn: "Previous",
      next_btn: "Next",
      finish_btn: "Finish lesson",
      saving: "Saving...",
      retry_save: "Retry save",
      registered_answers: "Registered answers: {count}.",
      errors: {
        save_failed: "Could not save progress. Please try again."
      }
    },
    exercise_slide: {
      check_btn: "Check answer"
    },
    sidebar: {
      nav: {
        label: "Main Menu",
        learn: "Learn",
        community: "Community",
        exercises: "Exercises",
        folders: "Folders",
        messages: "Messages"
      },
      profile: {
        fallback: "Profile"
      },
      aria: {
        close_menu: "Close menu",
        open_menu: "Open menu",
        sidebar_label: "Main sidebar",
        expand_menu: "Expand sidebar menu",
        collapse_menu: "Minimize sidebar menu",
        go_home: "Go home",
        main_menu: "Main menu",
        profile_of: "Go to {username}'s profile",
        profile: "Go to profile",
        settings: "Settings"
      },
      titles: {
        expand: "Expand menu",
        collapse: "Minimize menu",
        profile_of: "{username}'s profile",
        profile: "Profile",
        settings: "Settings"
      }
    },
    lessons: {
      "guitar-intro-parts-001": {
        title: "Introduction to the guitar: its parts",
        description: "Learn about the main parts of the guitar and discover what each one does.",
        slides: {
          "slide-01": {
            title: "Getting to know the guitar",
            blocks: [
              "The guitar is a string instrument present in many musical styles. It can accompany a song with chords, play melodies, or carry solos.",
              "There are different types, such as classical, acoustic, and electric guitars. Their shape and some components change, but they share several parts and operating principles.",
              "In this lesson we will learn the main parts. You don't need to memorize them all at once: for now, try to connect each name with its corresponding piece."
            ],
            imageAlt: "Overview of a guitar with its main parts"
          },
          "slide-02": {
            title: "What is it made of?",
            blocks: [
              "The guitar is made of several pieces that work together so we can play and produce sound.",
              "Some hold and tune the strings; others let us choose notes; and others help transmit or project vibrations. Let's get to know them one by one."
            ],
            imageAlt: "Diagram with the main parts of a guitar"
          },
          "slide-03": {
            title: "The headstock",
            blocks: [
              "The headstock is at the upper end of the guitar. This is where the tuning pegs are located, which are used to adjust string tension and tune the instrument.",
              "Its design depends on the model: some guitars have three pegs on each side, while others place them in a single line. The shape of the headstock can also vary."
            ],
            imageAlt: "Detail of the guitar headstock"
          },
          "slide-04": {
            title: "Tuning pegs, machine heads, and nut",
            blocks: [
              { heading: "The machine head", text: "It is the set of mechanisms holding the pegs. Turning a peg winds or unwinds a bit of string, changing its tension to tune it." },
              { heading: "The pegs", text: "They are the pieces we turn to tune. Do it with small movements: a tension change can alter the note quite a bit." },
              { heading: "The nut", text: "It is a small piece located between the headstock and the fretboard. It has slots that keep the strings separated and at the proper height before they run down the neck." }
            ],
            imageAlt: "Detail of pegs, machine heads, and nut"
          },
          "slide-05": {
            title: "The neck",
            blocks: [
              "The neck is the long, narrow part connecting the headstock to the guitar body. When we play chords or notes, we normally rest our hand on this area.",
              { heading: "The fretboard", text: "It is the front surface of the neck, sitting right under the strings. We press a string here to change the vibrating length and produce different notes." },
              { heading: "Position markers", text: "Many guitars have dots on the fretboard or edge of the neck. They serve as visual references to find positions more easily. Their location can vary by instrument." },
              { heading: "The truss rod", text: "Some guitars, especially acoustics and electrics, have an internal rod called a truss rod. It adjusts neck curvature. It's not something a beginner should adjust without guidance." }
            ],
            imageAlt: "View of the guitar neck and fretboard"
          },
          "slide-06": {
            title: "The frets",
            blocks: [
              "The frets are the thin metal bars crossing the fretboard perpendicularly to the strings.",
              "In everyday speech, we also call the space between two bars a 'fret'. To get a clear note, we normally press the string right behind the chosen fret bar, not on top of it.",
              "Each position changes the vibrating length of the string and therefore the note we hear. You don't need to learn all notes now: first, identify the bars and spaces."
            ],
            imageAlt: "Detail of metal frets and fretboard spaces"
          },
          "slide-07": {
            title: "The guitar body",
            blocks: [
              "The body is the largest part of the guitar. In a classical or acoustic guitar, the soundboard helps project sound and consists of a top, back, and sides called ribs.",
              "In an acoustic guitar, string vibrations transmit to the body, contributing to the sound we hear. In a solid-body electric, sound is captured primarily by electronic pickups, so its construction is different.",
              "Although materials and shapes change by model, the body is also an important reference for locating other parts, like the bridge."
            ],
            imageAlt: "View of the guitar body"
          },
          "slide-08": {
            title: "Bridge and pickguard",
            blocks: [
              { heading: "The bridge", text: "Located on the body beneath the strings. It holds the strings and transmits part of their vibrations to the instrument. Its design changes between classical, acoustic, and electric guitars." },
              { heading: "The pickguard", text: "It is a protective sheet found on many models. It helps prevent scratches on the surface when brushing the guitar with a pick or fingers while playing." }
            ],
            imageAlt: "Bridge area and pickguard location"
          },
          "slide-09": {
            title: "The six strings",
            blocks: [
              "The strings are what we vibrate to produce notes. A standard guitar has six, numbered from thinnest to thickest: the first is the thinnest and the sixth is the thickest.",
              { heading: "Standard tuning", text: "In standard tuning, from the sixth string to the first, the notes are E, A, D, G, B, and E. The sixth sounds lowest and the first highest." },
              { heading: "What material are they made of?", text: "It depends on the guitar type. Classical guitars usually use nylon strings for the top three and wound strings for the lower ones. Acoustics and electrics typically use steel strings, with materials and coatings varying by set." },
              "For now, keep this idea in mind: first means thinnest string; sixth means thickest string. Later we will practice their names and tuning."
            ],
            imageAlt: "Detail of the six guitar strings"
          },
          "slide-10": {
            title: "Recognizing the parts!",
            description: "Read each clue and choose the guitar part that performs that function.",
            questions: {
              q1: {
                prompt: "Which piece do you turn to change a string's tension and tune it?",
                options: { a: "The bridge", b: "The tuning peg", c: "The pickguard" },
                feedbackCorrect: "Correct! The tuning peg adjusts string tension to tune it.",
                feedbackIncorrect: "Try again. Look for the piece on the guitar headstock that you can turn."
              },
              q2: {
                prompt: "What is the front surface of the neck where we press the strings called?",
                options: { a: "The fretboard", b: "The body", c: "The headstock" },
                feedbackCorrect: "Exact! The fretboard is the surface where we place fingers to play different notes.",
                feedbackIncorrect: "Hint: it's on the neck, right below the strings."
              },
              q3: {
                prompt: "What part helps hold the strings on the guitar body?",
                options: { a: "The nut", b: "The machine head", c: "The bridge" },
                feedbackCorrect: "Good! The bridge holds the strings on the body and transmits part of their vibrations.",
                feedbackIncorrect: "Hint: it's on the guitar body, not the headstock."
              }
            }
          }
        }
      }
    },
    folders_page: {
      scopes: {
        mine: "My folders",
        public: "Public folders",
        shared: "Shared with me"
      },
      categories: {
        all: "All files",
        documents: "Documents",
        images: "Images",
        audio: "Audio",
        video: "Videos",
        other: "Others"
      },
      library_heading: "Library",
      file_type_heading: "File type",
      storage: {
        used: "Storage used",
        no_quota: "No quota configured"
      },
      breadcrumbs: {
        folders: "Folders"
      },
      header: {
        folder_desc: "Files organized in this folder.",
        main_desc: "Your personal space to store and organize files."
      },
      actions: {
        new_folder: "＋ New folder",
        upload_files: "↑ Upload files"
      },
      search: {
        folder_placeholder: "Search files in this folder",
        main_placeholder: "Search folders",
        clear_aria: "Clear search"
      },
      meta: {
        public: "Public",
        private: "Private",
        owner: "Owner",
        rename: "Rename",
        make_private: "Make private",
        make_public: "Make public",
        share: "Share",
        revoke: "Revoke access",
        delete_folder: "Delete folder"
      },
      toolbar: {
        file_singular: "file",
        file_plural: "files",
        sort_label: "Sort by",
        sort_name: "Name",
        sort_size: "Size"
      },
      dropzone: {
        text_prefix: "Drag files here or",
        select_btn: "select them",
        limit: "Maximum 50 MB per file."
      },
      upload: {
        uploading_status: "Uploading",
        ready_status: "Ready",
        cancelled_status: "Cancelled",
        error_status: "Error",
        cancel_btn: "Cancel"
      },
      states: {
        retry: "Retry",
        loading: "Loading content..."
      },
      empty: {
        no_folders_query: "No folders found",
        no_folders: "No folders yet",
        try_other: "Try a different name.",
        create_prompt: "Create a folder to start organizing your files.",
        no_files_query: "No files found",
        folder_empty: "Folder is empty",
        upload_prompt: "Upload files to have them available here.",
        no_access: "No files available in this folder."
      },
      folder_card: {
        your_folder: "Your folder",
        shared: "Shared"
      },
      file_list: {
        name: "Name",
        type: "Type",
        size: "Size",
        actions: "Actions",
        open: "Open",
        download: "Download",
        delete: "Delete"
      },
      pagination: {
        prev: "Previous",
        next: "Next",
        pages: "Page {current} of {total}"
      },
      dialog: {
        create_title: "Create folder",
        rename_title: "Rename folder",
        unshare_title: "Revoke access",
        share_title: "Share folder",
        username_label: "Username",
        name_label: "Name",
        username_placeholder: "username",
        name_placeholder: "For example, My sheet music",
        share_desc: "The person will be able to view and download files, but not modify them.",
        cancel_btn: "Cancel",
        share_btn: "Share",
        revoke_btn: "Revoke",
        save_btn: "Save"
      },
      toasts: {
        folder_created: "Folder created.",
        folder_renamed: "Folder renamed.",
        folder_shared: "Read-only access shared.",
        folder_unshared: "Shared access revoked.",
        made_private: "Folder is now private.",
        made_public: "Folder is now public.",
        folder_deleted: "Folder deleted.",
        upload_complete: "{name}: upload complete.",
        file_deleted: "File deleted."
      },
      confirm: {
        delete_folder: "Delete \"{name}\" and all its files? This action cannot be undone.",
        delete_file: "Delete \"{name}\"?"
      },
      aria: {
        filters: "Folder filters",
        pagination: "Pagination"
      },
      errors: {
        load_failed: "Could not load content."
      }
    }
  }
};