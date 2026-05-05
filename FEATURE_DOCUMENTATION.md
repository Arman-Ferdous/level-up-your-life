# 📘 LevelUp Your Life — Feature Documentation
### Developer: Sadi | Branch: subscription-model-unlocks-more-features/sadi
### Project: CSE 470 Group Project

---

## 🗂️ Table of Contents
1. [How the App Starts (Foundation)](#0-how-the-app-starts-foundation)
2. [Feature 1 — Journal Entry & Daily Mood by Emoji](#1-feature-1--journal-entry--daily-mood-by-emoji)
3. [Feature 2 — Expense Tracker](#2-feature-2--expense-tracker)
4. [Feature 3 — Group Creation](#3-feature-3--group-creation)
5. [Feature 4 — Achievements & Badges](#4-feature-4--achievements--badges)
6. [Feature 5 — Subscription Model](#5-feature-5--subscription-model)

---

## 0. How the App Starts (Foundation)

Before any feature runs, the app boots through a chain of files. Understanding this chain is essential.

### Step 1 — Environment Variables (`backend/src/config/env.js`)

This is the very first file loaded. It reads the `.env` file from `backend/.env` and exposes all secrets and config as a typed `env` object.

**Example variables it reads:**
```
MONGO_URI=mongodb://127.0.0.1:27017/level-up-your-life
CLIENT_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

If `MONGO_URI` or `JWT_ACCESS_SECRET` is missing, the app **throws an error immediately** and refuses to start. This prevents silent failures.

### Step 2 — Database Connection (`backend/src/config/db.js`)

Called from `server.js` as `await connectDB()`. It connects to MongoDB using Mongoose with the `MONGO_URI` from env. All models (User, MoodEntry, Transaction, Group, Payment, Avatar) map to MongoDB collections after this runs.

### Step 3 — Server Bootstrap (`backend/src/server.js`)

This is the **entry point** of the backend. It runs in order:

```
1. connectDB()             → connects to MongoDB
2. ensureAdminAccount()    → creates admin user if none exists
3. ensureDefaultAvatars()  → seeds/patches avatar documents in DB
4. migrateLegacyGroupTasks() → fixes old group task formats
5. startTaskReminderWorker() → starts background reminder job
6. createApp()             → builds the Express app with all routes
7. app.listen(5001)        → starts listening for HTTP requests
```

### Step 4 — Express App (`backend/src/app.js`)

All API routes are registered here. Every route is prefixed with `/api/`:

```
/api/auth         → login, register, logout, refresh token
/api/mood         → mood journal (Feature 1)
/api/transactions → expense tracker (Feature 2)
/api/groups       → group creation (Feature 3)
/api/avatars      → avatar shop (Feature 5 unlocks premium avatars)
/api/rewards      → daily bonus (Feature 5)
/api/subscription → payment & premium activation (Feature 5)
```

### Step 5 — Auth Middleware (`backend/src/middlewares/auth.middleware.js`)

Every protected route passes through `requireAuth`. It reads the `Authorization: Bearer <token>` header, verifies the JWT access token, and attaches the decoded payload as `req.user`:

```js
req.user = { sub: "userId", email: "user@mail.com", role: "user" }
```

If the token is missing or expired → **401 Unauthorized** is returned immediately.

### Step 6 — User Login (`frontend/src/pages/Login.jsx` → `backend/src/controllers/auth.controller.js`)

**What happens when a user logs in:**

1. User goes to `http://localhost:5173/login`
2. They enter email + password and click Login
3. Frontend calls `POST /api/auth/login`
4. Backend finds the user by email in MongoDB
5. bcrypt compares the entered password with the stored hash
6. If correct → generates two tokens:
   - **Access Token** (JWT, expires in 15 minutes) — sent in response body
   - **Refresh Token** (JWT, expires in 7 days) — stored as an HttpOnly cookie
7. The user's `selectedAvatar` is populated (joined from Avatar collection)
8. `isPremiumActive()` is called to check if their subscription is still valid
9. All user data is returned to the frontend:
   ```json
   {
     "user": {
       "id": "abc123",
       "name": "sadi1",
       "email": "sadi@mail.com",
       "role": "user",
       "points": 85,
       "streak": 0,
       "isPremium": false,
       "selectedAvatar": { "emoji": "🍌", "name": "Banana" }
     },
     "accessToken": "eyJ..."
   }
   ```
10. Frontend stores the access token and user in React's `AuthContext`
11. User is redirected to `/` (Home page)

---

## 1. Feature 1 — Journal Entry & Daily Mood by Emoji

### 📌 What It Does
Allows users to log how they feel each day using an emoji. Each day can have exactly one mood entry. Users can also write a text note alongside the emoji. A 30-day history is displayed in the Mood Journal page.

### 🗃️ Database Model (`backend/src/models/MoodEntry.js`)

```
Collection: moodentries

Fields:
  userId    → ObjectId (references User) — who logged this mood
  emoji     → String (required) — the mood emoji e.g. "😊"
  date      → String "YYYY-MM-DD" — the day this mood is for
  note      → String (optional) — a text note
  createdAt → Date (auto)
  updatedAt → Date (auto)

Unique Index: { userId + date } → one mood per user per day
```

**Example MongoDB document:**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "userId": "64e0a1b2c3d4e5f6a7b8c9d0",
  "emoji": "😊",
  "date": "2025-05-05",
  "note": "Had a great productive day!",
  "createdAt": "2025-05-05T14:30:00.000Z"
}
```

### 🔌 API Routes (`backend/src/routes/moodRoutes.js`)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/mood` | ✅ Required | Save or update today's mood |
| GET | `/api/mood/today` | ✅ Required | Get mood for a specific date |
| GET | `/api/mood/history` | ✅ Required | Get mood history (last 30 days) |

### ⚙️ Controller Logic (`backend/src/controllers/moodController.js`)

**`saveMood` (POST /api/mood):**

1. Reads `emoji`, `note`, `date` from request body
2. Validates that `emoji` is present — throws 400 if missing
3. Validates date format is `YYYY-MM-DD` — throws 400 if wrong format
4. Rejects **future dates** — you can't log tomorrow's mood
5. Rejects dates **older than 30 days** — you can't edit ancient history
6. Checks if an entry already exists for `{ userId, date }`
7. Uses `findOneAndUpdate` with `upsert: true`:
   - If entry **exists** → updates emoji and note
   - If entry **doesn't exist** → creates a new one
8. Returns the saved entry

**Example request:**
```
POST /api/mood
Authorization: Bearer eyJ...
Body: { "emoji": "😊", "note": "Feeling good!", "date": "2025-05-05" }
```

**Example response:**
```json
{
  "entry": {
    "_id": "64f1a2b3...",
    "userId": "64e0a1b2...",
    "emoji": "😊",
    "note": "Feeling good!",
    "date": "2025-05-05"
  }
}
```

**`getTodayMood` (GET /api/mood/today):**
- Reads `?date=2025-05-05` query param
- Returns the user's mood entry for that date, or `null` if none

**`getMoodHistory` (GET /api/mood/history):**
- `?days=30` → returns last 30 days of entries sorted by date
- `?year=2025&month=5` → returns all entries for May 2025
- No params → returns last 7 days

### 🖥️ Frontend Flow

**Path in the app:**
```
Login → Home page → (sidebar) click "Mood" → /mood
```

**Files involved:**
- `frontend/src/api/mood.api.js` — Axios wrappers
- `frontend/src/pages/MoodPage.jsx` — the journal page
- `frontend/src/components/MoodHexPicker.jsx` — the radial emoji picker on the Home page
- `frontend/src/components/MoodPicker.jsx` — the picker on the Mood page itself
- `frontend/src/context/MoodContext.jsx` — global mood state

**On the Home page:**
- The `MoodHexPicker` component shows a circular arrangement of mood emojis
- When you click an emoji, it calls `MoodAPI.saveMood({ date, emoji })` immediately
- The selected emoji is shown in the center of the circle
- The circle collapses after selection

**On the Mood Journal page (`/mood`):**
- `MoodPicker` shows the emoji options and a note textarea
- Submitting saves both emoji + note together
- Below, a list of the last 30 days' entries is shown from `MoodContext`

**API calls made by the frontend:**
```js
// Save a mood
MoodAPI.saveMood({ date: "2025-05-05", emoji: "😊", note: "Great day" })
// → POST /api/mood

// Get today's mood
MoodAPI.getToday({ date: "2025-05-05" })
// → GET /api/mood/today?date=2025-05-05

// Get history
MoodAPI.getHistory({ days: 30 })
// → GET /api/mood/history?days=30
```

### 🔐 Security
- All 3 routes require a valid JWT (`requireAuth` middleware)
- Users can only see/edit **their own** mood entries (filtered by `req.user.sub`)
- Future dates and dates older than 30 days are rejected

---

## 2. Feature 2 — Expense Tracker

### 📌 What It Does
Allows users to track their income and expenses month by month. Users can add, edit, and delete transactions with a category, amount, note, and date. A stats summary shows total income, total expenses, and net balance for any selected month.

### 🗃️ Database Model (`backend/src/models/Transaction.js`)

```
Collection: transactions

Fields:
  userId    → ObjectId (references User)
  type      → String "income" or "expense"
  category  → String (e.g. "Food", "Salary", "Transport")
  amount    → Number (minimum 0.01, maximum 100,000,000)
  note      → String (optional, max 240 characters)
  date      → Date (the transaction date)
  monthKey  → String "YYYY-MM" (auto-computed before save)
  createdAt → Date (auto)
  updatedAt → Date (auto)

Compound Index: { userId, monthKey, date, createdAt }
```

The `monthKey` field is **automatically computed** by a Mongoose pre-validate hook:
```js
// Example: date = "2025-05-15" → monthKey = "2025-05"
```
This allows very fast month-based filtering without scanning all dates.

**Example MongoDB document:**
```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "userId": "64e0a1b2c3d4e5f6a7b8c9d0",
  "type": "expense",
  "category": "Food",
  "amount": 450.00,
  "note": "Lunch at restaurant",
  "date": "2025-05-05T00:00:00.000Z",
  "monthKey": "2025-05"
}
```

### 🔌 API Routes (`backend/src/routes/transactionRoutes.js`)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/transactions/stats` | ✅ Required | Get monthly summary (income, expenses, balance) |
| GET | `/api/transactions` | ✅ Required | List all transactions for a month |
| POST | `/api/transactions` | ✅ Required | Create a new transaction |
| PUT | `/api/transactions/:id` | ✅ Required | Update an existing transaction |
| DELETE | `/api/transactions/:id` | ✅ Required | Delete a transaction |

**Important:** `/stats` is declared **before** `/:id` in the router to prevent Express from treating "stats" as an ID parameter.

### ⚙️ Controller Logic

**`getTransactionStats` (GET /api/transactions/stats):**
- Accepts `?year=2025&month=5` query params
- Runs a MongoDB aggregation pipeline:
  ```
  $match → filter by userId + date range for the month
  $group → compute totalIncome, totalExpenses, balance
  ```
- Returns:
  ```json
  { "summary": { "income": 5000, "expenses": 1200, "balance": 3800 } }
  ```

**`createTransaction` (POST /api/transactions):**
1. Request body is validated by Zod schema first
2. `userId` is always taken from `req.user.sub` (JWT) — never from the body
3. Transaction is saved to MongoDB
4. `monthKey` is auto-set by the pre-validate hook

**`updateTransaction` (PUT /api/transactions/:id):**
- Uses `findOneAndUpdate({ _id: id, userId })` — the `userId` check prevents one user from editing another user's transaction (IDOR protection)

**`deleteTransaction` (DELETE /api/transactions/:id):**
- Uses `findOneAndDelete({ _id: id, userId })` — same IDOR protection

### 🖥️ Frontend Flow

**Path in the app:**
```
Login → Home page → (sidebar) click "Expenses" → /expense-tracker
```

**Files involved:**
- `frontend/src/api/transaction.api.js` — Axios wrappers
- `frontend/src/pages/ExpenseTrackerPage.jsx` — main page

**What the user sees:**
1. **Month/Year selector** — defaults to current month
2. **Summary bar** — shows total income, expenses, and balance
3. **Transaction list** — shows all transactions for the selected month
4. **Add Transaction form** — type (income/expense), category dropdown, amount, note, date
5. **Edit/Delete** buttons on each transaction

**Example API calls:**
```js
// Get stats for May 2025
TransactionAPI.stats({ year: 2025, month: 5 })
// → GET /api/transactions/stats?year=2025&month=5

// Create a transaction
TransactionAPI.create({ type: "expense", category: "Food", amount: 150, date: "2025-05-05", note: "Lunch" })
// → POST /api/transactions

// Delete transaction
TransactionAPI.remove("65a1b2c3d4e5f6a7b8c9d0e1")
// → DELETE /api/transactions/65a1b2c3d4e5f6a7b8c9d0e1
```

**Home page integration:**
- The Home page shows the **current month's balance** in the Mood & Expense section
- It calls `TransactionAPI.stats({ year, month })` on load and displays the balance number

### 🔐 Security
- All routes protected by `requireAuth`
- `userId` always comes from the verified JWT, never from request body
- IDOR protection: update/delete scoped to `{ _id, userId }` — users cannot touch other users' data
- Zod validation strips any extra fields from the request body

---

## 3. Feature 3 — Group Creation

### 📌 What It Does
Allows users to create a "Guild" (group) with a name, description, and privacy setting. Each group gets a unique 6-character join code. Other users can join using this code or browse public groups in the Discovery tab.

### 🗃️ Database Model (`backend/src/models/Group.js`)

```
Collection: groups

Fields:
  name        → String (required, max 120 chars)
  description → String (optional)
  joinCode    → String (6 chars, unique, auto-lowercased)
  isPublic    → Boolean (default false)
  members     → Array of { userId, role }
                  role: "Guild Master" | "Veteran" | "Novice"
  createdAt   → Date

Indexes:
  { joinCode: 1 }            → unique, fast join-by-code lookup
  { members.userId, createdAt } → fast "my groups" query
```

**Example MongoDB document:**
```json
{
  "_id": "65b1c2d3e4f5a6b7c8d9e0f1",
  "name": "Study Warriors",
  "description": "A group for focused studying",
  "joinCode": "abc123",
  "isPublic": true,
  "members": [
    { "userId": "64e0a1b2...", "role": "Guild Master" },
    { "userId": "64f1b2c3...", "role": "Novice" }
  ],
  "createdAt": "2025-05-01T10:00:00.000Z"
}
```

### 🔌 API Routes (`backend/src/routes/group.routes.js`)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/groups` | ✅ Required | Create a new group |
| POST | `/api/groups/join` | ✅ Required | Join a group by code |
| GET | `/api/groups/my-groups` | ✅ Required | Get all groups the user is in |
| GET | `/api/groups/discover` | ✅ Required | Browse public groups the user hasn't joined |

### ⚙️ Controller Logic (`backend/src/controllers/groupController.js`)

**`createGroup` (POST /api/groups):**
1. Validates `name` (required) and `description`, `isPublic` (optional) via Zod
2. Generates a **unique 6-character join code** (up to 25 attempts):
   ```
   e.g. "xk7m2p"
   ```
3. Creates the group with the creator as **"Guild Master"** in the members array
4. Returns the created group

**`joinGroup` (POST /api/groups/join):**
1. Validates `joinCode` (must be 6 alphanumeric characters)
2. Converts code to lowercase
3. Finds the group by `joinCode`
4. Checks if user is **already a member** — returns message if so
5. Adds the user as **"Novice"** to the members array

**`getMyGroups` (GET /api/groups/my-groups):**
- Queries groups where `members.userId` contains the logged-in user's ID
- Returns all groups with member details

**`discoverGroups` (GET /api/groups/discover):**
- Finds public groups (`isPublic: true`)
- **Excludes** groups the user is already in:
  ```js
  { isPublic: true, "members.userId": { $not: { $elemMatch: { $eq: userId } } } }
  ```

### 🖥️ Frontend Flow

**Path in the app:**
```
Login → Home page → (sidebar) click "Groups" → /groups
```

**Files involved:**
- `frontend/src/api/groupService.js` — Axios wrappers
- `frontend/src/pages/GroupsPage.jsx` — main page
- `frontend/src/components/CreateGroup.jsx` — form to create a group
- `frontend/src/components/JoinGroup.jsx` — form to join by code
- `frontend/src/components/MyGroupsList.jsx` — list of your groups
- `frontend/src/components/DiscoveryTab.jsx` — browse public groups

**What the user sees on `/groups`:**
1. **Create Group** form — enter name, description, toggle public/private → click Create → gets a join code like `"abc123"`
2. **Join Group** form — enter the 6-character code → joins the group
3. **My Guilds tab** — shows all groups you're in, with your role badge (Guild Master / Novice)
4. **Discovery tab** — browse and join public groups

**Example API calls:**
```js
// Create a group
groupService.createGroup({ name: "Study Warriors", description: "...", isPublic: true })
// → POST /api/groups

// Join by code
groupService.joinGroup({ joinCode: "abc123" })
// → POST /api/groups/join

// My groups
groupService.getMyGroups()
// → GET /api/groups/my-groups

// Discover
groupService.discoverGroups()
// → GET /api/groups/discover
```

### 🔐 Security
- All routes protected by `requireAuth`
- The creator is always the Guild Master (taken from JWT, not request body)
- Duplicate membership is prevented server-side before pushing to array

---

## 4. Feature 4 — Achievements & Badges

### 📌 What It Does
Rewards users with badges based on their **habit streak** (consecutive days completing habit tasks). As the streak grows, higher-tier badges are unlocked. The badge is displayed prominently on the Home page immediately after login, with animations to catch the eye.

### 🗃️ Database Fields (`backend/src/models/User.js`)

The badge system uses these fields on the User document:
```
streak → Number (default 0)
         Updated every time a habit task is completed.
         Uses $max so it only goes up, never down by accident.

points → Number (default 100)
         Increased when streak milestone rewards are earned.
```

### 🏆 Badge Levels (`frontend/src/components/Badge.jsx`)

| Streak Days | Badge | Name | Color |
|---|---|---|---|
| 1+ days | 🌱 | First Step | Green |
| 7+ days | 🔥 | Starter Spark | Orange |
| 14+ days | ⚡ | Consistency Builder | Indigo |
| 30+ days | 👑 | Unstoppable Force | Gold |

### ⚙️ How Streak Updates Work (`backend/src/controllers/taskController.js`)

**Every time a user marks a habit task as complete:**

1. The user's `habitCompletionHistory` array is updated with today's date
2. `computeHabitCurrentStreak()` is called — it counts backwards from today through the history to find consecutive completed days that match the scheduled weekdays
3. The result is saved to `user.streak` atomically using `$max`:
   ```js
   await User.findByIdAndUpdate(userId, { $max: { streak: currentStreak } });
   ```
   (`$max` only updates if the new value is higher — streak never drops from this call)
4. Streak milestone rewards are checked:

| Streak | Points Awarded |
|--------|---------------|
| 2 days | +5 pts |
| 5 days | +15 pts |
| 10 days | +50 pts |
| 15 days | +100 pts |
| 30 days | +200 pts |

Each milestone is only claimed **once** (tracked in `task.habitRewardMilestones`).

**Example scenario:**
- User has a habit "Morning Run" scheduled Mon/Wed/Fri
- They complete it on Mon (May 5), Wed (May 7), Fri (May 9)
- Streak = 3 consecutive scheduled days → badge stays at 🌱 First Step
- They complete 4 more sessions → streak = 7 → badge upgrades to 🔥 Starter Spark
- +15 points milestone reward fires automatically

### 🖥️ Frontend — Badge Display

**Files involved:**
- `frontend/src/components/Badge.jsx` — the animated badge component
- `frontend/src/components/Badge.module.css` — animations
- `frontend/src/pages/Home.jsx` — renders badge in hero section

**The Badge component shows:**
1. **Floating badge circle** — bobs up and down continuously (CSS animation)
2. **Glow ring** — pulsing colored ring around the badge
3. **Shimmer sweep** — a light gloss sweeps across the badge
4. **Tier pill** — colored label (e.g. "Beginner", "Gold")
5. **Streak number** — e.g. "7 day streak"
6. **Progress bar** — shows progress to next badge (e.g. "7 days to next badge")

**Where you see it:**
```
Login → immediately on the Home page, in a glassmorphism card
        below the "25-minute focus sprint" button
```

**How the Home page gets the streak:**
```js
// In Home.jsx
const { user } = useAuth();
const streak = Math.max(0, Number(user.streak) || 0);
// user.streak comes from the login API response → stored in AuthContext
```

**Badge section (bottom of Home page):**
- Also shows a 2×2 grid of all 4 badge tiles
- Unlocked badges are shown in full color; locked ones are grayscale
- `HabitStreakGrid` shows the last 12 weeks of habit completions as a GitHub-style heatmap

---

## 5. Feature 5 — Subscription Model

### 📌 What It Does
A premium subscription system (৳499/month) that unlocks exclusive features:
- ✅ Unlimited AI chat (free users limited to ~5 messages/day)
- ✅ Daily login bonus (+50 coins every day)
- ✅ Exclusive premium avatars (Dolls & Vehicles categories locked for free users)
- ✅ Premium badge on leaderboard

Payment is a **demo simulation** — no real money is processed. The demo card `4242 4242 4242 4242` (CVV: `123`) always succeeds.

### 🗃️ Database Models

**`Payment.js` — payment records:**
```
Collection: payments

Fields:
  userId    → ObjectId (references User)
  userName  → String (user's name at time of payment)
  amount    → Number (499)
  cardLast4 → String (last 4 digits of card)
  status    → String "success" | "failed" (default "success")
  createdAt → Date (auto)
```

**`User.js` — premium fields:**
```
isPremium        → Boolean (default false)
premiumExpiresAt → Date (30 days from payment)
lastLoginBonusAt → Date (tracks last daily bonus claim)
```

### 🔌 API Routes

**Subscription (`backend/src/routes/subscription.routes.js`):**

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/subscription/pay` | ✅ Required | Process demo payment, activate premium |
| GET | `/api/subscription/admin/revenue` | ✅ Admin only | View all payments and revenue |

**Rewards (`backend/src/routes/rewards.routes.js`):**

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/rewards/daily-login` | ✅ + Premium | Claim daily 50-coin bonus |
| GET | `/api/rewards/daily-login/status` | ✅ Required | Check if bonus already claimed today |

### ⚙️ Controller Logic

**`paySubscription` (POST /api/subscription/pay):**

1. Validates card number (16 digits) and CVV (3 digits)
2. Finds the user from JWT (`req.user.sub`)
3. Records the payment in `Payment` collection with `cardLast4`
4. Calculates expiry — **stacks on existing premium** if still active:
   ```
   If already premium until May 30, paying again → extends to June 29
   If expired, new premium runs from today → 30 days from now
   ```
5. Sets `user.isPremium = true` and `user.premiumExpiresAt`
6. Adds ৳499 to the admin's balance: `User.updateOne({ role: "admin" }, { $inc: { adminBalance: 499 } })`
7. Returns success with expiry date

**`isPremiumActive()` method on User model:**
```js
userSchema.methods.isPremiumActive = async function () {
  if (!this.isPremium) return false;
  if (this.premiumExpiresAt > Date.now()) return true;
  // Auto-expire: if time is up, flip the flag
  this.isPremium = false;
  await this.save();
  return false;
};
```
This is called on every login and on the `/api/auth/me` endpoint to auto-expire stale subscriptions.

**`claimDailyBonus` (POST /api/rewards/daily-login):**

Uses an **atomic** `findOneAndUpdate` to prevent double-claims:
```js
User.findOneAndUpdate(
  {
    _id: userId,
    $or: [
      { lastLoginBonusAt: null },
      { lastLoginBonusAt: { $lt: startOfToday } }  // not yet claimed today
    ]
  },
  {
    $inc: { points: 50 },
    $set: { lastLoginBonusAt: new Date() }
  }
)
```
- If it matches → 50 coins added, `lastLoginBonusAt` updated → success
- If it doesn't match (already claimed today) → returns `alreadyClaimedToday: true`

### 🖥️ Frontend Flow

**Path to subscribe:**
```
Login → Home page → (sidebar) click "Subscription" icon 👑 → /subscription
OR
Avatar Shop → click "Upgrade to Unlock" on any locked avatar → /subscription
```

**`SubscriptionPage.jsx`:**

- If **not premium**: shows the plan card with "Subscribe Now — ৳499/month" button
- Clicking opens the `PaymentModal`

**`PaymentModal.jsx`:**
1. User sees a card number input and CVV input
2. "Use Demo Card" button fills in `4242 4242 4242 4242` / `123` automatically
3. Clicking "Pay ৳499" runs validation:
   - Card must be exactly 16 digits
   - CVV must be exactly 3 digits
4. A 1.5 second simulated processing delay shows a spinner
5. Calls `SubscriptionAPI.pay({ cardNumber, cvv })` → `POST /api/subscription/pay`
6. On success: shows ✓ green checkmark, then calls `refreshUser()` to update the auth context with new `isPremium: true` status
7. Modal closes automatically after 2 seconds

- If **already premium**: shows "Premium Active ✓" with the expiry date and a list of perks

**`Home.jsx` — Daily Bonus card (in Mood section):**
```
If premium:
  → Shows "Claim Daily Bonus 🎁 (+50 coins)" button
  → Calls RewardsAPI.claimDailyBonus() → POST /api/rewards/daily-login
  → On success: shows "+50 coins!" toast, updates points in AuthContext

If not premium:
  → Shows "🔒 Daily Bonus — Premium perk" locked card
  → "Upgrade" link goes to /subscription
```

**Avatar Shop — Premium Lock (`frontend/src/pages/AvatarShop.jsx`):**
- **Fruits 🍎 & Flowers 🌻** → Free for all users (5 pts each)
- **Dolls & Friends 🪆** → Premium only (15 pts each, rare)
- **Vehicles 🚀** → Premium only (20–30 pts, epic/legendary)

For non-premium users on locked sections:
1. A dark navy **"Premium Exclusive"** banner appears with "Upgrade Now" CTA
2. Each avatar card shows a 🔒 overlay with "Premium Only" text
3. The button reads "Upgrade to Unlock" (links to `/subscription`)
4. If they somehow click Buy → backend's `buyAvatar` independently checks `isPremiumActive()` and returns `403 premiumRequired`

**Admin Revenue Page (`/admin/revenue`):**
- Only accessible to users with `role: "admin"`
- Shows total revenue, number of payments, and recent payment history
- Data comes from `GET /api/subscription/admin/revenue`

### 🔐 Security
- Payment route protected by `requireAuth`
- Admin revenue route protected by `requireAuth` + `requireRole("admin")`
- Daily bonus protected by `requireAuth` + `requirePremium` middleware
- Premium avatar enforcement is **double-layered**: frontend lock UI + backend `403` check
- Atomic daily bonus claim prevents race conditions from double-clicking

---

## 📊 How All 5 Features Connect

```
User logs in
    ↓
AuthContext stores user data (points, streak, isPremium, selectedAvatar)
    ↓
Home page shows:
    ├── Badge (from user.streak) ──────────── Feature 4
    ├── Current month balance ──────────────── Feature 2
    ├── Today's mood (MoodHexPicker) ────────── Feature 1
    ├── Daily Bonus (if premium) ───────────── Feature 5
    └── Upcoming tasks (habit streaks) ─────── Feature 4
    ↓
Sidebar links to:
    ├── /mood ──────────────── Feature 1 (Mood Journal)
    ├── /expense-tracker ───── Feature 2 (Expense Tracker)
    ├── /groups ────────────── Feature 3 (Group Creation)
    ├── /avatar-shop ───────── Feature 5 (Premium avatars)
    └── /subscription ──────── Feature 5 (Subscribe)
    ↓
Completing a habit task:
    → Updates habitCompletionHistory
    → Recalculates streak → Updates user.streak ── Feature 4
    → Awards milestone points ─────────────────── Feature 4
    → Points can be spent in Avatar Shop ────────── Feature 5
```

---

## 📁 File Reference Map

| Feature | Backend Model | Backend Controller | Backend Route | Frontend Page | Frontend API |
|---------|--------------|-------------------|---------------|---------------|--------------|
| Mood Journal | `MoodEntry.js` | `moodController.js` | `moodRoutes.js` | `MoodPage.jsx` | `mood.api.js` |
| Expense Tracker | `Transaction.js` | `transactionController.js` | `transactionRoutes.js` | `ExpenseTrackerPage.jsx` | `transaction.api.js` |
| Group Creation | `Group.js` | `groupController.js` | `group.routes.js` | `GroupsPage.jsx` | `groupService.js` |
| Badges | `User.js` (streak field) | `taskController.js` | `taskRoutes.js` | `Home.jsx`, `Badge.jsx` | `task.api.js` |
| Subscription | `Payment.js`, `User.js` | `subscription.controller.js`, `rewards.controller.js` | `subscription.routes.js`, `rewards.routes.js` | `SubscriptionPage.jsx`, `PaymentModal.jsx` | `subscription.api.js`, `rewards.api.js` |
