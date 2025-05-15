const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { pool } = require('./config/database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins temporarily for debugging
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Add debug logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database');
    return true;
  } catch (err) {
    console.error('Error connecting to the database:', err);
    // Don't exit the process, just log the error
    return false;
  }
};

// Test the connection
testDatabaseConnection();

// Initialize database
const initializeDatabase = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempting database initialization (attempt ${retryCount + 1}/${maxRetries})...`);
      
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      const statements = schema
        .split(';')
        .filter(statement => statement.trim())
        .map(statement => statement + ';');

      for (const statement of statements) {
        try {
          await pool.query(statement);
          console.log('Executed:', statement.split('\n')[0] + '...');
        } catch (err) {
          // If the error is about table already existing or duplicate key, we can ignore it
          if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
            console.log('Table or data already exists, skipping...');
            continue;
          }
          console.error('Error executing statement:', err.message);
          throw err;
        }
      }
      console.log('Database initialization completed successfully!');
      return true;
    } catch (error) {
      retryCount++;
      console.error(`Error initializing database (attempt ${retryCount}/${maxRetries}):`, error);
      if (retryCount === maxRetries) {
        console.error('Failed to initialize database after', maxRetries, 'attempts');
        return false;
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
};

// Test database connection and initialize
const startServer = async () => {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database');
    
    // Initialize database tables
    console.log('Initializing database tables...');
    const initSuccess = await initializeDatabase();
    if (!initSuccess) {
      console.error('Database initialization failed, but continuing server startup...');
    }
    
    // Start the server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Accessible at: http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error during server startup:', err);
    // Don't exit the process, just log the error
  }
};

// Start the server
startServer();

// API Routes

// Simple ping endpoint to test connection
app.get('/api/ping', (req, res) => {
  console.log('Ping received from:', req.ip);
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
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
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    pool.query(query, values, async (err, result) => {
      if (err) {
        console.error('Database error during registration:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.rows.length > 0) {
        console.log(`Registration failed: Username ${username} already exists`);
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      // Hash password
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`Password hashed successfully for user: ${username}`);
        
        const registerDate = new Date().toISOString();
        
        // Create new user
        const insertQuery = 'INSERT INTO users (username, password, score, total_games, wins, register_date, last_login) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
        const insertValues = [username, hashedPassword, 0, 0, 0, registerDate, registerDate];
        pool.query(insertQuery, insertValues, async (err, result) => {
          if (err) {
            console.error('Failed to create user:', err);
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          const userId = result.rows[0].id;
          console.log(`User created with ID: ${userId}`);
          
          // Create default user settings
          const settingsInsertQuery = 'INSERT INTO user_settings (user_id, dark_mode, sound_enabled, music_enabled, difficulty) VALUES ($1, $2, $3, $4, $5)';
          const settingsValues = [userId, false, true, true, 'medium'];
          pool.query(settingsInsertQuery, settingsValues, function(err, result) {
            if (err) {
              console.error('Error creating user settings:', err);
            }
            
            console.log(`User settings created for user: ${username}`);
            
            // Return success with user info
            return res.status(201).json({
              id: userId,
              username,
              score: 0,
              total_games: 0,
              wins: 0,
              register_date: registerDate
            });
          });
        });
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
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    
    pool.query(query, values, async (err, result) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.rows.length === 0) {
        console.log(`Login failed: User ${username} not found`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      const user = result.rows[0];
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
        const currentTime = new Date().toISOString();
        const updateQuery = 'UPDATE users SET last_login = $1 WHERE id = $2';
        const updateValues = [currentTime, user.id];
        
        pool.query(updateQuery, updateValues, function(err, updateResult) {
          if (err) {
            console.error('Error updating last login:', err);
            // Don't return error, continue with login
          }
          
          // Get user settings
          const settingsQuery = 'SELECT * FROM user_settings WHERE user_id = $1';
          const settingsValues = [user.id];
          
          pool.query(settingsQuery, settingsValues, (err, settingsResult) => {
            if (err) {
              console.error('Error fetching user settings:', err);
              // Don't return error, use default settings
            }
            
            // Return user data
            res.json({
              id: user.id,
              username: user.username,
              score: user.score,
              total_games: user.total_games,
              wins: user.wins,
              register_date: user.register_date,
              last_login: currentTime,
              win_streak: user.win_streak,
              settings: settingsResult?.rows?.[0] || {
                dark_mode: false,
                sound_enabled: true,
                music_enabled: true,
                music_track: 1,
                difficulty: 'medium'
              }
            });
          });
        });
      } catch (bcryptError) {
        console.error('Bcrypt error during password comparison:', bcryptError);
        return res.status(500).json({ error: 'Error verifying password', details: bcryptError.message });
      }
    });
    
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  const query = 'SELECT id, username, score, total_games, wins, register_date, last_login, winStreak FROM users WHERE id = $1';
  const values = [userId];
  pool.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  });
});

// Update user score
app.put('/api/users/:id/score', (req, res) => {
  const userId = req.params.id;
  const { score, total_games, wins, winStreak } = req.body;
  
  console.log('Updating score for user:', userId, { score, total_games, wins, winStreak });
  
  const query = 'UPDATE users SET score = $1, total_games = $2, wins = $3, win_streak = $4 WHERE id = $5';
  const values = [score, total_games, wins, winStreak, userId];
  
  pool.query(query, values, function(err, result) {
    if (err) {
      console.error('Database error updating score:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User stats updated' });
  });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  console.log('Leaderboard request received');
  const query = 'SELECT id, username, score, wins FROM users ORDER BY score DESC LIMIT 10';
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Database error fetching leaderboard:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('Leaderboard data sent:', result.rows.length, 'users');
    res.json(result.rows);
  });
});

// Save user settings
app.put('/api/users/:id/settings', (req, res) => {
  const userId = req.params.id;
  const { dark_mode, sound_enabled, music_enabled, difficulty } = req.body;
  
  const query = 'UPDATE user_settings SET dark_mode = $1, sound_enabled = $2, music_enabled = $3, difficulty = $4 WHERE user_id = $5';
  const values = [dark_mode ? 1 : 0, sound_enabled ? 1 : 0, music_enabled ? 1 : 0, difficulty, userId];
  pool.query(query, values, function(err, result) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.rowCount === 0) {
      // Settings don't exist, create them
      const insertQuery = 'INSERT INTO user_settings (user_id, dark_mode, sound_enabled, music_enabled, difficulty) VALUES ($1, $2, $3, $4, $5)';
      const insertValues = [userId, dark_mode ? 1 : 0, sound_enabled ? 1 : 0, music_enabled ? 1 : 0, difficulty];
      pool.query(insertQuery, insertValues, function(err, insertResult) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create settings' });
        }
        
        res.json({ success: true, message: 'Settings created' });
      });
    } else {
      res.json({ success: true, message: 'Settings updated' });
    }
  });
});

// Get user achievements
app.get('/api/users/:id/achievements', (req, res) => {
  const userId = req.params.id;
  
  const query = `
    SELECT a.name, a.title, a.description, a.icon, ua.date_awarded
    FROM achievements a
    JOIN user_achievements ua ON a.name = ua.achievement_id
    WHERE ua.user_id = $1
  `;
  const values = [userId];
  pool.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(result.rows);
  });
});

// Award achievement to user
app.post('/api/users/:id/achievements', (req, res) => {
  const userId = req.params.id;
  const { achievementId } = req.body;
  const dateAwarded = new Date().toISOString();
  
  console.log('Awarding achievement:', { userId, achievementId, dateAwarded });
  
  // Check if user already has this achievement
  const query = 'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2';
  const values = [userId, achievementId];
  
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error checking achievement:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.rows.length > 0) {
      return res.status(409).json({ error: 'Achievement already awarded to user' });
    }
    
    // Award achievement
    const insertQuery = 'INSERT INTO user_achievements (user_id, achievement_id, date_awarded) VALUES ($1, $2, $3) RETURNING id';
    const insertValues = [userId, achievementId, dateAwarded];
    
    pool.query(insertQuery, insertValues, function(err, insertResult) {
      if (err) {
        console.error('Database error awarding achievement:', err);
        return res.status(500).json({ error: 'Failed to award achievement', details: err.message });
      }
      
      if (!insertResult.rows || insertResult.rows.length === 0) {
        console.error('No rows returned from achievement insert');
        return res.status(500).json({ error: 'Failed to award achievement - no rows returned' });
      }
      
      // Get achievement details
      const getAchievementQuery = 'SELECT * FROM achievements WHERE name = $1';
      const getAchievementValues = [achievementId];
      
      pool.query(getAchievementQuery, getAchievementValues, (err, achievementResult) => {
        if (err) {
          console.error('Database error getting achievement details:', err);
          return res.status(500).json({ error: 'Failed to get achievement details', details: err.message });
        }
        
        if (!achievementResult.rows || achievementResult.rows.length === 0) {
          console.error('Achievement not found:', achievementId);
          return res.status(404).json({ error: 'Achievement not found' });
        }
        
        res.status(201).json({
          id: insertResult.rows[0].id,
          user_id: userId,
          achievement_id: achievementId,
          date_awarded: dateAwarded,
          achievement: achievementResult.rows[0]
        });
      });
    });
  });
});

// Save used word
app.post('/api/words', (req, res) => {
  const { word, hint } = req.body;
  const dateUsed = new Date().toISOString();
  
  // Check if word already exists
  const query = 'SELECT * FROM words WHERE word = $1';
  const values = [word];
  pool.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.rows.length > 0) {
      return res.json(result.rows[0]); // Return existing word
    }
    
    // Save new word
    const insertQuery = 'INSERT INTO words (word, hint, date_used) VALUES ($1, $2, $3) RETURNING id';
    const insertValues = [word, hint, dateUsed];
    pool.query(insertQuery, insertValues, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save word' });
      }
      
      res.status(201).json({
        id: result.rows[0].id,
        word,
        hint,
        date_used: dateUsed
      });
    });
  });
});

// Get used words
app.get('/api/words', (req, res) => {
  const query = 'SELECT * FROM words ORDER BY date_used DESC';
  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(result.rows);
  });
});

// Get word history for a specific user
app.get('/api/users/:id/words/history', (req, res) => {
  const userId = req.params.id;
  
  const query = `
    SELECT w.id, w.word, w.hint, w.date_used, uw.guessed_correctly, uw.date_played
    FROM words w
    JOIN user_words uw ON w.id = uw.word_id
    WHERE uw.user_id = $1
    ORDER BY uw.date_played DESC
  `;
  const values = [userId];
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error fetching user word history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(result.rows);
  });
});

// Record user word play
app.post('/api/users/:id/words', (req, res) => {
  const userId = req.params.id;
  const { wordId, guessedCorrectly } = req.body;
  const datePlayed = new Date().toISOString();
  
  const query = 'INSERT INTO user_words (user_id, word_id, guessed_correctly, date_played) VALUES ($1, $2, $3, $4) RETURNING id';
  const values = [userId, wordId, guessedCorrectly ? 1 : 0, datePlayed];
  pool.query(query, values, function(err, result) {
    if (err) {
      return res.status(500).json({ error: 'Failed to record word play' });
    }
    
    res.status(201).json({
      id: result.rows[0].id,
      user_id: userId,
      word_id: wordId,
      guessed_correctly: guessedCorrectly,
      date_played: datePlayed
    });
  });
});

// Clear word history for everyone
app.delete('/api/words', (req, res) => {
  const query = 'DELETE FROM words';
  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear word history' });
    }
    
    // Also clear user_words since they reference words
    const userWordsQuery = 'DELETE FROM user_words';
    pool.query(userWordsQuery, (err) => {
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
  
  const query = 'INSERT INTO user_questions (user_id, question, response, timestamp) VALUES ($1, $2, $3, $4) RETURNING id';
  const values = [userId, question, response, questionTimestamp];
  pool.query(query, values, function(err, result) {
    if (err) {
      console.error('Error saving question:', err);
      return res.status(500).json({ error: 'Failed to save question' });
    }
    
    res.status(201).json({
      id: result.rows[0].id,
      user_id: userId,
      question,
      response,
      timestamp: questionTimestamp
    });
  });
});

// Get question history for a user
app.get('/api/users/:id/questions', (req, res) => {
  const userId = req.params.id;
  
  const query = 'SELECT * FROM user_questions WHERE user_id = $1 ORDER BY timestamp DESC';
  const values = [userId];
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error fetching question history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(result.rows);
  });
});

// Clear question history for a user
app.delete('/api/users/:id/questions', (req, res) => {
  const userId = req.params.id;
  
  const query = 'DELETE FROM user_questions WHERE user_id = $1';
  const values = [userId];
  pool.query(query, values, function(err, result) {
    if (err) {
      console.error('Error clearing question history:', err);
      return res.status(500).json({ error: 'Failed to clear question history' });
    }
    
    res.json({ 
      success: true, 
      message: 'Question history cleared',
      count: result.rowCount
    });
  });
});

// Add CORS test endpoint
app.options('/api/cors-test', cors());
app.get('/api/cors-test', cors(), (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      allowed: true
    }
  });
});

// Handle shutdown and close database connection
process.on('SIGINT', () => {
  pool.end((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app; 