const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://disaster-preparedness-phi.vercel.app',
    'https://gemini-api-tester-react-v4.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Ensure data directory exists
const dataDir = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data')  // Use current working directory
  : path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory at:', dataDir);
  } catch (error) {
    console.error('Error creating data directory:', error);
    // Fallback to using the current directory
    const fallbackDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    console.log('Using fallback data directory at:', fallbackDir);
  }
}

// Create or open SQLite database
const dbPath = path.join(dataDir, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        totalGames INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        registerDate TEXT,
        lastLogin TEXT,
        winStreak INTEGER DEFAULT 0
      )
    `);

    // Achievements table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL
      )
    `);

    // User achievements table (many-to-many relationship)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        date_awarded TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements (name),
        UNIQUE(user_id, achievement_id)
      )
    `);

    // Words table to track used words
    db.run(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        hint TEXT,
        date_used TEXT NOT NULL
      )
    `);

    // User words table to track which words a user has played
    db.run(`
      CREATE TABLE IF NOT EXISTS user_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        guessed_correctly BOOLEAN,
        date_played TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
      )
    `);

    // User settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        dark_mode BOOLEAN DEFAULT 0,
        sound_enabled BOOLEAN DEFAULT 1,
        music_enabled BOOLEAN DEFAULT 1,
        music_track INTEGER DEFAULT 1,
        difficulty TEXT DEFAULT 'medium',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // User questions history table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Insert default achievements if they don't exist
    const defaultAchievements = [
      { name: 'first_win', title: 'First Victory', description: 'Win your first game', icon: '🏆' },
      { name: 'perfect_game', title: 'Perfect Game', description: 'Win a game without any wrong guesses', icon: '⭐' },
      { name: 'streak_3', title: 'Winning Streak', description: 'Win 3 games in a row', icon: '🔥' },
      { name: 'hint_master', title: 'Hint Master', description: 'Use both types of hints in a single game', icon: '💡' },
      { name: 'hard_mode', title: 'Challenge Accepted', description: 'Win a game on hard difficulty', icon: '🔨' }
    ];

    // Check if achievements already exist
    db.get('SELECT COUNT(*) as count FROM achievements', (err, row) => {
      if (err) {
        console.error('Error checking achievements:', err.message);
      } else if (row.count === 0) {
        // Insert default achievements
        const stmt = db.prepare('INSERT INTO achievements (name, title, description, icon) VALUES (?, ?, ?, ?)');
        defaultAchievements.forEach(achievement => {
          stmt.run(achievement.name, achievement.title, achievement.description, achievement.icon);
        });
        stmt.finalize();
        console.log('Default achievements added.');
      }
    });
  });
}

// API Routes

// Simple ping endpoint to test connection
app.get('/api/ping', (req, res) => {
  console.log('Ping received from:', req.ip);
  res.json({ success: true, message: 'Server is up and running', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Registration attempt for user: ${username}`);
    
    if (!username || !password) {
      console.log('Registration failed: Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error during registration:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (user) {
        console.log(`Registration failed: Username ${username} already exists`);
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      // Hash password
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`Password hashed successfully for user: ${username}`);
        
        const registerDate = new Date().toISOString();
        
        // Create new user
        db.run(
          'INSERT INTO users (username, password, score, totalGames, wins, registerDate, lastLogin) VALUES (?, ?, 0, 0, 0, ?, ?)',
          [username, hashedPassword, registerDate, registerDate],
          function(err) {
            if (err) {
              console.error('Failed to create user:', err);
              return res.status(500).json({ error: 'Failed to create user' });
            }
            
            const userId = this.lastID;
            console.log(`User created with ID: ${userId}`);
            
            // Create default user settings
            db.run(
              'INSERT INTO user_settings (user_id, dark_mode, sound_enabled, music_enabled, difficulty) VALUES (?, 0, 1, 1, "medium")',
              [userId],
              function(err) {
                if (err) {
                  console.error('Error creating user settings:', err);
                }
                
                console.log(`User settings created for user: ${username}`);
                
                // Return success with user info
                return res.status(201).json({
                  id: userId,
                  username,
                  score: 0,
                  totalGames: 0,
                  wins: 0,
                  registerDate
                });
              }
            );
          }
        );
      } catch (bcryptError) {
        console.error('Bcrypt error during password hashing:', bcryptError);
        return res.status(500).json({ error: 'Error hashing password' });
      }
    });
    
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt for user: ${username}`);
    
    if (!username || !password) {
      console.log('Login failed: Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        console.log(`Login failed: User ${username} not found`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      console.log(`User found: ${user.username}, attempting password verification`);
      
      // Compare password
      try {
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          console.log(`Login failed: Invalid password for user ${username}`);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log(`Login successful for user: ${username}`);
        
        // Update last login
        const lastLogin = new Date().toISOString();
        db.run('UPDATE users SET lastLogin = ? WHERE id = ?', [lastLogin, user.id]);
        
        // Get user settings
        db.get('SELECT * FROM user_settings WHERE user_id = ?', [user.id], (err, settings) => {
          if (err) {
            console.error('Error fetching user settings:', err);
          }
          
          // Return user data
          res.json({
            id: user.id,
            username: user.username,
            score: user.score,
            totalGames: user.totalGames,
            wins: user.wins,
            registerDate: user.registerDate,
            lastLogin,
            winStreak: user.winStreak,
            settings: settings || {
              dark_mode: false,
              sound_enabled: true,
              music_enabled: true,
              music_track: 1,
              difficulty: 'medium'
            }
          });
        });
      } catch (bcryptError) {
        console.error('Bcrypt error during password comparison:', bcryptError);
        return res.status(500).json({ error: 'Error verifying password' });
      }
    });
    
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  db.get('SELECT id, username, score, totalGames, wins, registerDate, lastLogin, winStreak FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Update user score
app.put('/api/users/:id/score', (req, res) => {
  const userId = req.params.id;
  const { score, totalGames, wins, winStreak } = req.body;
  
  db.run(
    'UPDATE users SET score = ?, totalGames = ?, wins = ?, winStreak = ? WHERE id = ?',
    [score, totalGames, wins, winStreak, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ success: true, message: 'User stats updated' });
    }
  );
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT id, username, score, wins FROM users ORDER BY score DESC LIMIT 10', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(users);
  });
});

// Save user settings
app.put('/api/users/:id/settings', (req, res) => {
  const userId = req.params.id;
  const { dark_mode, sound_enabled, music_enabled, difficulty } = req.body;
  
  db.run(
    'UPDATE user_settings SET dark_mode = ?, sound_enabled = ?, music_enabled = ?, difficulty = ? WHERE user_id = ?',
    [dark_mode ? 1 : 0, sound_enabled ? 1 : 0, music_enabled ? 1 : 0, difficulty, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        // Settings don't exist, create them
        db.run(
          'INSERT INTO user_settings (user_id, dark_mode, sound_enabled, music_enabled, difficulty) VALUES (?, ?, ?, ?, ?)',
          [userId, dark_mode ? 1 : 0, sound_enabled ? 1 : 0, music_enabled ? 1 : 0, difficulty],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create settings' });
            }
            
            res.json({ success: true, message: 'Settings created' });
          }
        );
      } else {
        res.json({ success: true, message: 'Settings updated' });
      }
    }
  );
});

// Get user achievements
app.get('/api/users/:id/achievements', (req, res) => {
  const userId = req.params.id;
  
  db.all(`
    SELECT a.name, a.title, a.description, a.icon, ua.date_awarded
    FROM achievements a
    JOIN user_achievements ua ON a.name = ua.achievement_id
    WHERE ua.user_id = ?
  `, [userId], (err, achievements) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(achievements);
  });
});

// Award achievement to user
app.post('/api/users/:id/achievements', (req, res) => {
  const userId = req.params.id;
  const { achievementId } = req.body;
  const dateAwarded = new Date().toISOString();
  
  // Check if user already has this achievement
  db.get(
    'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
    [userId, achievementId],
    (err, existingAchievement) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingAchievement) {
        return res.status(409).json({ error: 'Achievement already awarded to user' });
      }
      
      // Award achievement
      db.run(
        'INSERT INTO user_achievements (user_id, achievement_id, date_awarded) VALUES (?, ?, ?)',
        [userId, achievementId, dateAwarded],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to award achievement' });
          }
          
          // Get achievement details
          db.get('SELECT * FROM achievements WHERE name = ?', [achievementId], (err, achievement) => {
            if (err || !achievement) {
              return res.status(500).json({ error: 'Failed to get achievement details' });
            }
            
            res.status(201).json({
              id: this.lastID,
              user_id: userId,
              achievement_id: achievementId,
              date_awarded: dateAwarded,
              achievement
            });
          });
        }
      );
    }
  );
});

// Save used word
app.post('/api/words', (req, res) => {
  const { word, hint } = req.body;
  const dateUsed = new Date().toISOString();
  
  // Check if word already exists
  db.get('SELECT * FROM words WHERE word = ?', [word], (err, existingWord) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingWord) {
      return res.json(existingWord); // Return existing word
    }
    
    // Save new word
    db.run(
      'INSERT INTO words (word, hint, date_used) VALUES (?, ?, ?)',
      [word, hint, dateUsed],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to save word' });
        }
        
        res.status(201).json({
          id: this.lastID,
          word,
          hint,
          date_used: dateUsed
        });
      }
    );
  });
});

// Get used words
app.get('/api/words', (req, res) => {
  db.all('SELECT * FROM words ORDER BY date_used DESC', (err, words) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(words);
  });
});

// Get word history for a specific user
app.get('/api/users/:id/words/history', (req, res) => {
  const userId = req.params.id;
  
  db.all(`
    SELECT w.id, w.word, w.hint, w.date_used, uw.guessed_correctly, uw.date_played
    FROM words w
    JOIN user_words uw ON w.id = uw.word_id
    WHERE uw.user_id = ?
    ORDER BY uw.date_played DESC
  `, [userId], (err, words) => {
    if (err) {
      console.error('Error fetching user word history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(words);
  });
});

// Record user word play
app.post('/api/users/:id/words', (req, res) => {
  const userId = req.params.id;
  const { wordId, guessedCorrectly } = req.body;
  const datePlayed = new Date().toISOString();
  
  db.run(
    'INSERT INTO user_words (user_id, word_id, guessed_correctly, date_played) VALUES (?, ?, ?, ?)',
    [userId, wordId, guessedCorrectly ? 1 : 0, datePlayed],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to record word play' });
      }
      
      res.status(201).json({
        id: this.lastID,
        user_id: userId,
        word_id: wordId,
        guessed_correctly: guessedCorrectly,
        date_played: datePlayed
      });
    }
  );
});

// Clear word history for everyone
app.delete('/api/words', (req, res) => {
  db.run('DELETE FROM words', function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear word history' });
    }
    
    // Also clear user_words since they reference words
    db.run('DELETE FROM user_words', function(err) {
      if (err) {
        console.error('Failed to clear user words:', err);
      }
      
      res.json({ success: true, message: 'Word history cleared' });
    });
  });
});

// Save user question
app.post('/api/users/:id/questions', (req, res) => {
  const userId = req.params.id;
  const { question, response, timestamp } = req.body;
  
  if (!question || !response) {
    return res.status(400).json({ error: 'Question and response are required' });
  }
  
  const questionTimestamp = timestamp || new Date().toISOString();
  
  db.run(
    'INSERT INTO user_questions (user_id, question, response, timestamp) VALUES (?, ?, ?, ?)',
    [userId, question, response, questionTimestamp],
    function(err) {
      if (err) {
        console.error('Error saving question:', err);
        return res.status(500).json({ error: 'Failed to save question' });
      }
      
      res.status(201).json({
        id: this.lastID,
        user_id: userId,
        question,
        response,
        timestamp: questionTimestamp
      });
    }
  );
});

// Get question history for a user
app.get('/api/users/:id/questions', (req, res) => {
  const userId = req.params.id;
  
  db.all(
    'SELECT * FROM user_questions WHERE user_id = ? ORDER BY timestamp DESC',
    [userId],
    (err, questions) => {
      if (err) {
        console.error('Error fetching question history:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(questions);
    }
  );
});

// Clear question history for a user
app.delete('/api/users/:id/questions', (req, res) => {
  const userId = req.params.id;
  
  db.run(
    'DELETE FROM user_questions WHERE user_id = ?',
    [userId],
    function(err) {
      if (err) {
        console.error('Error clearing question history:', err);
        return res.status(500).json({ error: 'Failed to clear question history' });
      }
      
      res.json({ 
        success: true, 
        message: 'Question history cleared',
        count: this.changes
      });
    }
  );
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accessible at: http://localhost:${port}`);
  console.log(`And at: http://YOUR_IP:${port}`);
});

// Handle shutdown and close database connection
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});

module.exports = app; 