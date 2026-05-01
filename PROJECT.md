# Finance Tracker — Documento de Proyecto

## Propósito

Aplicación web de uso personal para el seguimiento de finanzas personales. Permite registrar transacciones (ingresos y gastos), organizarlas por categorías, visualizar el estado financiero mensual, y en una segunda fase gestionar deudas y gastos compartidos con amigos.

## Objetivos principales

- Reemplazar el uso de Notion u otras herramientas genéricas por una solución propia, simple y enfocada
- Accesible desde cualquier dispositivo (computadora, celular) ya que los datos están en la nube
- Interfaz limpia, moderna y agradable visualmente
- Base de código simple, fácil de mantener y extender
- Control total sobre los endpoints y la lógica del backend

---

## Stack tecnológico

### Frontend
- **HTML + CSS + JavaScript vanilla** — sin frameworks
- CSS moderno con variables, tipografías de Google Fonts, diseño responsive
- Se comunica exclusivamente con la API propia (no accede a Firebase directamente)

### Backend
- **Node.js con Express** — servidor propio con endpoints REST
- Maneja toda la lógica de negocio y la comunicación con la base de datos
- Endpoints organizados por recurso: `/transactions`, `/categories`, `/friends`, `/debts`

### Base de datos
- **Firebase Firestore** — base de datos NoSQL en la nube, plan gratuito (Spark)
- Accedida únicamente desde el backend mediante el SDK de Firebase Admin
- Los datos son accesibles desde cualquier dispositivo

### Hosting
- **Frontend:** Vercel o Netlify — gratuito, conectado a GitHub
- **Backend:** Railway o Render — gratuito, soporta Node.js, deploy desde GitHub
- URL pública tipo `finance-tracker.vercel.app` para el frontend (sin dominio propio por ahora)

---

## Autenticación y roles

### Método de autenticación
- **Google Auth via Firebase Authentication** — sin formulario de registro ni manejo de contraseñas
- Acceso mediante botón "Iniciar sesión con Google"
- El frontend obtiene un ID token de Firebase Auth y lo envía al backend en cada request (`Authorization: Bearer <token>`)
- El backend verifica el token con el Firebase Admin SDK antes de procesar cualquier endpoint

### Whitelist de acceso
- Solo los usuarios cuyo email esté en la whitelist pueden ingresar a la aplicación
- Cualquier cuenta de Google que no esté en la lista es rechazada
- La whitelist se define en una colección `allowedUsers` en Firestore (alternativa: variable de entorno en el backend para la lista inicial)
- Si el email autenticado no está en `allowedUsers`, el backend responde `403 Forbidden` y el frontend muestra pantalla de acceso denegado

### Roles
Dos roles dentro de la aplicación:

- **`owner`** — un único usuario (yo)
  - Acceso completo a todas las secciones
  - CRUD completo en el módulo de finanzas personales (transacciones, categorías, dashboard)
  - Acceso completo al módulo de gastos compartidos

- **`friend`** — los demás usuarios de la whitelist
  - Acceso de **solo lectura** al módulo de finanzas personales (pueden ver pero no crear, editar ni eliminar)
  - Acceso completo al módulo de gastos compartidos (pueden agregar transacciones, deudas, divisiones de gastos)

### Implementación
- El rol se define en Firestore junto al usuario en la colección `allowedUsers`
- El backend, al verificar el token, busca el documento del usuario por email y adjunta el rol al request (`req.user = { email, role }`)
- Cada controlador de finanzas personales valida `role === 'owner'` antes de permitir mutaciones (POST/PUT/DELETE); las lecturas (GET) están permitidas para ambos roles
- Los endpoints de gastos compartidos están abiertos a ambos roles

---

## Estructura de la aplicación

### Fase 1 — Finance Tracker personal (prioridad actual)

#### Dashboard principal
- Resumen del mes en curso: total ingresos, total gastos, saldo neto
- Cards con indicadores clave
- Gráfico de gastos por categoría (torta o barras)
- Selector de mes para navegar hacia atrás

#### Transacciones
- Tabla con todas las transacciones: fecha, descripción, categoría, monto, tipo (ingreso/gasto)
- Formulario para agregar nueva transacción
- Editar y eliminar transacciones existentes
- Filtros por mes, tipo y categoría

#### Categorías
- Lista de categorías personalizables con nombre y color
- CRUD completo: crear, editar, eliminar

### Fase 2 — Gastos compartidos con amigos (a futuro, considerar en el diseño)

#### Gestión de deudas
- Lista de amigos/personas del grupo
- Registro de deudas: quién le debe a quién, monto, concepto
- Historial de pagos y cancelaciones
- Balance por persona

#### División de gastos (etapa futura)
- Ingresar un gasto y dividirlo entre N personas
- Cálculo automático de montos por persona
- Actualización automática de balances

---

## Estructura de la API (endpoints Express)

```
GET    /transactions          — listar transacciones (filtros: mes, tipo, categoría)
POST   /transactions          — crear transacción
PUT    /transactions/:id      — editar transacción
DELETE /transactions/:id      — eliminar transacción

GET    /categories            — listar categorías
POST   /categories            — crear categoría
PUT    /categories/:id        — editar categoría
DELETE /categories/:id        — eliminar categoría

GET    /friends               — listar amigos
POST   /friends               — agregar amigo
DELETE /friends/:id           — eliminar amigo

GET    /debts                 — listar deudas
POST   /debts                 — registrar deuda
PUT    /debts/:id             — actualizar deuda (pago parcial/total)
DELETE /debts/:id             — eliminar deuda
```

---

## Estructura de colecciones en Firestore

```
transactions/
  {id}
    amount: number
    type: "income" | "expense"
    category: string (ref a categoría)
    description: string
    date: timestamp

categories/
  {id}
    name: string
    color: string

friends/
  {id}
    name: string

debts/
  {id}
    fromFriend: string (ref)
    toFriend: string (ref)
    amount: number
    concept: string
    paid: boolean
    date: timestamp

allowedUsers/
  {id}
    email: string         (clave de búsqueda, único)
    role: "owner" | "friend"
    name: string          (opcional, display)
    addedAt: timestamp
```

---

## Estructura de carpetas del proyecto

```
finance/
├── PROJECT.md
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   └── app.js
│   └── pages/
│       ├── dashboard.html
│       ├── transactions.html
│       └── categories.html
└── backend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js
        ├── config/
        │   └── firebase.js
        ├── routes/
        │   ├── transactions.js
        │   ├── categories.js
        │   ├── friends.js
        │   └── debts.js
        └── controllers/
            ├── transactions.js
            ├── categories.js
            ├── friends.js
            └── debts.js
```

---

## Consideraciones de diseño

- Responsive, funciona bien en celular y escritorio
- Paleta moderna, acentos de color para ingresos (verde) y gastos (rojo/naranja)
- Navegación por secciones: Dashboard / Transacciones / Categorías / Amigos
- Login con Google (Firebase Auth) restringido por whitelist y diferenciado por rol (`owner` vs `friend`); ver sección "Autenticación y roles"
- En la UI, los usuarios `friend` ven el módulo de finanzas personales en modo lectura: se ocultan/deshabilitan los botones de crear/editar/eliminar

---

## Repositorio

- Monorepo con carpetas `frontend/` y `backend/`
- Control de versiones con Git y GitHub
- Deploy automático desde GitHub a Vercel (frontend) y Railway o Render (backend)
