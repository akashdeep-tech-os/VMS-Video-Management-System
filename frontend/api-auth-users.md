# ANPR Edge Server — Auth & User APIs (Frontend Reference)

Sample request/response JSONs for the JWT authentication and user-management
endpoints. Field names and shapes match the backend DTOs exactly.

- **Base URL:** `http://<edge-host>:8080`
- **Auth:** every endpoint except `POST /api/auth/login` requires the header
  `Authorization: Bearer <token>`.
- **Error shape (all failures):** `{ "timestamp": "...", "message": "..." }`
- **Timestamps:** ISO-8601 with offset (`OffsetDateTime`), e.g. `2026-07-11T10:20:00+05:30`.

---

## 1. Login — `POST /api/auth/login` (public)

**Request**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInVpZCI6MSwicm9sZSI6IlNVUEVSX0FETUlOIn0.3aQ...signature",
  "tokenType": "Bearer",
  "expiresInSeconds": 7200,
  "username": "admin",
  "role": "SUPER_ADMIN",
  "rights": [
    "USER_MANAGE", "ROLE_MANAGE", "CAMERA_CREATE", "CAMERA_UPDATE",
    "CAMERA_DELETE", "NVR_MANAGE", "STREAM_VIEW", "PLAYBACK_VIEW", "HEALTH_VIEW"
  ]
}
```
Use the `rights` array to show/hide UI actions. Token lifetime defaults to 2h
(`expiresInSeconds`: 7200). Send the token as `Authorization: Bearer <token>`
on every other call.

**401 Unauthorized** (wrong username or password — not distinguished, by design)
```json
{ "timestamp": "2026-07-11T10:15:30.123", "message": "Invalid username or password" }
```

**403 Forbidden** (account disabled)
```json
{ "timestamp": "2026-07-11T10:15:30.123", "message": "Account is disabled" }
```

**400 Bad Request** (missing field)
```json
{ "timestamp": "2026-07-11T10:15:30.123", "message": "password: must not be blank" }
```

---

## 2. Who am I — `GET /api/auth/me` (any logged-in user)

**200 OK**
```json
{
  "username": "admin",
  "role": "SUPER_ADMIN",
  "rights": ["USER_MANAGE", "ROLE_MANAGE", "CAMERA_CREATE", "STREAM_VIEW"]
}
```

**401 Unauthorized** — missing/expired/invalid token (generic error body).

---

## 3. Create user — `POST /api/users` (needs `USER_MANAGE`)

`firstName`, `lastName`, `zone` are optional. `roleName` must be an existing
role. `password` min 6 chars.

**Request**
```json
{
  "username": "op_karolbagh",
  "password": "secret123",
  "roleName": "OPERATOR",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "zone": "Karol Bagh"
}
```

**201 Created**
```json
{
  "id": 5,
  "username": "op_karolbagh",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "zone": "Karol Bagh",
  "role": "OPERATOR",
  "active": true,
  "createdAt": "2026-07-11T10:20:00+05:30"
}
```
Password is never returned in any response.

**409 Conflict** (username taken)
```json
{ "timestamp": "2026-07-11T10:20:00.000", "message": "Username already exists: op_karolbagh" }
```

**400 Bad Request** (validation)
```json
{ "timestamp": "2026-07-11T10:20:00.000", "message": "password: password must be at least 6 characters; roleName: must not be blank" }
```

---

## 4. List users — `GET /api/users` (needs `USER_MANAGE`)

**200 OK**
```json
[
  {
    "id": 1,
    "username": "admin",
    "firstName": "Default",
    "lastName": "Admin",
    "zone": null,
    "role": "SUPER_ADMIN",
    "active": true,
    "createdAt": "2026-07-01T09:00:00+05:30"
  },
  {
    "id": 5,
    "username": "op_karolbagh",
    "firstName": "Ravi",
    "lastName": "Kumar",
    "zone": "Karol Bagh",
    "role": "OPERATOR",
    "active": true,
    "createdAt": "2026-07-11T10:20:00+05:30"
  }
]
```

---

## 5. Get one user — `GET /api/users/{id}` (needs `USER_MANAGE`)

**200 OK** — single user object (same shape as an item in the list above).

**404 Not Found**
```json
{ "timestamp": "2026-07-11T10:25:00.000", "message": "User not found: 99" }
```

---

## 6. Update user — `PATCH /api/users/{id}` (needs `USER_MANAGE`)

Partial update — send only fields you want to change; omitted/`null` = leave
unchanged. Password is NOT changed here. Fields: `firstName`, `lastName`,
`zone`, `roleName`, `active`.

**Request** (change role + deactivate)
```json
{
  "roleName": "SUPERVISOR",
  "active": false
}
```

**200 OK**
```json
{
  "id": 5,
  "username": "op_karolbagh",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "zone": "Karol Bagh",
  "role": "SUPERVISOR",
  "active": false,
  "createdAt": "2026-07-11T10:20:00+05:30"
}
```

---

## 7. Reset password (admin) — `PATCH /api/users/{id}/password` (needs `USER_MANAGE`)

Admin reset — no old-password check.

**Request**
```json
{ "newPassword": "newSecret456" }
```

**204 No Content** (empty body). **400** if password < 6 chars.

---

## 8. Delete user — `DELETE /api/users/{id}` (needs `USER_MANAGE`)

**204 No Content** on success. **404** if not found.

---

## 9. List roles — `GET /api/roles` (needs `USER_MANAGE`)

For populating the role dropdown when creating/editing users.

**200 OK**
```json
[
  {
    "id": 1,
    "name": "SUPER_ADMIN",
    "description": "Full access",
    "rights": ["USER_MANAGE","ROLE_MANAGE","CAMERA_CREATE","CAMERA_UPDATE","CAMERA_DELETE","NVR_MANAGE","STREAM_VIEW","PLAYBACK_VIEW","HEALTH_VIEW"]
  },
  {
    "id": 2,
    "name": "OPERATOR",
    "description": "Live view and playback",
    "rights": ["STREAM_VIEW","PLAYBACK_VIEW","HEALTH_VIEW"]
  },
  {
    "id": 3,
    "name": "SUPERVISOR",
    "description": "Operator plus camera management",
    "rights": ["STREAM_VIEW","PLAYBACK_VIEW","HEALTH_VIEW","CAMERA_CREATE","CAMERA_UPDATE","CAMERA_DELETE","NVR_MANAGE"]
  }
]
```

---

## Notes for the frontend

- **Seeded roles:** `SUPER_ADMIN`, `OPERATOR`, `SUPERVISOR`. Use `roleName`
  (the string, e.g. `"OPERATOR"`) in create/update — not the id.
- **Bootstrap login:** on a fresh DB the default admin is `admin` / `admin123`
  (dev only; must be changed after first login).
- **401 vs 403:** `401` = not authenticated (no/expired token) → route to login.
  `403` = authenticated but lacks the required right → hide/disable the action.
- **Token refresh:** none yet — re-login when the token expires. Role/rights
  changes only take effect on the user's next login (rights are embedded in
  the token).
