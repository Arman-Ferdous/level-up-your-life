# LevelUp Project File Summary

## Overview
LevelUp is a full-stack student productivity app with an Express/MongoDB backend and a React/Vite frontend. The backend is the part that most closely follows an MVC-style structure. The frontend is built with React components, pages, context providers, and API wrappers rather than classic MVC.

## MVC Breakdown

### Model
These files define data structures, persistence, or database-related logic.

#### Backend models
- `backend/src/models/User.js` - user profile, auth, streak, points, and role data.
- `backend/src/models/Task.js` - task records, task type, completion, deadlines, and reminders.
- `backend/src/models/MoodEntry.js` - mood journal entries for a given day.
- `backend/src/models/Transaction.js` - income and expense transaction records.
- `backend/src/models/Challenge.js` - challenge-related data.
- `backend/src/models/MonthlyChallenge.js` - the current monthly challenge definition.
- `backend/src/models/Group.js` - study or community group data.
- `backend/src/models/Notification.js` - notification entries.
- `backend/src/models/Avatar.js` - avatar shop items and unlock data.
- `backend/src/models/AiSuggestionEvent.js` - tracking for AI suggestion impressions and clicks.

### View
These files render the user interface.

#### Frontend pages
- `frontend/src/pages/Home.jsx` - main dashboard and sectioned home screen.
- `frontend/src/pages/Login.jsx` - login page UI.
- `frontend/src/pages/Register.jsx` - registration page UI.
- `frontend/src/pages/MoodPage.jsx` - mood tracking page.
- `frontend/src/pages/ExpenseTrackerPage.jsx` - expense tracking page.
- `frontend/src/pages/TasksPage.jsx` - task management page.
- `frontend/src/pages/PomodoroPage.jsx` - pomodoro timer page.
- `frontend/src/pages/ChallengesPage.jsx` - challenge browsing and participation page.
- `frontend/src/pages/AvatarShop.jsx` - avatar shop page.
- `frontend/src/pages/AdminUsersPage.jsx` - admin user management page.
- `frontend/src/pages/GroupsPage.jsx` - group browsing and group task page.
- `frontend/src/pages/CalendarPage.jsx` - calendar and weekly review access page.
- `frontend/src/pages/WeeklyReviewPage.jsx` - weekly review page.

#### Frontend components
- `frontend/src/components/Navbar.jsx` - top navigation.
- `frontend/src/components/HomeSidebar.jsx` - left home sidebar.
- `frontend/src/components/UpcomingTasksSidebar.jsx` - home task preview panel.
- `frontend/src/components/AiChatLauncher.jsx` - floating AI chat launcher and chat panel.
- `frontend/src/components/AiGuide.jsx` - AI guidance card used on the home screen.
- `frontend/src/components/Badge.jsx` - badge display component.
- `frontend/src/components/CreateGroup.jsx` - group creation UI.
- `frontend/src/components/DiscoveryTab.jsx` - group discovery UI.
- `frontend/src/components/GroupList.jsx` - group list display.
- `frontend/src/components/GroupTaskManager.jsx` - group task controls.
- `frontend/src/components/JoinGroup.jsx` - join group UI.
- `frontend/src/components/HabitStreakGrid.jsx` - habit streak visualization.
- `frontend/src/components/MoodHexPicker.jsx` - mood selection UI.
- `frontend/src/components/MoodPicker.jsx` - mood input control.
- `frontend/src/components/MyGroupsList.jsx` - current user groups list.
- `frontend/src/components/NotificationPanel.jsx` - notifications drawer/panel.
- `frontend/src/components/ToastStack.jsx` - toast notifications.
- `frontend/src/components/TodoList.jsx` - reusable to-do list UI.
- `frontend/src/components/expense/ExpenseCharts.jsx` - charts for expense data.
- `frontend/src/components/expense/SummaryCards.jsx` - expense summary cards.
- `frontend/src/components/expense/TransactionForm.jsx` - transaction entry form.
- `frontend/src/components/expense/TransactionTable.jsx` - transaction table.
- `frontend/src/components/AuthMarquee.jsx` - animated background text for auth pages.

### Controller
These files handle requests, business logic, and API responses.

#### Backend controllers
- `backend/src/controllers/auth.controller.js` - login, register, token, and auth flow handling.
- `backend/src/controllers/taskController.js` - task CRUD, completion, and task-related logic.
- `backend/src/controllers/moodController.js` - mood entry creation and retrieval.
- `backend/src/controllers/transactionController.js` - expense and transaction logic.
- `backend/src/controllers/challengeController.js` - challenge-related operations.
- `backend/src/controllers/groupController.js` - group creation, joining, and group task logic.
- `backend/src/controllers/avatarController.js` - avatar shop and avatar selection logic.
- `backend/src/controllers/admin.controller.js` - admin user management and admin actions.
- `backend/src/controllers/notificationController.js` - notifications CRUD and status updates.
- `backend/src/controllers/aiGuideController.js` - AI guide generation, AI chat replies, and AI suggestion tracking.

## Backend File Summary

### App and startup
- `backend/src/app.js` - creates the Express app, registers middleware, and mounts route modules.
- `backend/src/server.js` - starts the backend server.

### Configuration
- `backend/src/config/db.js` - database connection setup.
- `backend/src/config/env.js` - environment variable loading and normalized config values.

### Middleware
- `backend/src/middlewares/auth.middleware.js` - auth guard and user validation for protected routes.
- `backend/src/middlewares/error.middleware.js` - not-found and centralized error handling.
- `backend/src/middlewares/validate.middleware.js` - request validation wrapper.

### Services
- `backend/src/services/taskReminderWorker.js` - background task reminder processing.

### Utilities
- `backend/src/utils/asyncHandler.js` - async route wrapper for cleaner controller error handling.
- `backend/src/utils/errors.js` - custom error classes and helpers.
- `backend/src/utils/tokens.js` - token creation and token-related helpers.
- `backend/src/utils/adminBootstrap.js` - initial admin setup/bootstrap helper.
- `backend/src/utils/avatarBootstrap.js` - initial avatar setup/bootstrap helper.
- `backend/src/utils/taskMigration.js` - migration helper for task data changes.

### Validators
- `backend/src/validators/auth.validators.js` - validation rules for authentication endpoints.
- `backend/src/validators/task.validators.js` - task input validation.
- `backend/src/validators/challenge.validators.js` - challenge request validation.
- `backend/src/validators/group.validators.js` - group request validation.
- `backend/src/validators/notification.validators.js` - notification request validation.
- `backend/src/validators/transaction.validators.js` - transaction request validation.
- `backend/src/validators/ai.validators.js` - AI chat and guide request validation.

### Routes
- `backend/src/routes/auth.routes.js` - authentication endpoints.
- `backend/src/routes/taskRoutes.js` - task endpoints.
- `backend/src/routes/moodRoutes.js` - mood endpoints.
- `backend/src/routes/transactionRoutes.js` - transaction endpoints.
- `backend/src/routes/challengeRoutes.js` - challenge endpoints.
- `backend/src/routes/group.routes.js` - group endpoints.
- `backend/src/routes/avatarRoutes.js` - avatar endpoints.
- `backend/src/routes/admin.routes.js` - admin endpoints.
- `backend/src/routes/notificationRoutes.js` - notification endpoints.
- `backend/src/routes/ai.routes.js` - AI guide and chat endpoints.

### Models
- `backend/src/models/User.js` - user records.
- `backend/src/models/Task.js` - task records.
- `backend/src/models/MoodEntry.js` - mood entries.
- `backend/src/models/Transaction.js` - transaction records.
- `backend/src/models/Challenge.js` - challenge records.
- `backend/src/models/MonthlyChallenge.js` - monthly challenge records.
- `backend/src/models/Group.js` - group records.
- `backend/src/models/Notification.js` - notification records.
- `backend/src/models/Avatar.js` - avatar records.
- `backend/src/models/AiSuggestionEvent.js` - AI suggestion tracking records.

## Frontend File Summary

### App entry and global setup
- `frontend/src/main.jsx` - React entry point and root render.
- `frontend/src/App.jsx` - route definitions and page protection logic.
- `frontend/src/App.css` - global app shell and route-level styling.
- `frontend/src/index.css` - global base styles, resets, and font defaults.

### Context providers
- `frontend/src/context/AuthContext.jsx` - auth state and user session context.
- `frontend/src/context/MoodContext.jsx` - mood state shared across pages.
- `frontend/src/context/NotificationContext.jsx` - notification state and helpers.

### API wrappers
- `frontend/src/api/axios.js` - shared Axios client configuration.
- `frontend/src/api/auth.api.js` - auth requests.
- `frontend/src/api/task.api.js` - task requests.
- `frontend/src/api/mood.api.js` - mood requests.
- `frontend/src/api/transaction.api.js` - transaction requests.
- `frontend/src/api/challenge.api.js` - challenge requests.
- `frontend/src/api/groupService.js` - group-related API helpers.
- `frontend/src/api/avatar.api.js` - avatar API helpers.
- `frontend/src/api/notification.api.js` - notification API helpers.
- `frontend/src/api/admin.api.js` - admin API helpers.
- `frontend/src/api/ai.api.js` - AI guide and AI chat requests.

### Pages and their styling files
- `frontend/src/pages/Home.jsx` - dashboard home page.
- `frontend/src/pages/Home.module.css` - home page styles.
- `frontend/src/pages/Login.jsx` - login page.
- `frontend/src/pages/Register.jsx` - register page.
- `frontend/src/pages/AuthPage.module.css` - shared auth page styling.
- `frontend/src/pages/AuthMarquee.jsx` - animated auth background text.
- `frontend/src/pages/MoodPage.jsx` - mood page.
- `frontend/src/pages/MoodPage.module.css` - mood page styles.
- `frontend/src/pages/ExpenseTrackerPage.jsx` - expense tracker page.
- `frontend/src/pages/ExpenseTrackerPage.module.css` - expense tracker styles.
- `frontend/src/pages/TasksPage.jsx` - tasks page.
- `frontend/src/pages/TasksPage.module.css` - tasks page styles.
- `frontend/src/pages/PomodoroPage.jsx` - pomodoro timer page.
- `frontend/src/pages/PomodoroPage.module.css` - pomodoro styles.
- `frontend/src/pages/ChallengesPage.jsx` - challenge page.
- `frontend/src/pages/ChallengesPage.module.css` - challenge styles.
- `frontend/src/pages/AvatarShop.jsx` - avatar shop page.
- `frontend/src/pages/AvatarShop.module.css` - avatar shop styles.
- `frontend/src/pages/AdminUsersPage.jsx` - admin users page.
- `frontend/src/pages/AdminUsersPage.module.css` - admin users styles.
- `frontend/src/pages/GroupsPage.jsx` - groups page.
- `frontend/src/pages/CalendarPage.jsx` - calendar and weekly review navigation page.
- `frontend/src/pages/CalendarPage.module.css` - calendar styles.
- `frontend/src/pages/WeeklyReviewPage.jsx` - weekly review page.
- `frontend/src/pages/WeeklyReviewPage.module.css` - weekly review styles.

### Components and companion styles
- `frontend/src/components/Navbar.jsx` - main navigation bar.
- `frontend/src/components/HomeSidebar.jsx` - left home sidebar navigation.
- `frontend/src/components/HomeSidebar.module.css` - sidebar styles.
- `frontend/src/components/UpcomingTasksSidebar.jsx` - home task summary panel.
- `frontend/src/components/UpcomingTasksSidebar.module.css` - task panel styles.
- `frontend/src/components/AiChatLauncher.jsx` - floating AI chat launcher and chat drawer.
- `frontend/src/components/AiChatLauncher.module.css` - AI launcher and chat styling.
- `frontend/src/components/AiGuide.jsx` - AI guidance card component.
- `frontend/src/components/AiGuide.module.css` - AI guide styles.
- `frontend/src/components/Badge.jsx` - badge display.
- `frontend/src/components/Badge.module.css` - badge styling.
- `frontend/src/components/CreateGroup.jsx` - create group UI.
- `frontend/src/components/DiscoveryTab.jsx` - discovery tab for groups.
- `frontend/src/components/GroupList.jsx` - group list component.
- `frontend/src/components/GroupTaskManager.jsx` - group task management UI.
- `frontend/src/components/HabitStreakGrid.jsx` - streak grid visualizer.
- `frontend/src/components/HabitStreakGrid.module.css` - streak grid styles.
- `frontend/src/components/JoinGroup.jsx` - join group UI.
- `frontend/src/components/MoodHexPicker.jsx` - hex-style mood picker.
- `frontend/src/components/MoodHexPicker.module.css` - hex picker styles.
- `frontend/src/components/MoodPicker.jsx` - mood picker component.
- `frontend/src/components/MoodPicker.module.css` - mood picker styles.
- `frontend/src/components/MyGroupsList.jsx` - user groups list.
- `frontend/src/components/NotificationPanel.jsx` - notifications panel.
- `frontend/src/components/NotificationPanel.module.css` - notification panel styles.
- `frontend/src/components/ToastStack.jsx` - toast stack for transient messages.
- `frontend/src/components/TodoList.jsx` - todo list component.
- `frontend/src/components/TodoList.module.css` - todo list styles.

### Additional utilities and constants
- `frontend/src/constants/moods.js` - mood constants and labels.
- `frontend/src/utils/pressure.js` - pressure-related helper logic for calendar/task signals.
- `frontend/src/assets/` - static asset folder for images, icons, or media.

## Short Conclusion
The backend follows an MVC-like separation with models, controllers, and routes, while the frontend is component-based React code. If you need a strict MVC label for the whole project, the safest description is: backend is MVC-inspired, frontend is not MVC.
