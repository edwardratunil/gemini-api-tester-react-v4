-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    register_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    win_streak INTEGER DEFAULT 0
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(255) REFERENCES achievements(name),
    date_awarded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Words table
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    hint TEXT,
    date_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User words table
CREATE TABLE IF NOT EXISTS user_words (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    guessed_correctly BOOLEAN,
    date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dark_mode BOOLEAN DEFAULT FALSE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    music_enabled BOOLEAN DEFAULT TRUE,
    music_track INTEGER DEFAULT 1,
    difficulty VARCHAR(50) DEFAULT 'medium'
);

-- User questions history table
CREATE TABLE IF NOT EXISTS user_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default achievements
INSERT INTO achievements (name, title, description, icon)
VALUES 
    ('first_win', 'First Victory', 'Win your first game', '🏆'),
    ('perfect_game', 'Perfect Game', 'Win a game without any wrong guesses', '⭐'),
    ('streak_3', 'Winning Streak', 'Win 3 games in a row', '🔥'),
    ('hint_master', 'Hint Master', 'Use both types of hints in a single game', '💡'),
    ('hard_mode', 'Challenge Accepted', 'Win a game on hard difficulty', '🔨')
ON CONFLICT (name) DO NOTHING; 