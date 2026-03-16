# Level Up Your Life

## Overview
CSE470 - Software Engineering course project created using MERN stack.


## Setup
### Install these first
1. **Node.js**: https://nodejs.org/en
2. **MongoDB**: Create an account at MongoDB. You should have received an invite to our MongoDB project.
3. **VsCode**: Preferred.

### Clone the repository
From the terminal do
```
git clone https://github.com/Arman-Ferdous/level-up-your-life.git
```
Then open the "level-up-your-life" folder in VsCode.

### Install Dependencies
From the terminal,
```
cd backend
npm install

cd ../frontend
npm install
```

### Environment Variables
I'll provide you with a file named ".env". Put this in the same location as ".env.example". It should be located in the backend folder and never shared publicly.

Optional admin bootstrap values (in `backend/.env`) to create/promote an admin account automatically when backend starts:
```
ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password-here
```


## Running the Project
Open two terminals from VsCode.
1. Terminal A: Runs the backend server.
   ```
   cd backend
   npm run dev
   ```
   Now you can open `http://localhost:5001/health` and see `{ ok : true }`

2. Terminal B: Runs the frontend server.
  ```
  cd frontend
  npm run dev
  ```
  Now you can open `http://localhost:5173` to access the homepage.


## Final notes
Please create your own branch whenever creating a new feature, and only push to that branch. After pushing into your own branch make a pull request. It is best to know what you are doing before merging into main.

## Admin Features
- Admin users can open `/admin/users` in the frontend.
- Admin can view all registered users.
- Admin can delete any user account except their own account.
