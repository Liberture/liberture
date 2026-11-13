export const editorGroups = {
  people: {
    details: ["name", "title", "expertise", "pillars"],
    content: ["bio"],
    links: ["website", "wikipedia", "twitter", "instagram", "youtube", "podcast"],
  },
  organizations: {
    details: ["name", "type", "pillars", "founded", "keyPeople"],
    content: ["description"],
    links: ["website", "wikipedia", "imageUrl"],
  },
  books: {
    details: ["title", "author", "pillars", "year", "rating"],
    content: ["description"],
    links: ["imageUrl", "wikipedia", "amazonUrl", "goodreadsUrl"],
  },
  articles: {
    details: ["title", "author", "pillar", "tags", "readTime", "url"],
    content: ["description", "content"],
  },
  protocols: {
    details: ["name", "pillar", "creator", "duration", "difficulty"],
    content: ["description", "steps", "benefits", "risks", "equipment"],
  },
} as const

export type DirectoryType = keyof typeof editorGroups
export type EditorValues = Record<string, string>

export function isDirectoryType(value: string): value is DirectoryType {
  return Object.hasOwn(editorGroups, value)
}

export function editorValues(type: DirectoryType, record: Record<string, unknown>): EditorValues {
  const fields: string[] = Object.values(editorGroups[type]).flat()
  return Object.fromEntries(fields.map(field => [field, String(record[field] ?? "")]))
}

export const labels = {
  en: {
    details: "Details", content: "Content", links: "Links and media", history: "History",
    name: "Name", title: "Title", expertise: "Expertise", pillars: "Pillars (comma-separated)",
    bio: "Biography", website: "Website", wikipedia: "Wikipedia", twitter: "X / Twitter",
    instagram: "Instagram", youtube: "YouTube", podcast: "Podcast", type: "Organization type",
    founded: "Founded", keyPeople: "Key people", description: "Description", imageUrl: "Image URL",
    author: "Author", year: "Publication year", rating: "Rating", amazonUrl: "Amazon URL",
    goodreadsUrl: "Goodreads URL", pillar: "Pillar", tags: "Tags", readTime: "Reading time (minutes)",
    url: "Article URL", creator: "Creator", duration: "Duration", difficulty: "Difficulty",
    steps: "Steps", benefits: "Benefits", risks: "Risks", equipment: "Equipment",
    beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
    save: "Save changes", saving: "Saving…", back: "Back to directory", saved: "Changes saved.",
    saveError: "Couldn’t save your changes. Try again.", required: "Complete this field.", invalidNumber: "Enter a valid whole number.",
    historyError: "Couldn’t load edit history.", retry: "Try again", loading: "Loading history…",
    empty: "No edits have been recorded yet.", older: "Load older edits", before: "Before", after: "After",
    manual: "Manual edit", ai: "AI edit", system: "System edit", emptyValue: "Empty",
    people: "Edit person", organizations: "Edit organization", books: "Edit book",
    articles: "Edit article", protocols: "Edit protocol", markdown: "Article body (Markdown)",
  },
  es: {
    details: "Detalles", content: "Contenido", links: "Enlaces y medios", history: "Historial",
    name: "Nombre", title: "Título", expertise: "Especialidad", pillars: "Pilares (separados por comas)",
    bio: "Biografía", website: "Sitio web", wikipedia: "Wikipedia", twitter: "X / Twitter",
    instagram: "Instagram", youtube: "YouTube", podcast: "Pódcast", type: "Tipo de organización",
    founded: "Fundación", keyPeople: "Personas clave", description: "Descripción", imageUrl: "URL de la imagen",
    author: "Autor", year: "Año de publicación", rating: "Valoración", amazonUrl: "URL de Amazon",
    goodreadsUrl: "URL de Goodreads", pillar: "Pilar", tags: "Etiquetas", readTime: "Tiempo de lectura (minutos)",
    url: "URL del artículo", creator: "Creador", duration: "Duración", difficulty: "Dificultad",
    steps: "Pasos", benefits: "Beneficios", risks: "Riesgos", equipment: "Equipamiento",
    beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado",
    save: "Guardar cambios", saving: "Guardando…", back: "Volver al directorio", saved: "Cambios guardados.",
    saveError: "No se pudieron guardar los cambios. Volvé a intentarlo.", required: "Completá este campo.", invalidNumber: "Ingresá un número entero válido.",
    historyError: "No se pudo cargar el historial.", retry: "Volver a intentar", loading: "Cargando historial…",
    empty: "Todavía no hay ediciones registradas.", older: "Cargar ediciones anteriores", before: "Antes", after: "Después",
    manual: "Edición manual", ai: "Edición con IA", system: "Edición del sistema", emptyValue: "Vacío",
    people: "Editar persona", organizations: "Editar organización", books: "Editar libro",
    articles: "Editar artículo", protocols: "Editar protocolo", markdown: "Texto del artículo (Markdown)",
  },
}
export type EditorLabels = typeof labels.en
export function fieldLabel(t: EditorLabels, field: string) {
  return field === "content" ? t.markdown : t[field as keyof EditorLabels] ?? field
}
