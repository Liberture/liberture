# Liberture — validación MCP

Fecha local: 9 de octubre de 2026, 21:12–21:15, America/Argentina/Buenos_Aires.
Servidor: 39 herramientas, versión f3f3ff24. 35 ejecutadas; 4 excluidas por permisos. Esto es una prueba funcional de integración, no una certificación exhaustiva de todos los parámetros ni de entrega de notificaciones.

## Cobertura por herramienta

| Herramienta | Resultado |
|---|---|
| `add_todo` | Ejecutada con respuesta válida; ver límites de cobertura |
| `adopt_habit` | Adopción funciona; fecha inicial usa día UTC |
| `archive_habit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `create_event` | Ejecutada con respuesta válida; ver límites de cobertura |
| `create_habit` | Creación funciona; fecha inicial usa día UTC |
| `create_project` | Ejecutada con respuesta válida; ver límites de cobertura |
| `delete_event` | No ejecutada: permiso de eliminación deshabilitado |
| `delete_habit` | No ejecutada: permiso de eliminación deshabilitado |
| `delete_project` | No ejecutada: permiso de eliminación deshabilitado |
| `delete_todo` | No ejecutada: permiso de eliminación deshabilitado |
| `export_data` | Respuesta estructurada OK; integridad/restauración no probadas |
| `get_agenda` | Funciona con start explícito; día por defecto observado en UTC |
| `get_audit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_coach_state` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_habit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_habit_history` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_permissions` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_profile` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_recommendations` | Consulta OK; no hay recomendaciones para validar contenido |
| `get_reminder_status` | Consulta OK; push no configurado, entrega no validada |
| `get_stats` | Ejecutada con respuesta válida; ver límites de cobertura |
| `get_today` | Ejecutada con respuesta válida; ver límites de cobertura |
| `list_events` | Ejecutada con respuesta válida; ver límites de cobertura |
| `list_habits` | Ejecutada con respuesta válida; ver límites de cobertura |
| `list_projects` | Ejecutada con respuesta válida; ver límites de cobertura |
| `list_todos` | Ejecutada con respuesta válida; ver límites de cobertura |
| `log_habit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `log_habit_value` | Ejecutada con respuesta válida; ver límites de cobertura |
| `record_coach_nudge` | Silencio/límite/duplicado afternoon OK; other admite duplicados |
| `respond_to_suggestion` | Solo rechazo sin sugerencias; aceptación/aplazamiento real pendientes |
| `schedule_todo` | Ejecutada con respuesta válida; ver límites de cobertura |
| `search_catalog` | Ejecutada con respuesta válida; ver límites de cobertura |
| `set_todo_status` | Ejecutada con respuesta válida; ver límites de cobertura |
| `unarchive_habit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `update_event` | Falla al mover sin duración; funciona con duración explícita |
| `update_habit` | Ejecutada con respuesta válida; ver límites de cobertura |
| `update_profile` | Cambios/restauración OK; cambio incidental de layout durante suite sin causa aislada |
| `update_project` | Ejecutada con respuesta válida; ver límites de cobertura |
| `update_todo` | Ejecutada con respuesta válida; ver límites de cobertura |

## Fallos reproducibles

### 1. update_event no conserva la duración al mover
Crear evento a 2026-10-10T10:00, durationMinutes=15. Devuelve inicio 13:00Z y fin 13:15Z. Mover con startsAt=2026-10-10T11:00 sin endsAt ni durationMinutes. Devuelve inicio 14:00Z y conserva fin 13:15Z: duración negativa. Mensaje: “11:00 to 10:15”. Enviar durationMinutes=15 corrige el fin a 14:15Z.
Esperado: conservar 15 minutos y rechazar cualquier intervalo con fin anterior al inicio.

### 2. Fecha inicial de hábitos usa el día UTC
Crear hábito y adoptar Meditation alrededor de 2026-10-09 21:13 Buenos Aires (2026-10-10 00:13Z). list_habits muestra startDate=2026-10-10. get_habit del hábito creado devuelve scheduledToday=false para 2026-10-09; get_today no lo incluye. get_habit además devuelve startDate=null mientras list_habits muestra fecha calculada.
Esperado: fecha inicial 2026-10-09 según la zona guardada, y representación consistente entre herramientas.

### 3. Agenda por defecto usa el día UTC
Consulta anterior get_agenda({days:7}) a 21:12 locales: start=2026-10-10T00:00:00.000Z. Con start=2026-10-09T00:00:00-03:00 devuelve correctamente 2026-10-09T03:00:00.000Z.
Esperado: día local por defecto y límites de consulta consistentes.

### 4. Descripción de deduplicación no coincide para kind=other
maxNudgesPerDay=1: other permitido una vez; siguientes llamadas rechazadas por daily_limit. Restaurar cupo a 3 y repetir other con otra descripción: allowed=true nuevamente en el mismo día. Para afternoon, con cupo suficiente, primera llamada allowed=true y segunda reason=duplicate.
Esperado: aclarar la excepción de other o aplicar el contrato anunciado “one-per-kind-per-day”. No implica que afternoon esté fallando.

## Observaciones de calidad

- get_audit: critical=[] y drift=false produce “Great job! You're staying disciplined” con 1/14 completados. Explicar que solo evalúa hábitos críticos configurados.
- list_todos marca tareas completadas como urgency=overdue cuando vencieron. Puede ser semántica intencional; aclarar o excluir completadas del concepto de urgencia.
- Perfil inicial habitsLayout=matrix; durante la suite apareció day sin que se enviara ese campo. Causa no aislada; podría ser un efecto de otra escritura o actividad concurrente. Restaurado a matrix; no clasificado como fallo reproducible de update_profile.
- get_reminder_status muestra sentToday pese a pushConfigured=false, devices=0, lastDeliveredAt=null. El contador no debe interpretarse como prueba de entrega.

## Pruebas positivas

- Hábito con meta 10 reps: 4 da goalReached=false; agregar 6 da totalData.value=10, goalReached=true y un día completado en historial.
- Desmarcar remueve el registro diario: get_habit devuelve recent=[] y totalCompletions=0. Esto también elimina cantidades/notas del registro; confirmar que sea el comportamiento deseado.
- Crear/editar proyecto, crear/editar tarea con subtareas, in_progress → completed → incomplete persistidos y verificados con list_todos.
- schedule_todo usa estimatedMinutes=20 y convierte correctamente las 12:00 locales a 15:00Z.
- create_event convierte correctamente la hora local; update_event con durationMinutes explícito válido.
- archive_habit/unarchive_habit funciona; estadísticas excluyen archivados y vuelven a totalHabits=14, totalCompletions=79.
- Catálogo y adopción de daily-mindfulness-meditation funcionan.
- Quiet hours bloquea nudge con reason=quiet_hours sin consumir cupo. Límite diario bloquea con daily_limit. afternoon duplicado bloquea con duplicate.
- Perfil guarda idioma, layout y configuración del coach. Configuración inicial restaurada (idioma en, layout matrix, silencio 22:00–08:00, máximo 3).
- Exportación devuelve hábitos, completions, todos, proyectos, calendarEvents, perfil, preferencias y metadatos. No se ensayó importación/restauración.
- Paginación de todos ejecutada. La segunda página se consultó después de crear una tarea, por lo que no sirve para garantizar paginación estable ante escrituras concurrentes.

## Límites de validación

- delete_habit/delete_todo/delete_project/delete_event: no ejecutadas porque delete_habits y delete_items están deshabilitados. No se modificaron esos permisos.
- respond_to_suggestion devuelve not_found explícito y claro: el coach no tiene sugerencias. Accept/dismiss/snooze sobre sugerencias reales pendientes.
- get_recommendations responde hasRun=false; contenido y ciclo completo del coach no validados.
- Push real, entrega de notificaciones de ChatGPT, execution logs de schedules y notificación con app cerrada siguen sin validación.
- No se verificaron todos los valores inválidos, paginación de cada recurso, matching ambiguo, concurrencia o todos los campos de cada herramienta.

## Estado final de datos de prueba

- Hábito “Prueba MCP integral 21:13 verificada” archivado y sin completados.
- Meditation adoptado para prueba y archivado.
- Proyecto “Prueba MCP integral 21:13 verificado” retenido.
- Tarea de prueba completada y sin vencimiento.
- Dos eventos de prueba movidos a 1 de octubre para retirarlos de la agenda futura, retenidos con nota de prueba finalizada.
- Tres registros técnicos de coach consumen el cupo de hoy; no prueban notificaciones entregadas. No existe herramienta expuesta para revertir esos registros. Mañana empieza un nuevo cupo.
- No se eliminaron objetos ni se editaron hábitos reales.

