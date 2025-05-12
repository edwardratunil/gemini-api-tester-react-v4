# Gemini API Tester React with SQLite

This application is a word guessing game focused on disaster preparedness topics. It uses Google's Gemini API to generate words and hints for the game.

## Features

- User authentication system
- Word guessing game with different difficulty levels
- Leaderboard to track high scores
- Achievement system
- SQLite database for persistent storage
- Sound effects and background music

## Project Structure

The project consists of two main parts:

1. **Frontend**: React application
2. **Backend**: Express server with SQLite database

## Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd gemini-api-tester-react
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
cd ..
```

### 4. Configure environment variables

Create a `.env` file in the root directory with your Gemini API key:

```bash
REACT_APP_API_URL=http://localhost:5001/api
```

Create a `.env` file in the server directory:

```bash
PORT=5001
```

### 5. Start the backend server

```bash
cd server
npm run dev
```

The server will start on port 5001 and create a SQLite database file called `database.sqlite` in the server directory.

### 6. Start the frontend application

In a new terminal:

```bash
npm start
```

The application will start on port 3000 and open in your default browser.

## Database Schema

The SQLite database includes the following tables:

- **users**: Stores user account information and game statistics
- **achievements**: Stores achievement definitions
- **user_achievements**: Tracks which achievements each user has earned
- **words**: Stores words used in the game
- **user_words**: Tracks which words each user has played
- **user_settings**: Stores user preferences like dark mode, sound settings, etc.

## API Endpoints

### Authentication
- `POST /api/register`: Register a new user
- `POST /api/login`: Login an existing user

### User Management
- `GET /api/users/:id`: Get user profile
- `PUT /api/users/:id/score`: Update user score
- `PUT /api/users/:id/settings`: Save user settings

### Leaderboard
- `GET /api/leaderboard`: Get top 10 users by score

### Achievements
- `GET /api/users/:id/achievements`: Get user achievements
- `POST /api/users/:id/achievements`: Award achievement to user

### Words
- `GET /api/words`: Get used words
- `POST /api/words`: Save a used word
- `DELETE /api/words`: Clear word history
- `POST /api/users/:id/words`: Record word play for a user

## License

MIT

## Acknowledgments

- Google Gemini API for word generation
- React for the frontend framework
- Express and SQLite for the backend
