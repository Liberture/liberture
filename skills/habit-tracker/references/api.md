# Habit Tracker v1 API

Base URL: `HABIT_TRACKER_URL` (e.g., `https://your-app.vercel.app`)
Auth: `Authorization: Bearer <hti_token>`

## Endpoints

### GET /api/v1/habits

Returns all active habits with computed stats.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Morning Run",
    "color": "#8B5CF6",
    "schedule": { "type": "daily" },
    "timeOfDay": "morning",
    "category": "exercise",
    "tags": ["exercise"],
    "currentStreak": 5,
    "longestStreak": 12,
    "completionRate7d": 0.86,
    "completionRate30d": 0.73,
    "completedToday": false,
    "lastCompletedAt": "2026-02-25"
  }
]
```

### GET /api/v1/stats

Returns overall statistics for the last 30 days.

**Response:**
```json
{
  "totalHabits": 8,
  "activeHabits": 6,
  "totalCompletions": 142,
  "completionRateToday": 0.75,
  "completionRate7d": 0.68,
  "bestCurrentStreak": 14,
  "bestHabitName": "Morning Run",
  "totalStreakDays": 89,
  "completionsByDay": [
    { "date": "2026-01-28", "count": 5 },
    { "date": "2026-01-29", "count": 3 }
  ]
}
```

### GET /api/v1/completions?days=30

Returns recent completions with habit name. `days` max: 365.

**Response:**
```json
[
  {
    "habitId": "uuid",
    "habitName": "Morning Run",
    "date": "2026-02-25",
    "completedAt": "2026-02-25T08:30:00.000Z"
  }
]
```

### POST /api/v1/completions

Log a habit completion.

**Body:**
```json
{ "habitId": "uuid", "date": "2026-02-26" }
```
`date` is optional — defaults to today (UTC).

**Response:**
```json
{ "success": true, "alreadyCompleted": false, "currentStreak": 6 }
```

### GET /api/v1/auth/token

Check integration token status (use `ht_` API key, not integration token).

**Response:**
```json
{ "hasToken": true, "prefix": "hti_a1b2c3d4e5f6..." }
```

## Error Codes

| Status | Meaning |
|--------|---------|
| 401 | Invalid or missing token |
| 404 | Habit not found |
| 409 | Token already exists (revoke first) |
| 500 | Server error (check DB connection) |

## Notes

- No rate limits currently
- All dates in `YYYY-MM-DD` format
- All timestamps in ISO 8601 UTC
- Completions are stored in JSONB alongside all habit data
