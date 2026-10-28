# Liberture × ChatGPT: pruebas tras la actualización
Fecha: 9 de octubre de 2026. Zona: America/Buenos_Aires.

## Resultado
Se volvieron a probar las 12 funciones habilitadas de la conexión. El borrado no se intentó: get_today indica expresamente que delete_habits y delete_items están desactivados.

| Función | Resultado observado |
| --- | --- |
| get_today | Devuelve fecha local, hábitos pendientes, horarios, rachas y permisos desactivados. |
| list_habits | Devuelve hábitos, descripciones, frecuencia, horarios, rachas y tasas de cumplimiento. |
| get_stats | Devuelve cumplimiento diario/semanal, mejor racha y serie de 30 días. |
| get_recommendations | Respuesta válida, sin recomendaciones: hasRun=false. No demuestra generación del coach. |
| search_catalog | Devuelve protocolos, hábitos asociados, adopted e infoUrl. |
| create_habit | Creó un hábito de prueba para lunes/viernes a las 18:15. |
| update_habit | Renombró, cambió descripción, días laborables y hora; luego convirtió a 2 veces por semana y quitó el recordatorio. |
| log_habit | Marcó/desmarcó hoy y ayer. Resolución por nombre e ID funcionó. Repetir desmarcado devolvió noChange=true. |
| add_todo | Creó tarea con fecha, hora y prioridad. |
| list_todos | Mostró las tareas y confirmó el estado final. |
| set_todo_status | in_progress y completed funcionaron; incomplete falló con INVALID_ARGUMENT. |
| adopt_habit | Sobre deep-work-blocks ya adoptado: alreadyTracked=true, added=[]. No duplicó hábitos. No se probó adoptar un protocolo nuevo. |

Catálogo usado: [Deep Work Blocks](https://liberture.com/protocols/deep-work-blocks).
La lectura posterior confirmó la frecuencia final del hábito y la tarea completada. Se deshicieron las completaciones de prueba de hoy y ayer.

## Fallos reproducibles
1. **Reabrir una tarea:** set_todo_status con status="incomplete" e ID válido devolvió error_code="INVALID_ARGUMENT". El esquema anuncia ese valor y add_todo lo usa como estado inicial. Revisar validación y transición de estado. La tarea terminó completada.
2. **Hábito inexistente:** log_habit con habit="PRUEBA_INEXISTENTE_990044" y completed=false devolvió INVALID_ARGUMENT. La descripción de la herramienta contempla 404 para hábito inexistente. La respuesta obtenida no aporta opciones ni explicación útil.
3. **Estadísticas a revisar:** antes de crear el nuevo hábito, list_habits devolvió 10 hábitos con archived=false, get_today mostró 10 y get_stats informó totalHabits=10 pero activeHabits=9. Puede haber una definición diferente para objetivos semanales; hace falta documentar y contrastar el cálculo. No se afirma que el porcentaje sea erróneo.

## Consultas programadas
Se encontró y reutilizó la automatización existente **Probar consulta a Liberture**, evitando crear otra.
- Actualización confirmada: success=true.
- Ejecución única guardada: **9 de octubre, 14:55:06 de Buenos Aires**.
- Instrucción: consultar get_today, list_habits y get_stats, informar si el acceso desde esa ejecución funcionó, resumir pendientes y progreso, excluir nombres que empiezan por Prueba y no modificar datos.
- **Pendiente:** ejecución efectiva, acceso al conector durante esa ejecución y entrega de notificación. Guardar una programación no demuestra esos tres puntos.
- Ya existe **Revisar hábitos de Liberture**, habilitada diariamente alrededor de las 19:00 (horario flexible). No se creó un duplicado. Su prompt anterior excluye específicamente el primer hábito de prueba; conviene extenderlo a todos los datos de prueba.
- La conexión expuesta no ofrece una función propia de programación ni una fuente de eventos de Liberture. La prueba usa las automatizaciones de ChatGPT.
- Las automatizaciones consultadas no muestran aún last_run_time para estas dos tareas.

## Lo que falta o sería útil incorporar
Estas son capacidades no expuestas por las herramientas disponibles, no afirmaciones sobre toda la plataforma:
- Archivar hábitos y excluir datos de prueba de estadísticas.
- Reabrir tareas de forma funcional; editar título, vencimiento y prioridad de tareas.
- Registrar cantidades, duración y notas de una sesión: log_habit solo expone completado/no completado.
- Consultar completaciones individuales en un rango arbitrario; hoy se exponen últimas fechas, tasas y agregado de 30 días.
- Ejecutar o regenerar el coach: get_recommendations solo lee su última salida.
- Eventos/webhooks de completación, vencimiento o cambio de racha.
- Gestión de canales y estado de entrega de recordatorios; guardar un horario no prueba recepción de una notificación.
- Operaciones por lotes y respuestas de error específicas, con información suficiente para resolver ambigüedades.
- Definiciones claras de activeHabits, cumplimiento de objetivos semanales y denominadores de tasas.

## Datos de prueba que permanecen
- Nuevo hábito: **Prueba actualización ChatGPT — verificada**, 2 veces por semana, sin recordatorio, sin completaciones.
- Nueva tarea: **Prueba actualización ChatGPT 09-10**, completada, vence el 9 de octubre a las 18:15, prioridad 1.
- Permanecen también el hábito y tarea de la prueba anterior.
El borrado está desactivado; estos registros no se eliminaron.

## Criterio para dar por aprobada la integración programada
La ejecución futura debe obtener datos nuevos de Liberture, reconocer la fecha local, informar pendientes reales sin datos de prueba y entregar el mensaje sin modificar hábitos. Hasta ver ese resultado, la integración programada está configurada pero no validada de extremo a extremo.

