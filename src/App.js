import React, { useState, useEffect } from 'react';
import './App.css';

// Import API services
import * as apiService from './services/api';
import useApi from './hooks/useApi';

function App() {
  // Hardcoded API key
  const [apiKey] = useState("AIzaSyBVjnegwnKaMYA3qrQD5fZaLqPEepHI6SA");
  
  // API state hooks
  const loginApi = useApi(apiService.login);
  const registerApi = useApi(apiService.register);
  const updateScoreApi = useApi(apiService.updateUserScore);
  const getLeaderboardApi = useApi(apiService.getLeaderboard);
  const saveSettingsApi = useApi(apiService.saveUserSettings);
  const getAchievementsApi = useApi(apiService.getUserAchievements);
  const awardAchievementApi = useApi(apiService.awardAchievement);
  const saveWordApi = useApi(apiService.saveWord);
  const getUsedWordsApi = useApi(apiService.getUsedWords);
  const recordWordPlayApi = useApi(apiService.recordWordPlay);
  const clearWordHistoryApi = useApi(apiService.clearWordHistory);
  const saveQuestionApi = useApi(apiService.saveUserQuestion);
  const getQuestionsApi = useApi(apiService.getUserQuestions);
  const clearQuestionsApi = useApi(apiService.clearQuestionHistory);
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // State hooks
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  // Game states
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [usedHints, setUsedHints] = useState([]);
  const [revealedLetters, setRevealedLetters] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState(60); // Default 60 seconds
  const [timerActive, setTimerActive] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [gameTimeElapsed, setGameTimeElapsed] = useState(0); // Track elapsed time for achievements
  const [difficultyTimers] = useState({
    'easy': 90,   // 1:30
    'medium': 60, // 1:00
    'hard': 45    // 0:45
  });
  
  // Maximum number of wrong guesses allowed based on difficulty
  const MAX_WRONG_GUESSES_MAP = {
    easy: 8,
    medium: 6,
    hard: 4
  };
  
  // Points per win based on difficulty
  const POINTS_MAP = {
    easy: 1,
    medium: 3,
    hard: 5
  };
  
  // Get current max wrong guesses
  const MAX_WRONG_GUESSES = MAX_WRONG_GUESSES_MAP[difficulty];
  
  // Available letters for keyboard
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  
  // Array of disaster topics to randomly cycle through
  const disasterTopics = [
    'General Disaster Preparedness',
    'Earthquake Safety',
    'Flood Response',
    'Hurricane/Typhoon Preparedness',
    'Fire Safety',
    'Tsunami Awareness',
    'Drought Management',
    'Pandemic Preparedness',
    'First Aid and Medical Emergency',
    'Emergency Communication',
    'Evacuation Planning',
    'Emergency Supplies'
  ];

  // Add this new state
  const [selectedTopic, setSelectedTopic] = useState('random');
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  // Add new state for hints
  const [availableHints, setAvailableHints] = useState(0);
  
  // Cost of each hint type
  const HINT_COSTS = {
    REVEAL_LETTER: 3,
    ELIMINATE_OPTIONS: 2
  };

  // Add new state for sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Add new state for educational content
  const [factContent, setFactContent] = useState('');
  const [showFactModal, setShowFactModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Add state to track which history item is being spoken
  const [speakingHistoryIndex, setSpeakingHistoryIndex] = useState(null);

  // Add new state for glossary
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loadingGlossary, setLoadingGlossary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Audio elements for preloading sounds
  const audioElements = {
    correct: null,
    wrong: null,
    win: null,
    lose: null,
    click: null,
    achievement: null,
    hint: null,
    select: null  // Add select sound effect
  };

  // Background music variables
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentMusicTrack, setCurrentMusicTrack] = useState(1);
  const musicVolume = 0.5;
  const musicTracks = [
    { id: 1, name: "Calm Ambience", url: "./audio/calm-ambience.mp3" },
    { id: 2, name: "Focus Mode", url: "./audio/focus-mode.mp3" },
    { id: 3, name: "Upbeat", url: "./audio/upbeat.mp3" },
  ];
  // We'll keep this for backward compatibility
  const BACKGROUND_MUSIC_URL = "./audio/calm-ambience.mp3";
  
  // Question history variables
  const [questionHistory, setQuestionHistory] = useState([]);
  const [showQuestionHistory, setShowQuestionHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Add achievements state
  const [achievements, setAchievements] = useState({});
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Define achievements
  const ACHIEVEMENTS = {
    FIRST_WIN: {
      id: 'first_win',
      title: 'First Victory',
      description: 'Win your first game',
      icon: '🏆'
    },
    PERFECT_GAME: {
      id: 'perfect_game',
      title: 'Perfect Game',
      description: 'Win a game without any wrong guesses',
      icon: '⭐'
    },
    STREAK_3: {
      id: 'streak_3',
      title: 'Winning Streak',
      description: 'Win 3 games in a row',
      icon: '🔥'
    },
    HINT_MASTER: {
      id: 'hint_master',
      title: 'Hint Master',
      description: 'Use both types of hints in a single game',
      icon: '💡'
    },
    HARD_MODE: {
      id: 'hard_mode',
      title: 'Challenge Accepted',
      description: 'Win a game on hard difficulty',
      icon: '🔨'
    }
  };

  // Add a state for login mode
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Add a function to load the leaderboard data
  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await getLeaderboardApi.execute();
      if (leaderboardData && Array.isArray(leaderboardData)) {
        setUsers(leaderboardData);
      }
    } catch (error) {
      console.error("Error loading leaderboard data");
    }
  };

  // Update the loadUserPreferences function to load the leaderboard on startup
  const loadUserPreferences = async () => {
    // Check for stored user data in sessionStorage (temporary storage for current session)
    const storedUser = sessionStorage.getItem('currentUser');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      setScore(parsedUser.score || 0);
      setTotalGames(parsedUser.totalGames || 0);
      setIsLoggedIn(true);
      
      // Load user settings
      const settings = parsedUser.settings || {
        dark_mode: false,
        sound_enabled: true,
        music_enabled: true,
        difficulty: 'medium'
      };
      
      setDarkMode(settings.dark_mode);
      setSoundEnabled(settings.sound_enabled);
      setDifficulty(settings.difficulty);
      
      // Set music preferences
      setMusicEnabled(settings.music_enabled);
      
      // Load saved music track if available
      if (settings.hasOwnProperty('music_track')) {
        setCurrentMusicTrack(settings.music_track);
      } else {
        // If no track is saved, default to track 1 (Calm Ambience)
        setCurrentMusicTrack(1);
      }
      
      if (settings.dark_mode) {
        document.body.classList.add('dark-mode');
      }
      
      // Load user achievements
      try {
        const userAchievements = await apiService.getUserAchievements(parsedUser.id);
        const achievementsMap = {};
        achievementsMap[parsedUser.username] = userAchievements.map(a => a.name);
        setAchievements(achievementsMap);
      } catch (error) {
        console.error("Error loading achievements");
      }
    }
    
    // Load the leaderboard data
    await loadLeaderboard();
    
    // Load words used by this specific user
    if (currentUser && currentUser.id) {
      try {
        const wordsData = await apiService.getUsedWords(currentUser.id);
        setUsedWords(wordsData.map(w => w.word));
      } catch (error) {
        console.error("Error loading user's word history:", error);
        // If there's an error, start with an empty list
        setUsedWords([]);
      }
      
      // Load question history for the user
      try {
        const history = await getQuestionsApi.execute(currentUser.id);
        // Filter history to only include items with educational trivia content
        const triviaHistory = history.filter(item => checkForTrivia(item.response));
        setQuestionHistory(triviaHistory);
      } catch (error) {
        console.error("Error loading question history:", error);
        setQuestionHistory([]);
      }
    }
    // Preload sounds if enabled
    if (soundEnabled) {
      preloadSounds();
    }
    
    // No background music initialization here - only start after login
  };

  // Load preferences and user data on component mount and generate first word
  useEffect(() => {
    loadUserPreferences();
    
    // Cleanup background music on component unmount
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.src = '';
      }
    };
  }, []);

  // Add useEffect to sync current user score with score state
  useEffect(() => {
    if (currentUser) {
      setScore(currentUser.score || 0);
    }
  }, [currentUser]);

  // Save users to localStorage and ensure sorting for leaderboard
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  // Save usedWords to localStorage when it changes
  useEffect(() => {
    if (usedWords.length > 0) {
      localStorage.setItem('usedWords', JSON.stringify(usedWords));
    }
  }, [usedWords]);

  // Save achievements to localStorage when they change
  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Reset game state
  const resetGame = () => {
    setWord('');
    setHint('');
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
    setUsedHints([]);
    setRevealedLetters([]);
    stopTimer();
    setGameTimeElapsed(0);
  };

  // Timer functions
  const startTimer = () => {
    // Clear any existing interval first
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Set timer based on current difficulty
    const initialTime = difficultyTimers[difficulty];
    setTimeRemaining(initialTime);
    setTimerActive(true);
    
    // Set up interval to count down
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
      
      // Track elapsed time for achievements
      setGameTimeElapsed(prev => prev + 1);
    }, 1000);
    
    setTimerInterval(interval);
  };
  
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerActive(false);
  };
  
  const resetTimer = (time = null) => {
    stopTimer();
    const newTime = time || difficultyTimers[difficulty];
    setTimeRemaining(newTime);
  };
  
  const handleTimeUp = () => {
    // Only handle time up if the game is still active
    if (!gameOver) {
      playSound('lose');
      setGameOver(true);
      setWon(false);
      showNotification(`Time's up! The word was "${word}"`, 'error');
      
      // Reset win streak on timeout
      setWinStreak(0);
      
      // Update user stats after loss
      setTimeout(() => {
        updateUserStats(false);
      }, 50);
    }
  };

  // Show temporary notification
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  // Add toggle function for sound
  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('soundEnabled', newSoundState.toString());
    
    if (newSoundState) {
      preloadSounds();
    }
    
    showNotification(`Sound ${newSoundState ? 'enabled' : 'disabled'}`);
    
    // Play a test sound if enabled
    if (newSoundState) {
      setTimeout(() => playSound('click'), 300);
    }
  };

  // Update the play sound function to use preloaded audio elements
  const playSound = (soundType) => {
    if (!soundEnabled) return;
    
    console.log(`Attempting to play sound: ${soundType}`);
    
    try {
      // If audio element exists and is loaded
      if (audioElements[soundType]) {
        // Clone the audio to allow overlapping sounds
        const audioToPlay = audioElements[soundType].cloneNode();
        audioToPlay.volume = 0.5; // 50% volume
        
        const playPromise = audioToPlay.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error(`Error playing sound ${soundType}:`, error);
            // Try fallback
            fallbackPlaySound(soundType);
          });
        }
      } else {
        // Fallback to creating a new audio element
        fallbackPlaySound(soundType);
      }
    } catch (error) {
      console.error(`Error in playSound for ${soundType}:`, error);
      fallbackPlaySound(soundType);
    }
  };

  // Add a fallback method for playing sounds
  const fallbackPlaySound = (soundType) => {
    console.log(`Using fallback for sound: ${soundType}`);
    const audioElement = new Audio();
    
    // Get the soundUrls reference
    const soundUrls = {
      correct: {
        url: "./audio/correct.mp3"
      },
      wrong: {
        url: "./audio/wrong.mp3"
      },
      win: {
        url: "./audio/win.mp3"
      },
      lose: {
        url: "./audio/lose.mp3"
      },
      click: {
        url: "./audio/click.mp3"
      },
      achievement: {
        url: "./audio/win.mp3" // Use win sound for achievements
      },
      hint: {
        url: "./audio/hint.mp3"
      },
      select: {
        url: "./audio/select.mp3" // Add select sound for fallback
      }
    };
    
    if (!soundUrls[soundType]) {
      console.error(`Unknown sound type: ${soundType}`);
      return;
    }

    // Try to load and play the file
    audioElement.src = soundUrls[soundType].url;
    audioElement.volume = 0.5; // 50% volume
    audioElement.play().catch(error => {
      console.error(`Error playing sound ${soundType}:`, error);
    });
  };

  // Add confetti effect
  const showConfetti = () => {
    // Create confetti container if it doesn't exist
    let confettiContainer = document.getElementById('confetti-container');
    
    if (!confettiContainer) {
      confettiContainer = document.createElement('div');
      confettiContainer.id = 'confetti-container';
      document.body.appendChild(confettiContainer);
    }
    
    // Clear previous confetti
    confettiContainer.innerHTML = '';
    
    // Generate confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
      
      confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation ends
    setTimeout(() => {
      const container = document.getElementById('confetti-container');
      if (container) {
        container.innerHTML = '';
      }
    }, 5000);
  };

  // Function to eliminate some incorrect options
  const eliminateOptions = () => {
    if (score < HINT_COSTS.ELIMINATE_OPTIONS) {
      showNotification(`Need ${HINT_COSTS.ELIMINATE_OPTIONS} points to eliminate options`, 'error');
      return;
    }

    // Get unused letters
    const unusedLetters = alphabet.filter(letter => 
      !guessedLetters.includes(letter) && !word.toLowerCase().includes(letter)
    );
    
    if (unusedLetters.length < 3) {
      showNotification('Not enough options to eliminate!', 'info');
      return;
    }

    // Randomly select 3 incorrect letters to eliminate
    const lettersToEliminate = [];
    for (let i = 0; i < 3 && i < unusedLetters.length; i++) {
      const randomIndex = Math.floor(Math.random() * unusedLetters.length);
      lettersToEliminate.push(unusedLetters[randomIndex]);
      unusedLetters.splice(randomIndex, 1);
    }
    
    // Add them to guessed letters
    setGuessedLetters(prev => [...prev, ...lettersToEliminate]);
    
    // Deduct points from local score state
    setScore(prev => prev - HINT_COSTS.ELIMINATE_OPTIONS);
    
    // Also update the currentUser's score in memory to keep it in sync
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        score: currentUser.score - HINT_COSTS.ELIMINATE_OPTIONS
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update users array
      const updatedUsers = users.map(user => 
        user.username === currentUser.username ? updatedUser : user
      );
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
    
    setUsedHints(prev => [...prev, 'eliminate']);
    
    showNotification(`Eliminated ${lettersToEliminate.length} incorrect letters`, 'success');
    playSound('hint');
  };

  // Handle letter guess
  const handleGuess = (letter) => {
    if (gameOver || guessedLetters.includes(letter)) return;
    
    playSound('click');
    
    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);
    
    if (!word.toLowerCase().includes(letter.toLowerCase())) {
      playSound('wrong');
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      
      // Check if game is lost
      if (newWrongGuesses >= MAX_WRONG_GUESSES) {
        handleLoss();
        showNotification(`Game over! The word was "${word}"`, 'error');
        
        // Update user stats
        updateUserStats(false);
      }
    } else {
      playSound('correct');
      // Check if word is completely guessed
      const isWordGuessed = checkWinCondition(newGuessedLetters);
      
      if (isWordGuessed) {
        showNotification(`Congratulations! You earned ${POINTS_MAP[difficulty]} points!`);
        
        // Play win sound and show confetti
        showConfetti();
        
        // Update user stats
        updateUserStats(true);
      }
    }
  };
  
  // Check win condition helper
  const checkWinCondition = (guessedList) => {
    const isWordGuessed = word.toLowerCase().split('').every(char => 
      char === ' ' || guessedList.includes(char.toLowerCase()) || !alphabet.includes(char.toLowerCase())
    );
    
    if (isWordGuessed) {
      handleWin();
      return true;
    }
    return false;
  };
  
  // Fix revealLetter function
  const revealLetter = () => {
    if (score < HINT_COSTS.REVEAL_LETTER) {
      showNotification(`Need ${HINT_COSTS.REVEAL_LETTER} points to reveal a letter`, 'error');
      return;
    }

    // Find letters that are not yet guessed or revealed
    const unrevealedLetters = word.toLowerCase().split('')
      .filter(letter => 
        !guessedLetters.includes(letter) && 
        alphabet.includes(letter) && // Only include valid alphabet letters
        letter !== ' ' // Exclude spaces
      );
    
    if (unrevealedLetters.length === 0) {
      showNotification('All letters are already revealed!', 'info');
      return;
    }

    // Randomly select an unrevealed letter
    const letterToReveal = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
    
    // Add it to guessed letters and revealed letters
    const updatedGuessedLetters = [...guessedLetters, letterToReveal];
    setGuessedLetters(updatedGuessedLetters);
    setRevealedLetters(prev => [...prev, letterToReveal]);
    
    // Deduct points from local score state
    setScore(prev => prev - HINT_COSTS.REVEAL_LETTER);
    
    // Also update the currentUser's score in memory to keep it in sync
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        score: currentUser.score - HINT_COSTS.REVEAL_LETTER
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update users array
      const updatedUsers = users.map(user => 
        user.username === currentUser.username ? updatedUser : user
      );
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
    
    setUsedHints(prev => [...prev, 'reveal']);
    
    showNotification(`Revealed letter: ${letterToReveal.toUpperCase()}`, 'success');
    playSound('hint');
    
    // Check if word is completely guessed after revealing
    checkWinCondition(updatedGuessedLetters);
  };

  // Update user stats with auto leaderboard refresh
  const updateUserStats = async (didWin) => {
    if (!currentUser || !currentUser.id) {
      showNotification('Please log in to save your progress', 'error');
      return;
    }
    
    try {
      // Calculate new stats
      const newWins = didWin ? (currentUser.wins || 0) + 1 : (currentUser.wins || 0);
      const newTotalGames = totalGames + 1;
      const newScore = didWin ? score + POINTS_MAP[difficulty] : score;
      
      // Update local state
      setScore(newScore);
      setTotalGames(newTotalGames);
      
      // Update current user object
      const updatedUser = {
        ...currentUser,
        score: newScore,
        totalGames: newTotalGames,
        wins: newWins,
        winStreak: didWin ? (currentUser.winStreak || 0) + 1 : 0
      };
      
      setCurrentUser(updatedUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Send update to server
      await updateScoreApi.execute(currentUser.id, {
        score: newScore,
        totalGames: newTotalGames,
        wins: newWins,
        winStreak: didWin ? (currentUser.winStreak || 0) + 1 : 0
      });
      
      // Refresh the leaderboard to show updated scores
      await loadLeaderboard();
      
    } catch (error) {
      console.error("Error updating stats");
      showNotification("Failed to update stats. Please check your connection.", "error");
    }
    
    // If word is successfully generated, save it to the database
    if (word) {
      try {
        const wordData = await saveWordApi.execute(word, hint);
        
        // Record the word play for this user
        if (wordData && wordData.id) {
          await recordWordPlayApi.execute(currentUser.id, wordData.id, didWin);
        }
      } catch (error) {
        console.error("Error saving word data");
      }
    }
  };

  // Generate a new word using the Gemini API
  const generateWord = async () => {
    try {
      setLoading(true);
      resetGame();

      // Get topic based on selection
      let topicToUse;
      if (selectedTopic === 'random') {
        // Get a random disaster topic
        topicToUse = disasterTopics[Math.floor(Math.random() * disasterTopics.length)];
      } else {
        topicToUse = selectedTopic;
      }
      
      // Adjust word difficulty
      let complexityLevel = "moderate";
      let wordLength = "4-12";
      
      if (difficulty === 'easy') {
        complexityLevel = "simple";
        wordLength = "4-6";
      } else if (difficulty === 'hard') {
        complexityLevel = "challenging";
        wordLength = "8-12";
      }

      // Add previously used words to the prompt
      const usedWordsString = usedWords.length > 0 
        ? `Avoid these previously used words: ${usedWords.join(', ')}. ` 
        : '';

      const prompt = `Generate a single disaster preparedness related term about ${topicToUse} for a word guessing game. 
${usedWordsString}The word should be ${complexityLevel} in complexity and ${wordLength} letters long.
Format your response EXACTLY as follows with no additional text:
{
  "word": "a single word or short phrase related to disaster preparedness",
  "hint": "a brief hint about the word or phrase to help the player guess"
}`;

      // Remove console.log here
      const result = await fetchGeminiResponse(apiKey, prompt, 'gemini-1.5-flash');
      
      try {
        // Clean the result if it contains code block formatting
        let cleanedResult = result;
        
        // Check if the result is wrapped in code blocks and extract just the JSON content
        if (result.includes('```json')) {
          cleanedResult = result.replace(/```json\n|\n```/g, '');
        } else if (result.includes('```')) {
          cleanedResult = result.replace(/```\n|\n```/g, '');
        }
        
        const parsedResult = JSON.parse(cleanedResult);
        
        // Check if word has been used before
        if (usedWords.includes(parsedResult.word.toLowerCase())) {
          showNotification('This word has been used before. Generating a new one...', 'info');
          generateWord(); // Try again
          return;
        }
        
        // Add the new word to the used words list
        setUsedWords(prev => [...prev, parsedResult.word.toLowerCase()]);
        
        // Set the word and hint
        setWord(parsedResult.word);
        setHint(parsedResult.hint);
        
        // Remove console.log here
        showNotification('New word generated!', 'success');
        
        // Save the word to the database
        if (currentUser && currentUser.id) {
          try {
            await saveWordApi.execute(parsedResult.word, parsedResult.hint);
          } catch (error) {
            // Use a more generic error message without revealing the exact error
            console.error("Error saving generated word");
          }
        }
        
      } catch (error) {
        // Use a more generic error message without revealing the exact error
        console.error('Failed to parse response');
        showNotification('Failed to parse response. Please try again.', 'error');
      }
    } catch (error) {
      // Use a more generic error message without revealing the exact error
      console.error('Error generating word');
      showNotification(`Error generating word. Please try again.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update the start game condition to remove API key check
  const handleNewGame = () => {
    resetGame();
    playSound('select');
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
    setUsedHints([]);
    setRevealedLetters([]);
    generateWord().then(() => {
      // Start the timer after word is generated
      startTimer();
    });
  };

  // Get the current masked word display
  const getMaskedWord = () => {
    if (!word) return '';
    
    return word.split('').map(char => {
      if (char === ' ') return ' ';
      if (!alphabet.includes(char.toLowerCase())) return char;
      return guessedLetters.includes(char.toLowerCase()) ? char : '_';
    }).join(' ');
  };

  // Function to call Gemini API without logging sensitive information
  const fetchGeminiResponse = async (apiKey, prompt, model) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Gemini API');
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Only save to history if the response contains educational trivia content
      if (currentUser && currentUser.id) {
        try {
          // Check if response contains educational trivia content
          const containsTrivia = checkForTrivia(responseText);
          
          if (containsTrivia) {
            await saveQuestionApi.execute(
              currentUser.id, 
              prompt, 
              responseText
            );
            
            // Update local state with the new question
            setQuestionHistory(prevHistory => [
              {
                question: prompt,
                response: responseText,
                timestamp: new Date().toISOString()
              },
              ...prevHistory
            ]);
          }
        } catch (error) {
          console.error("Failed to save question to history:", error);
        }
      }
      
      return responseText;
    } catch (e) {
      throw new Error('Error communicating with Gemini API');
    }
  };

  // Helper function to check if a response contains educational trivia
  const checkForTrivia = (text) => {
    // Remove any JSON-formatted content
    const cleanedText = text.replace(/{[^}]*"word"[^}]*}/, '')
                            .replace(/{[^}]*"hint"[^}]*}/, '')
                            .replace(/```json[\s\S]*?```/, '')
                            .replace(/question:|question is:|you asked:?/gi, '');
    
    // Extract potential trivia sentences (longer educational content)
    const triviaSentences = cleanedText.split(/\.|!|\?/).filter(sentence => 
      sentence.length > 30 && 
      !sentence.toLowerCase().includes('word is') && 
      !sentence.toLowerCase().includes('term is') &&
      !sentence.toLowerCase().includes('hint is') &&
      !sentence.toLowerCase().includes('clue is') &&
      !sentence.toLowerCase().includes('"word"') &&
      !sentence.toLowerCase().includes('"hint"') &&
      !sentence.toLowerCase().match(/\?$/) // Exclude sentences ending with question marks
    );
    
    // Return true if we found at least one trivia sentence
    return triviaSentences.length > 0;
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return (wrongGuesses / MAX_WRONG_GUESSES) * 100;
  };
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      showNotification('Please enter both username and password', 'error');
      return;
    }
    
    try {
      let user;
      
      if (isLoginMode) {
        try {
          // First try login
          console.log("Attempting login with:", username);
          user = await loginApi.execute(username, password);
          showNotification(`Welcome back, ${user.username}!`);
        } catch (loginError) {
          console.error("Login failed:", loginError.message);
          showNotification(loginError.message, 'error');
          return;
        }
      } else {
        try {
          // Explicitly try to register
          console.log("Attempting registration with:", username);
          user = await registerApi.execute(username, password);
          showNotification(`Welcome, ${username}! Account created.`);
        } catch (registerError) {
          console.error("Registration failed:", registerError.message);
          showNotification(registerError.message, 'error');
          return;
        }
      }
      
      // Set user state
      setCurrentUser(user);
      setScore(user.score || 0);
      setTotalGames(user.totalGames || 0);
      setIsLoggedIn(true);
      
      // Save to sessionStorage for persistence across page refreshes
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      // Apply user settings
      if (user.settings) {
        setDarkMode(user.settings.dark_mode);
        setSoundEnabled(user.settings.sound_enabled);
        // Set music preference from user settings if available
        if (user.settings.hasOwnProperty('music_enabled')) {
          setMusicEnabled(user.settings.music_enabled);
        } else {
          // If no music setting is saved yet, enable it by default for existing users
          setMusicEnabled(true);
        }
        
        // Load saved music track if available
        if (user.settings.hasOwnProperty('music_track')) {
          setCurrentMusicTrack(user.settings.music_track);
        } else {
          // If no track is saved, default to track 1 (Calm Ambience)
          setCurrentMusicTrack(1);
        }
        
        setDifficulty(user.settings.difficulty);
        
        if (user.settings.dark_mode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      } else {
        // For new users with no settings, enable music by default
        setMusicEnabled(true);
        setCurrentMusicTrack(1); // Default to Calm Ambience
      }
      
      // Load user achievements
      try {
        const userAchievements = await apiService.getUserAchievements(user.id);
        const achievementsMap = {};
        achievementsMap[user.username] = userAchievements.map(a => a.name);
        setAchievements(achievementsMap);
      } catch (error) {
        console.error("Error loading achievements:", error);
      }
      
      // Start background music after a short delay
      // Using setTimeout to ensure state updates have completed
      setTimeout(() => {
        // Enable music by default for all users after login
        setMusicEnabled(true);
        initBackgroundMusic(musicVolume, currentMusicTrack);
      }, 1000);
      
      // Load words used by this specific user
      try {
        const wordsData = await apiService.getUsedWords(user.id);
        setUsedWords(wordsData.map(w => w.word));
      } catch (error) {
        console.error("Error loading user's word history:", error);
        // If there's an error, start with an empty list
        setUsedWords([]);
      }
      
      // Load question history for the user
      try {
        const history = await getQuestionsApi.execute(user.id);
        
        // Filter history to only include items with educational trivia content
        const triviaHistory = history.filter(item => checkForTrivia(item.response));
        
        setQuestionHistory(triviaHistory);
      } catch (error) {
        console.error("Error loading question history:", error);
        setQuestionHistory([]);
      }
      
      // Clear form
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error("Login/register error:", error);
      showNotification("Error during login. Please try again.", "error");
    }
  };
  
  // Logout handler
  const handleLogout = () => {
    // Show confirmation dialog instead of logging out immediately
    setShowLogoutConfirm(true);
  };
  
  // Function to confirm and execute logout
  const confirmLogout = () => {
    playSound('select'); // Play sound when logging out
    
    // Stop background music when logging out
    if (backgroundMusic) {
      try {
        // Fully stop the music
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        backgroundMusic.src = '';
        // Remove the reference to the audio element
        setBackgroundMusic(null);
        console.log("Music stopped on logout");
      } catch (error) {
        console.error("Error stopping music on logout:", error);
      }
    }
    
    // Reset music state
    setMusicEnabled(false);
    
    // Reset the theme to light mode (default)
    if (darkMode) {
      setDarkMode(false);
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
    
    // Clear used words when logging out
    setUsedWords([]);
    
    // Clear question history state
    setQuestionHistory([]);
    setShowQuestionHistory(false);
    
    // Reset other states
    setIsLoggedIn(false);
    setCurrentUser(null);
    setScore(0);
    setTotalGames(0);
    resetGame();
    sessionStorage.removeItem('currentUser');
    showNotification('Logged out successfully');
    
    // Hide confirmation dialog
    setShowLogoutConfirm(false);
  };
  
  // Function to cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    playSound('click');
  };
  
  // Change difficulty
  const handleChangeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
    resetGame();
    
    // Reset timer with the new difficulty's time
    resetTimer(difficultyTimers[newDifficulty]);
    
    playSound('select'); // Play select sound when difficulty changes
    
    // Save user settings
    if (currentUser && currentUser.id) {
      saveSettingsApi.execute(currentUser.id, {
        dark_mode: darkMode,
        sound_enabled: soundEnabled,
        music_enabled: musicEnabled,
        music_track: currentMusicTrack,
        difficulty: newDifficulty
      }).catch(error => {
        console.error("Error saving difficulty setting:", error);
      });
    }
  };
  
  // Toggle leaderboard
  const toggleLeaderboard = async () => {
    if (!showLeaderboard) {
      try {
        const leaderboardData = await getLeaderboardApi.execute();
        setUsers(leaderboardData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        showNotification("Couldn't load leaderboard. Please try again.", "error");
      }
    }
    
    setShowLeaderboard(!showLeaderboard);
  };
  
  // Sort users by score (for leaderboard)
  const getSortedUsers = () => {
    return [...users].sort((a, b) => b.score - a.score).slice(0, 10); // Top 10 users
  };

  // Function to render the scoreboard
  const renderScoreboard = () => {
    const topUsers = getSortedUsers();
    return (
      <div className="scoreboard">
        <h3>Top Players</h3>
        <div className="scoreboard-list">
          {topUsers.length === 0 ? (
            <p>No scores yet!</p>
          ) : (
            topUsers.map((user, index) => (
              <div key={index} className="scoreboard-item">
                <span className="rank">{index + 1}.</span>
                <span className="username">{user.username}</span>
                <span className="score">{user.score}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Add toggle function for topic selector
  const toggleTopicSelector = () => {
    setShowTopicSelector(!showTopicSelector);
  };

  // Add function to handle topic selection
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setShowTopicSelector(false);
    showNotification(`Topic set to: ${topic}`);
  };

  // Add a preload sounds function
  const preloadSounds = () => {
    console.log("Preloading sound effects...");

    const soundUrls = {
      correct: {
        url: "./audio/correct.mp3"
      },
      wrong: {
        url: "./audio/wrong.mp3"
      },
      win: {
        url: "./audio/win.mp3"
      },
      lose: {
        url: "./audio/lose.mp3"
      },
      click: {
        url: "./audio/click.mp3"
      },
      achievement: {
        url: "./audio/win.mp3" // Use win sound for achievements since they don't have their own
      },
      hint: {
        url: "./audio/hint.mp3"
      },
      select: {
        url: "./audio/select.mp3"  // Add select sound URL
      }
    };

    // Create and preload audio elements
    Object.keys(soundUrls).forEach(soundType => {
      try {
        audioElements[soundType] = new Audio();
        
        // Try to load the local file
        audioElements[soundType].src = soundUrls[soundType].url;
        audioElements[soundType].load();
        
        // Add a test to make sure the audio can be played
        audioElements[soundType].addEventListener('canplaythrough', () => {
          console.log(`Sound ${soundType} loaded successfully`);
        });
        
        console.log(`Preloading sound: ${soundType} from ${soundUrls[soundType].url}`);
      } catch (error) {
        console.error(`Error preloading sound ${soundType}:`, error);
      }
    });
  };

  // Function to initialize background music
  const initBackgroundMusic = (volume = 0.5, trackIndex = 1) => {
    console.log(`Initializing background music with volume: ${volume} and track: ${trackIndex}`);
    
    // If there's already music playing, stop it
    if (backgroundMusic) {
      try {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        backgroundMusic.src = '';
      } catch (e) {
        console.error("Error cleaning up existing background music:", e);
      }
    }
    
    // Create new audio element for music
    const music = new Audio();
    music.volume = volume;
    music.loop = true; // Enable looping
    
    // Use the track from musicTracks
    const track = musicTracks[trackIndex - 1]; // Adjust for zero-based array index
    console.log('Loading music from:', track.url);
    music.src = track.url;
    music.load();
    
    // Add event listeners for better debugging and handling
    music.addEventListener('canplaythrough', () => {
      console.log("Music loaded and can play through");
    });
    
    music.addEventListener('error', (e) => {
      console.error("Error loading music:", e);
    });
    
    // Attempt to play the music immediately
    try {
      const playPromise = music.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Music started successfully');
          })
          .catch(error => {
            console.error('Autoplay prevented by browser:', error);
            
            // Fallback for browsers that block autoplay
            const clickHandler = () => {
              // Check music is still enabled before playing
              if (musicEnabled) {
                music.play().catch(e => console.error('Error playing music on click:', e));
              }
              document.removeEventListener('click', clickHandler);
            };
            
            document.addEventListener('click', clickHandler);
          });
      }
    } catch (error) {
      console.error('Error trying to play music:', error);
    }
    
    setBackgroundMusic(music);
    
    // Return the music object for potential further handling
    return music;
  };

  // Toggle music function
  const toggleMusic = () => {
    const newMusicState = !musicEnabled;
    setMusicEnabled(newMusicState);
    localStorage.setItem('musicEnabled', newMusicState.toString());
    
    if (newMusicState) {
      // When enabling music
      if (!backgroundMusic || backgroundMusic.paused) {
        // Initialize new music if none exists or current one is paused
        initBackgroundMusic(musicVolume, currentMusicTrack);
        showNotification(`Music enabled: ${musicTracks[currentMusicTrack - 1].name}`, 'info');
      }
    } else {
      // When disabling music
      if (backgroundMusic) {
        try {
          // Fully stop the music
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
          backgroundMusic.src = '';
          // Remove the reference to the audio element
          setBackgroundMusic(null);
        } catch (error) {
          console.error("Error stopping music:", error);
        }
      }
      showNotification('Music disabled', 'info');
    }
  };

  // Select a specific music track
  const selectMusicTrack = (trackIndex) => {
    setCurrentMusicTrack(trackIndex);
    localStorage.setItem('currentMusicTrack', trackIndex.toString());
    
    // If music is enabled, start the new track
    if (musicEnabled) {
      initBackgroundMusic(musicVolume, trackIndex);
      showNotification(`Now playing: ${musicTracks[trackIndex - 1].name}`, 'info');
    } else {
      // If music was disabled, enable it
      setMusicEnabled(true);
      localStorage.setItem('musicEnabled', 'true');
      initBackgroundMusic(musicVolume, trackIndex);
      showNotification(`Music enabled: ${musicTracks[trackIndex - 1].name}`, 'info');
    }
  };

  // Add a cancelGame function
  const cancelGame = () => {
    resetGame();
    showNotification('Game cancelled');
    playSound('click');
  };

  // Add a function to clear the word history (for testing or to reset when needed)
  const clearWordHistory = async () => {
    try {
      await clearWordHistoryApi.execute();
      setUsedWords([]);
      showNotification('Word history cleared', 'success');
    } catch (error) {
      console.error("Error clearing word history:", error);
      showNotification("Failed to clear word history", "error");
    }
  };

  // Function to award an achievement with improved error handling
  const awardAchievement = async (achievementId) => {
    // Check if the achievement ID exists in the ACHIEVEMENTS object
    if (!ACHIEVEMENTS[achievementId] && !Object.values(ACHIEVEMENTS).find(a => a.id === achievementId)) {
      console.error(`Achievement ID not found: ${achievementId}`);
      return false;
    }
    
    // Find the achievement by ID or key
    const achievement = ACHIEVEMENTS[achievementId] || Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    
    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
      return false;
    }
    
    // Check if user has this achievement already in the local state
    if (achievements[currentUser.username] && 
        achievements[currentUser.username].includes(achievement.id)) {
      return false;
    }
    
    try {
      // Update local state first, to prevent duplicate awards in case of race conditions
      const newAchievements = {
        ...achievements,
        [currentUser.username]: [
          ...(achievements[currentUser.username] || []),
          achievement.id
        ]
      };
      
      setAchievements(newAchievements);
      
      // Try to award the achievement in the database
      try {
        await awardAchievementApi.execute(currentUser.id, achievement.id);
      } catch (error) {
        // If error is "already awarded", just ignore it since we've already updated the UI
        if (error.message && error.message.includes("already awarded")) {
          // Achievement already exists in DB but wasn't in our local state
          // This is fine, just continue
        } else {
          // For other errors, log but still show the achievement to user
          // The achievement will be re-synced on next login
          console.error("Database error during achievement award, will retry later");
        }
      }
      
      // Show notification
      showNotification(`Achievement Unlocked: ${achievement.title}`, 'achievement');
      
      // Play sound regardless of DB success
      playSound('achievement');
      return true;
    } catch (error) {
      // Generic error handling for any other issues
      console.error("Error in achievement processing");
      return false;
    }
  };
  
  // Function to check achievements after a game
  const checkAchievements = async (gameWon, noWrongGuesses, currentStreak) => {
    if (!currentUser || !currentUser.id) return;
    
    // Get user's current achievements
    const userAchievements = achievements[currentUser.username] || [];
    
    // Check for first win
    if (gameWon && !userAchievements.includes(ACHIEVEMENTS.FIRST_WIN.id)) {
      await awardAchievement(ACHIEVEMENTS.FIRST_WIN.id);
    }
    
    // Check for perfect game
    if (gameWon && noWrongGuesses && !userAchievements.includes(ACHIEVEMENTS.PERFECT_GAME.id)) {
      await awardAchievement(ACHIEVEMENTS.PERFECT_GAME.id);
    }
    
    // Check for 3 win streak
    if (gameWon && currentStreak >= 3 && !userAchievements.includes(ACHIEVEMENTS.STREAK_3.id)) {
      await awardAchievement(ACHIEVEMENTS.STREAK_3.id);
    }
    
    // Check for hint master
    if (gameWon && 
        usedHints.includes('reveal') && 
        usedHints.includes('eliminate') && 
        !userAchievements.includes(ACHIEVEMENTS.HINT_MASTER.id)) {
      await awardAchievement(ACHIEVEMENTS.HINT_MASTER.id);
    }
    
    // Check for hard mode win
    if (gameWon && 
        difficulty === 'hard' && 
        !userAchievements.includes(ACHIEVEMENTS.HARD_MODE.id)) {
      await awardAchievement(ACHIEVEMENTS.HARD_MODE.id);
    }
  };
  
  // Add a state for tracking win streak
  const [winStreak, setWinStreak] = useState(0);

  // Update handle win to show educational tips after winning
  const handleWin = () => {
    setGameOver(true);
    setWon(true);
    playSound('win');
    showConfetti(); // Show confetti effect for win
    
    // Stop the timer
    stopTimer();
    
    // Update user stats with win
    setTimeout(() => {
      updateUserStats(true);
      
      // Check achievements - after state is updated
      setTimeout(() => {
        checkAchievements(true, wrongGuesses === 0, winStreak + 1);
        
        // Show educational fact about the word after a short delay
        setTimeout(() => {
          fetchEducationalFact();
        }, 1000);
      }, 100);
    }, 50);
    
    // Update win streak
    const newWinStreak = winStreak + 1;
    setWinStreak(newWinStreak);
  };

  // Handle a loss
  const handleLoss = () => {
    setGameOver(true);
    setWon(false);
    playSound('lose');
    
    // Reset win streak on loss
    setWinStreak(0);
    
    // Update user stats after loss
    setTimeout(() => {
      updateUserStats(false);
    }, 50);
  };

  // Function to fetch educational fact about the word
  const fetchEducationalFact = async () => {
    if (!apiKey || !word) return;
    
    try {
      setLoading(true);
      
      const prompt = `Provide a brief educational paragraph (2-3 sentences) about "${word}" in the context of disaster preparedness. 
Make it informative and factual. Keep it concise and educational.`;

      const result = await fetchGeminiResponse(apiKey, prompt, 'gemini-1.5-flash');
      setFactContent(result);
      setShowFactModal(true);
      
      // Wait for the modal to be fully rendered before starting speech
      // Use requestAnimationFrame to ensure the modal is in the DOM
      requestAnimationFrame(() => {
        // Add a small delay to ensure the modal is fully visible
        setTimeout(() => {
          speakFactContent();
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle login/register mode
  const toggleLoginMode = () => {
    setIsLoginMode(prev => !prev);
  };

  // Function to load question history
  const loadQuestionHistory = async () => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      setLoadingHistory(true);
      const history = await getQuestionsApi.execute(currentUser.id);
      
      // Filter history to only include items with educational trivia content
      const triviaHistory = history.filter(item => checkForTrivia(item.response));
      
      setQuestionHistory(triviaHistory);
    } catch (error) {
      console.error("Error loading question history:", error);
      showNotification("Failed to load question history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Function to clear question history
  const clearQuestionHistory = async () => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      await clearQuestionsApi.execute(currentUser.id);
      setQuestionHistory([]);
      showNotification("Question history cleared", "success");
    } catch (error) {
      console.error("Error clearing question history:", error);
      showNotification("Failed to clear question history", "error");
    }
  };
  
  // Toggle question history panel
  const toggleQuestionHistory = async () => {
    const newState = !showQuestionHistory;
    setShowQuestionHistory(newState);
    
    // Load history when opening the panel
    if (newState && questionHistory.length === 0) {
      await loadQuestionHistory();
    }
  };

  // Function to speak the fact content using the Web Speech API
  const speakFactContent = () => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(factContent);
      
      // Set speech properties
      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1; // Maximum volume
      
      // Add event listeners
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingHistoryIndex(null);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsSpeaking(false);
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  // Stop speaking if active and reset all speech states
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Reset speaking states
      setIsSpeaking(false);
      setSpeakingHistoryIndex(null);
    }
  };

  // Close fact modal and stop any speech
  const closeFactModal = () => {
    stopSpeaking();
    setShowFactModal(false);
  };

  // Function to speak trivia history item
  const speakHistoryItem = (text, index) => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech first
      stopSpeaking();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set speech properties
      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1; // Maximum volume
      
      // Add event listeners
      utterance.onstart = () => {
        setSpeakingHistoryIndex(index);
      };
      
      utterance.onend = () => {
        setSpeakingHistoryIndex(null);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setSpeakingHistoryIndex(null);
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  // UI Rendering
  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <header>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            Disaster Preparedness Word Game
          </h1>
          <div className="header-controls">
            {isLoggedIn && (
              <div className="user-controls">
                <div className="score-display">
                  Score: {score}
                </div>
                
                <button onClick={() => setShowAchievements(true)} className="achievements-btn" title="Achievements">
                  🏆
                </button>
              </div>
            )}
            
            {isLoggedIn && (
              <button onClick={toggleSound} className="theme-toggle" aria-label="Toggle sound">
                {soundEnabled ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                )}
              </button>
            )}
            
            {isLoggedIn && (
              <div className="music-control">
                <button onClick={toggleMusic} className="theme-toggle" aria-label="Toggle music">
                  {musicEnabled ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                      <line x1="3" y1="3" x2="21" y2="21"></line>
                    </svg>
                  )}
                </button>
                <div className="music-dropdown">
                  <ul>
                    {musicTracks.map((track) => (
                      <li 
                        key={track.id} 
                        className={currentMusicTrack === track.id ? 'active' : ''}
                        onClick={() => selectMusicTrack(track.id)}
                      >
                        {track.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {isLoggedIn && (
              <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle dark mode">
                {darkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
            )}
            
            {isLoggedIn && (
              <button onClick={toggleQuestionHistory} className="theme-toggle" aria-label="Trivia History" title="Trivia History">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
            )}
            
            {isLoggedIn && (
              <button onClick={handleLogout} className="theme-toggle logout-btn-header" aria-label="Logout" title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            )}
          </div>
        </header>
        
        <div className="main-layout">
          <div className="game-section">
            {!isLoggedIn ? (
              // Login Form
              <div className="login-container">
                <h2>Login / Register</h2>
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <div className="input-wrapper">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
            <input 
                        type="text" 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                      />
          </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-wrapper">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input 
                        type="password" 
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>
                  <div className="login-options">
                    <label className="mode-toggle">
                      <input 
                        type="checkbox" 
                        id="loginMode" 
                        checked={isLoginMode} 
                        onChange={toggleLoginMode} 
                      />
                      <span className="mode-label">{isLoginMode ? 'Login Mode' : 'Register Mode'}</span>
                    </label>
                  </div>
                  <button type="submit" className="login-btn">
                    {isLoginMode ? 'Login' : 'Register'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="game-container">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : !word ? (
                  <div className="start-game">
                    <h2>Welcome, {currentUser?.username}!</h2>
                    
                    <div className="difficulty-selector">
                      <span>Difficulty: </span>
                      <div className="difficulty-image-buttons">
                        <button 
                          className={`difficulty-img-btn ${difficulty === 'easy' ? 'active' : ''}`}
                          onClick={() => handleChangeDifficulty('easy')}
                          aria-label="Select Easy difficulty"
                          title="Easy mode: More attempts allowed"
                        >
                          <div className="difficulty-img-container">
                            <img src={require('./image/easy.jpeg')} alt="Easy difficulty" />
                            <div className="difficulty-label">Easy</div>
            </div>
                        </button>
                        <button 
                          className={`difficulty-img-btn ${difficulty === 'medium' ? 'active' : ''}`}
                          onClick={() => handleChangeDifficulty('medium')}
                          aria-label="Select Medium difficulty"
                          title="Medium mode: Balanced challenge"
                        >
                          <div className="difficulty-img-container">
                            <img src={require('./image/medium.jpeg')} alt="Medium difficulty" />
                            <div className="difficulty-label">Medium</div>
          </div>
                        </button>
                        <button 
                          className={`difficulty-img-btn ${difficulty === 'hard' ? 'active' : ''}`}
                          onClick={() => handleChangeDifficulty('hard')}
                          aria-label="Select Hard difficulty"
                          title="Hard mode: Limited attempts, higher score reward"
                        >
                          <div className="difficulty-img-container">
                            <img src={require('./image/hard.jpeg')} alt="Hard difficulty" />
                            <div className="difficulty-label">Hard</div>
        </div>
                        </button>
        </div>
      </div>
                    <div className="start-actions">
                      <button 
                        onClick={() => {
                          playSound('select'); // Play select sound when starting game
                          handleNewGame();
                        }} 
                        className="start-game-btn"
                        aria-label="Start Game"
                        title="Click to start a new game"
                      >
                        <span className="start-game-text">Start Game</span>
                      </button>
                    </div>
          </div>
                ) : (
                  <div className="game-area">
                    <div className="game-header">
                      <button onClick={cancelGame} className="back-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 12H5M12 19l-7-7 7-7"></path>
                        </svg>
                        Back
                      </button>
                      <div className="difficulty-display">
                        <span className="difficulty-label">Difficulty:</span> 
                        <span className="difficulty-value">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                      </div>
                      
                      {/* Timer display */}
                      {!gameOver && (
                        <div className="timer-display">
                          <div className="timer-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span data-time-remaining={timeRemaining < 10 ? "low" : "normal"}>
                              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="timer-progress">
                            <div 
                              className="timer-bar" 
                              style={{
                                width: `${(timeRemaining / difficultyTimers[difficulty]) * 100}%`,
                                backgroundColor: timeRemaining < 10 ? '#e74c3c' : timeRemaining < 30 ? '#f39c12' : '#2ecc71'
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="word-area">
                      <div className="hint">Hint: {hint}</div>
                      <div className="word">{getMaskedWord()}</div>
                      <div className="guess-tracker">
                        <div className="attempts-label">Attempts Remaining: <span className="attempts-number">{MAX_WRONG_GUESSES - wrongGuesses}</span></div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{width: `${getProgressPercentage()}%`}}
                          ></div>
        </div>
      </div>
                      
                      {/* Hint System UI */}
                      {!gameOver && (
                        <div className="hint-system">
                          <div className="hint-buttons">
                            <button 
                              onClick={revealLetter} 
                              className={`hint-btn ${score < HINT_COSTS.REVEAL_LETTER ? 'disabled' : ''}`}
                              disabled={score < HINT_COSTS.REVEAL_LETTER || gameOver}
                              title={`Costs ${HINT_COSTS.REVEAL_LETTER} points`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              Reveal Letter ({HINT_COSTS.REVEAL_LETTER} pts)
                            </button>
                            
                            <button 
                              onClick={eliminateOptions} 
                              className={`hint-btn ${score < HINT_COSTS.ELIMINATE_OPTIONS ? 'disabled' : ''}`}
                              disabled={score < HINT_COSTS.ELIMINATE_OPTIONS || gameOver}
                              title={`Costs ${HINT_COSTS.ELIMINATE_OPTIONS} points`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3l18 18M10.5 10.677a2 2 0 002.823 2.823"></path>
                                <path d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.35M12 6c4.008 0 6.701 3.158 9 6a15.66 15.66 0 01-1.078 1.5"></path>
                              </svg>
                              Eliminate 3 Letters ({HINT_COSTS.ELIMINATE_OPTIONS} pts)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="keyboard">
                      {alphabet.map(letter => (
                        <button 
                          key={letter} 
                          className={`keyboard-key 
                            ${guessedLetters.includes(letter) ? 'guessed' : ''} 
                            ${guessedLetters.includes(letter) && !word.toLowerCase().includes(letter) ? 'wrong' : ''}
                            ${guessedLetters.includes(letter) && word.toLowerCase().includes(letter) ? 'correct' : ''}
                          `}
                          onClick={() => handleGuess(letter)}
                          disabled={gameOver || guessedLetters.includes(letter)}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                    
                    {gameOver && (
                      <div className="game-result">
                        {won ? (
                          <div className="result-message win">
                            <div>Congratulations! You won!</div>
                            <div>You earned {POINTS_MAP[difficulty]} points</div>
                          </div>
                        ) : (
                          <div className="result-message lose">
                            <div>Game Over!</div>
                            <div>The word was: <span className="revealed-word">{word}</span></div>
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            playSound('select'); // Play select sound when starting a new game
                            handleNewGame();
                          }} 
                          className="start-game-btn"
                          aria-label="Start New Game"
                          title="Click to start a new game"
                        >
                          <span className="start-game-text">New Game</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Scoreboard - Always visible */}
          <div className="scoreboard">
            <h2>Top Players</h2>
            {getSortedUsers().length > 0 ? (
              <div className="scoreboard-list">
                {getSortedUsers().map((user, index) => (
                  <div key={index} className="scoreboard-item">
                    <span className="rank">{index + 1}</span>
                    <span className="username">{user.username}</span>
                    <span className="score">{user.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No scores yet!</p>
            )}
          </div>
        </div>
        
        <footer>
          <div>Disaster Preparedness Word Game</div>
        </footer>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button onClick={cancelLogout} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmLogout} className="confirm-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add this CSS style block */}
      <style>{`
        /* Add background image to body and App */
        body, html { 
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: transparent;
        }
        
        .App {
          min-height: 100vh;
          background-image: url(${require('./image/bc.jpeg')});
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          position: relative;
        }
        
        .App::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-color: rgba(255, 255, 255, 0.85);
          z-index: -1;
        }
        
        .dark-mode::before {
          background-color: rgba(18, 18, 18, 0.9);
        }
        
        /* Base styles and layout */
        .container {
          position: relative;
          z-index: 1;
        }
        
        .main-layout {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        /* Game container styling with background image */
        .game-container {
          flex: 3;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          position: relative;
          background-image: url(${require('./image/bgc.jpeg')});
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        
        /* Remove the overlay entirely */
        .game-container::before {
          content: none;
        }
        
        /* Ensure text is visible against any background */
        .game-container h2, 
        .game-container h3, 
        .game-container .word, 
        .game-container .hint {
          text-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 5px rgba(255, 255, 255, 1);
          color: var(--text-color, #333);
        }
        
        /* Add semi-transparent backgrounds to content areas but not the container */
        .game-container .game-area,
        .game-container .start-game,
        .game-container .login-form,
        .game-container .result-message,
        .game-container .difficulty-selector > span {
          background-color: rgba(255, 255, 255, 0.7);
          padding: 15px;
          border-radius: 8px;
          backdrop-filter: blur(3px);
        }
        
        .dark-mode .game-container .game-area,
        .dark-mode .game-container .start-game,
        .dark-mode .game-container .login-form,
        .dark-mode .game-container .result-message,
        .dark-mode .game-container .difficulty-selector > span {
          background-color: rgba(18, 18, 18, 0.7);
        }
        
        .game-container > * {
          position: relative;
          z-index: 1;
        }
        
        .game-section {
          flex: 3;
        }
        
        /* Difficulty image buttons styles */
        .difficulty-image-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin: 20px 0;
        }
        
        .difficulty-img-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }
        
        .difficulty-img-container {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          width: 150px;
          height: 100px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }
        
        .difficulty-img-btn:hover .difficulty-img-container {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        .difficulty-img-btn.active .difficulty-img-container {
          border-color: var(--primary-color, #4285f4);
          box-shadow: 0 0 0 3px var(--primary-color, #4285f4), 0 8px 16px rgba(0, 0, 0, 0.2);
          animation: selectPulse 0.5s ease-out;
        }
        
        /* Add animation for selection */
        @keyframes selectPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .difficulty-img-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.3s ease;
        }
        
        .difficulty-img-btn:hover img {
          transform: scale(1.1);
        }
        
        .difficulty-img-btn .difficulty-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .difficulty-img-btn:hover .difficulty-label {
          background: var(--primary-color, #4285f4);
        }
        
        .difficulty-img-btn.active .difficulty-label {
          background: var(--primary-color, #4285f4);
        }
        
        /* Improve difficulty selection layout */
        .difficulty-selector {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .difficulty-selector > span {
          margin-bottom: 10px;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .difficulty-image-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
        
        /* Card styling improvements */
        .game-area, .login-container, .start-game, .scoreboard {
          background-color: var(--card-bg-color, #f5f5f5);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 20px;
          transition: all 0.3s ease;
        }
        
        /* Game header improvements */
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .back-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background-color: var(--card-inner-bg, white);
          color: var(--text-color, #333);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .back-btn:hover {
          background-color: var(--primary-color, #4285f4);
          color: white;
          transform: translateX(-2px);
        }
        
        .difficulty-display {
          font-weight: 600;
          padding: 8px 15px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border-radius: 6px;
          border: 1px solid var(--border-color, #ddd);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .difficulty-label {
          font-weight: 500;
        }
        
        .difficulty-value {
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .dark-mode .difficulty-display {
          background-color: var(--primary-color, #6fa4f5);
          border-color: #444;
        }
        
        /* Login form improvements */
        .login-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 30px;
          text-align: center;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          background: linear-gradient(to bottom right, var(--card-bg-color, #f5f5f5), var(--card-inner-bg, white));
        }
        
        .login-container h2 {
          margin-bottom: 25px;
          color: var(--primary-color, #4285f4);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .login-form {
          max-width: 400px;
          margin: 0 auto;
          background-color: var(--card-inner-bg, white);
          padding: 25px 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .form-group {
          margin-bottom: 22px;
          text-align: left;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-color, #333);
          font-size: 15px;
        }
        
        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 10px;
          font-size: 15px;
          background-color: var(--input-bg-color, #fff);
          color: var(--text-color, #333);
          transition: all 0.2s;
          box-sizing: border-box;
        }
        
        .form-group input::placeholder {
          color: #aaa;
          opacity: 0.7;
        }
        
        .form-group input:focus {
          border-color: var(--primary-color, #4285f4);
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
        }
        
        /* Input wrapper with icons */
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-wrapper svg {
          position: absolute;
          left: 14px;
          color: #aaa;
          transition: all 0.2s;
        }
        
        .input-wrapper input {
          padding-left: 42px !important;
        }
        
        .input-wrapper input:focus + svg,
        .input-wrapper:hover svg {
          color: var(--primary-color, #4285f4);
        }
        
        /* Fix the svg position for input-wrapper */
        .form-group .input-wrapper svg {
          position: absolute;
          left: 14px;
          color: #aaa;
          transition: all 0.2s;
          pointer-events: none;
        }
        
        /* Button styling improvements */
        .login-btn, .start-btn, .logout-btn, .new-game-btn, .close-modal {
          padding: 14px 28px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .login-btn, .start-btn {
          background: linear-gradient(135deg, var(--primary-color, #4285f4), var(--primary-color-dark, #3367d6));
          color: white;
          width: 100%;
        }
        
        .login-btn:hover, .start-btn:hover {
          background: linear-gradient(135deg, var(--primary-color-dark, #3367d6), var(--primary-color, #4285f4));
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(66, 133, 244, 0.3);
        }
        
        .logout-btn {
          background-color: #f5f5f5;
          color: #666;
          margin-top: 10px;
        }
        
        .difficulty-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #ddd);
          background-color: var(--card-inner-bg, white);
          border-radius: 6px;
          margin: 0 5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .difficulty-btn.active {
          background-color: var(--primary-color, #4285f4);
          color: white;
          border-color: var(--primary-color, #4285f4);
        }
        
        /* Improved word display */
        .word {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: 8px;
          margin: 25px 0;
          color: var(--text-color, #333);
          min-height: 60px;
        }
        
        .hint {
          font-size: 1.1rem;
          color: var(--text-secondary-color, #666);
          margin-bottom: 15px;
          font-style: italic;
        }
        
        /* Better keyboard styling */
        .keyboard {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 30px;
        }
        
        .keyboard-key {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 6px;
          background-color: var(--card-inner-bg, white);
          color: var(--text-color, #333);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .keyboard-key:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          background-color: var(--primary-color, #4285f4);
          color: white;
          border-color: var(--primary-color, #4285f4);
        }
        
        .keyboard-key.guessed {
          opacity: 0.7;
        }
        
        .keyboard-key.correct {
          background-color: #4caf50;
          color: white;
          border-color: #4caf50;
        }
        
        .keyboard-key.wrong {
          background-color: #f44336;
          color: white;
          border-color: #f44336;
        }
        
        /* Dark mode improvements for keyboard keys */
        .dark-mode .keyboard-key {
          background-color: #2c2c2c;
          color: #e0e0e0;
          border-color: #444;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .dark-mode .keyboard-key:not(:disabled):hover {
          background-color: var(--primary-color, #6fa4f5);
          border-color: var(--primary-color, #6fa4f5);
          color: white;
        }
        
        .dark-mode .keyboard-key.correct {
          background-color: #43a047;
          border-color: #43a047;
        }
        
        .dark-mode .keyboard-key.wrong {
          background-color: #e53935;
          border-color: #e53935;
        }
        
        /* Improved progress bar */
        .guess-tracker {
          margin: 20px 0;
        }
        
        .attempts-label {
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .attempts-number {
          font-weight: 700;
          color: var(--primary-color, #4285f4);
        }
        
        .progress-bar-container {
          height: 12px;
          background-color: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-bar {
          height: 100%;
          background-color: #f44336;
          transition: width 0.3s ease;
        }
        
        /* Enhanced hint system */
        .hint-system {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color, #ddd);
        }
        
        .hint-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .hint-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background-color: var(--secondary-color, #ff9800);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .hint-btn:not(.disabled):hover {
          background-color: var(--secondary-color-dark, #f57c00);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .hint-btn.disabled {
          background-color: #bdbdbd;
          cursor: not-allowed;
        }
        
        /* Better header styling */
        header {
          padding: 15px 0;
          margin-bottom: 30px;
          border-bottom: 1px solid var(--border-color, #ddd);
        }
        
        header h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.8rem;
          margin: 0;
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .theme-toggle {
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-color, #333);
          transition: all 0.2s;
          background-color: var(--card-inner-bg, white);
          border: 1px solid var(--border-color, #ddd);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-toggle:hover {
          background-color: var(--primary-color, #4285f4);
          color: white;
          transform: translateY(-2px);
        }
        
        .user-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .score-display {
          font-weight: 500;
        }
        
        .achievements-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--card-inner-bg, white);
          color: var(--text-color, #333);
          border: 1px solid var(--border-color, #ddd);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .achievements-btn:hover {
          background-color: var(--primary-color, #4285f4);
          color: white;
          transform: translateY(-2px);
        }
        
        /* Improved scoreboard */
        .scoreboard {
          flex: 1;
          background-color: var(--card-bg-color, #f5f5f5);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          max-width: 300px;
          align-self: flex-start;
        }
        
        .scoreboard h2 {
          margin-top: 0;
          padding-bottom: 15px;
          margin-bottom: 15px;
          border-bottom: 2px solid var(--border-color, #ddd);
          color: var(--text-color, #333);
          font-size: 1.5rem;
          text-align: center;
        }
        
        .scoreboard-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .scoreboard-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: var(--card-inner-bg, white);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }
        
        .scoreboard-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .scoreboard-item:nth-child(1) {
          background: linear-gradient(135deg, #ffd700, #f9ce00);
          color: #000;
          font-weight: bold;
        }
        
        .scoreboard-item:nth-child(2) {
          background: linear-gradient(135deg, #c0c0c0, #b0b0b0);
          color: #000;
        }
        
        .scoreboard-item:nth-child(3) {
          background: linear-gradient(135deg, #cd7f32, #be7430);
          color: #000;
        }
        
        .rank {
          font-weight: bold;
          width: 25px;
        }
        
        .username {
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 5px;
        }
        
        .score {
          font-weight: bold;
        }
        
        /* Game result area */
        .game-result {
          margin-top: 30px;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .result-message {
          margin-bottom: 20px;
          font-size: 1.2rem;
        }
        
        .result-message.win {
          color: #4caf50;
        }
        
        .result-message.lose {
          color: #f44336;
        }
        
        .revealed-word {
          font-weight: bold;
          font-size: 1.3rem;
        }
        
        /* Modal improvements */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
        }
        
        .modal {
          background-color: var(--bg-color, white);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          padding: 25px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          animation: modalFadeIn 0.3s ease;
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .achievements-modal h2 {
          text-align: center;
          margin-top: 0;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border-color, #ddd);
          font-size: 1.8rem;
        }
        
        .achievements-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .achievement-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border-radius: 8px;
          background-color: var(--card-bg-color, #f5f5f5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .achievement-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .achievement-item.unlocked {
          border: 2px solid #4caf50;
        }
        
        .achievement-item.locked {
          opacity: 0.7;
          filter: grayscale(0.8);
        }
        
        .achievement-icon {
          font-size: 28px;
          margin-right: 15px;
          background-color: var(--card-inner-bg, white);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .achievement-details {
          flex: 1;
        }
        
        .achievement-title {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 1.1rem;
        }
        
        .achievement-description {
          font-size: 0.9rem;
          margin-bottom: 5px;
          color: var(--text-secondary-color, #666);
        }
        
        .achievement-status {
          font-size: 0.9rem;
          color: #4caf50;
          font-weight: 500;
        }
        
        .achievement-status.locked {
          color: var(--text-secondary-color, #666);
        }
        
        .close-modal {
          margin-top: 1px;
          padding: 12px 24px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .close-modal:hover {
          background-color: var(--primary-color-dark, #3367d6);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column;
          }
          
          .scoreboard {
            max-width: 100%;
            order: -1;
            margin-bottom: 20px;
          }
          
          .keyboard-key {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
          
          .word {
            font-size: 2rem;
            letter-spacing: 6px;
          }
          
          .hint-buttons {
            flex-direction: column;
            gap: 10px;
          }
        }
        
        /* Dark mode enhancements */
        .dark-mode {
          --bg-color: #121212;
          --card-bg-color: #1e1e1e;
          --card-inner-bg: #2c2c2c;
          --text-color: #e0e0e0;
          --text-secondary-color: #9e9e9e;
          --border-color: #333;
          --input-bg-color: #2c2c2c;
          --primary-color: #6fa4f5;
          --primary-color-dark: #5e8cd3;
          --secondary-color: #ff9e44;
          --secondary-color-dark: #f57c00;
        }
        
        .dark-mode .keyboard-key {
          background-color: #2c2c2c;
          color: #e0e0e0;
          border-color: #444;
        }
        
        .dark-mode .progress-bar-container {
          background-color: #333;
        }
        
        .dark-mode .difficulty-btn {
          background-color: #2c2c2c;
          border-color: #333;
          color: #e0e0e0;
        }
        
        .dark-mode .close-modal:hover,
        .dark-mode .login-btn:hover,
        .dark-mode .start-btn:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        /* Animations and effects */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .new-game-btn {
          animation: pulse 2s infinite;
        }
        
        /* Notification improvements */
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          background-color: #4caf50;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          animation: slideIn 0.3s ease, fadeOut 0.3s ease 2s forwards;
          max-width: 300px;
        }
        
        .notification.error {
          background-color: #f44336;
        }
        
        .notification.info {
          background-color: #2196f3;
        }
        
        .notification.achievement {
          background-color: #ff9800;
          border-left: 4px solid #f57c00;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        /* Add styles for close icon in achievement modal */
        .achievements-modal {
          position: relative;
        }
        
        /* Improve the achievement close icon visibility */
        .achievement-close-icon {
          position: absolute;
          top: 15px;
          right: 15px;
          background-color: var(--primary-color, #4285f4);
          border: 1px solid var(--border-color, #ddd);
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 50%;
          transition: all 0.2s;
          z-index: 10;
        }
        
        .achievement-close-icon:hover {
          background-color: var(--primary-color-dark, #3367d6);
          transform: rotate(90deg);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .achievement-close-icon svg {
          width: 24px;
          height: 24px;
          stroke-width: 3;
          stroke: white; /* Ensure stroke is white for visibility */
        }
        
        /* Make sure the X icon displays properly */
        .achievement-close-icon-x {
          font-size: 24px;
          font-weight: bold;
          color: white;
          margin-top: -4px; /* Adjust vertical position */
        }
        
        .dark-mode .achievement-close-icon {
          background-color: var(--primary-color, #6fa4f5);
          border-color: #444;
          color: white;
        }
        
        .dark-mode .achievement-close-icon:hover {
          background-color: var(--primary-color-dark, #5e8cd3);
        }
        
        /* Keep these separate from fact modal */
        .fact-modal {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 90%;
          overflow: hidden;
          transform: scale(0.9);
          animation: modalScale 0.3s forwards;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        @keyframes modalScale {
          to {
            transform: scale(1);
          }
        }
        
        .dark-mode .fact-modal {
          background-color: #333;
          color: #f5f5f5;
        }
        
        .fact-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          background-color: rgba(240, 240, 240, 0.5);
          margin-bottom: 20px;
          width: 100%;
        }
        
        .fact-icon {
          font-size: 36px;
          margin-bottom: 15px;
        }
        
        .fact-text {
          font-size: 1.1rem;
          line-height: 1.6;
        }
        
        .fact-modal-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
          gap: 15px;
        }
        
        .tts-button {
          background-color: #f0f0f0;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.2s;
          color: #333;
          padding: 0;
        }
        
        .tts-button:hover {
          background-color: #e0e0e0;
          transform: scale(1.05);
        }
        
        .tts-button:active {
          transform: scale(0.95);
        }
        
        .dark-mode .tts-button {
          background-color: #3a3a3a;
          color: #e0e0e0;
        }
        
        .dark-mode .tts-button:hover {
          background-color: #4a4a4a;
        }
        
        .dark-mode .fact-content {
          background-color: rgba(0, 0, 0, 0.2);
        }

        /* Styled Start Game button */
        .start-game-btn {
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--primary-color, #4285f4);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          margin: 15px auto;
          position: relative;
          transition: all 0.3s ease;
          padding: 12px 30px;
          max-width: 250px;
          outline: none;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        
        .start-game-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          background: var(--primary-color-dark, #3367d6);
        }
        
        .start-game-btn:active {
          transform: translateY(0);
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
        }
        
        .start-game-text {
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        /* Animation for Start Game button */
        @keyframes pulseStartBtn {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .start-game-btn:focus {
          animation: pulseStartBtn 0.5s ease-out;
        }
        
        /* Responsive styling for start game button */
        @media (max-width: 768px) {
          .start-game-btn {
            max-width: 200px;
            padding: 10px 20px;
          }
          
          .start-game-text {
            font-size: 1rem;
          }
        }

        /* Add these CSS styles to the style block in the return statement */

        /* API Key Button */
        .api-key-btn {
          background: linear-gradient(to right, #4a6fa5, #166088);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
          margin: 10px 0;
        }

        .api-key-btn:hover {
          background: linear-gradient(to right, #166088, #0d4d6d);
          transform: translateY(-2px);
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          width: 90%;
          max-width: 500px;
          z-index: 1001;
        }

        .dark-mode .modal {
          background-color: #2a2a2a;
          color: #f0f0f0;
        }

        .api-key-modal h2 {
          margin-top: 0;
          color: #166088;
        }

        .dark-mode .api-key-modal h2 {
          color: #4a9fd9;
        }

        .api-key-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin: 10px 0;
          font-size: 16px;
        }

        .dark-mode .api-key-input {
          background-color: #3a3a3a;
          color: #f0f0f0;
          border-color: #444;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .save-btn, .cancel-btn {
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .save-btn {
          background-color: #166088;
          color: white;
          border: none;
        }

        .save-btn:hover:not(:disabled) {
          background-color: #0d4d6d;
        }

        .save-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .cancel-btn {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ccc;
        }

        .dark-mode .cancel-btn {
          background-color: #444;
          color: #f0f0f0;
          border-color: #666;
        }

        .cancel-btn:hover {
          background-color: #e5e5e5;
        }

        .dark-mode .cancel-btn:hover {
          background-color: #555;
        }

        /* Adjust the start-actions container */
        .start-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
          align-items: center;
        }

        /* Logout button in header */
        .logout-btn-header {
          background-color: rgba(220, 53, 69, 0.1) !important;
          transition: all 0.3s ease;
        }
        
        .logout-btn-header:hover {
          background-color: rgba(220, 53, 69, 0.3) !important;
        }
        
        .dark-mode .logout-btn-header {
          background-color: rgba(220, 53, 69, 0.15) !important;
        }
        
        .dark-mode .logout-btn-header:hover {
          background-color: rgba(220, 53, 69, 0.4) !important;
        }
        
        /* Logout confirmation modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .confirmation-modal {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          width: 350px;
          padding: 20px;
          text-align: center;
        }
        
        .dark-mode .confirmation-modal {
          background-color: #1e1e1e;
          color: #f0f0f0;
        }
        
        .confirmation-modal h3 {
          margin-top: 0;
          color: #d9534f;
        }
        
        .dark-mode .confirmation-modal h3 {
          color: #ff6b6b;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
        }
        
        .cancel-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .cancel-btn:hover {
          background-color: #5a6268;
        }
        
        .confirm-btn {
          background-color: #d9534f;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .confirm-btn:hover {
          background-color: #c9302c;
        }

        /* History styles */
        .history-item {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 8px;
          background-color: rgba(250, 250, 250, 0.8);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          border-left: 4px solid var(--primary-color, #4285f4);
          transition: all 0.2s ease;
        }

        .history-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .history-timestamp {
          font-size: 0.8rem;
          color: #777;
          margin-bottom: 8px;
        }

        .history-text {
          margin-bottom: 10px;
          line-height: 1.5;
        }
        
        .dark-mode .history-timestamp {
          color: #aaa;
        }

        /* Modal button styles */
        .modal-button {
          background-color: #4a90e2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        
        .modal-button:hover {
          background-color: #3a80d2;
        }

        /* Question history modal */
        .history-modal {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          position: relative;
        }
        
        .dark-mode .history-modal {
          background-color: #1e1e1e;
          color: #f0f0f0;
        }
        
        .history-header {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          position: relative;
        }
        
        .dark-mode .history-header {
          border-bottom: 1px solid #333;
        }
        
        .history-header h2 {
          margin: 0;
          flex: 1;
          text-align: center;
          /* Add negative margin to offset the width of the close button */
          margin-right: 30px;
        }
        
        .close-modal {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          padding: 0;
          margin-right: 10px;
          position: absolute;
          left: 15px;
        }
        
        .close-modal:hover {
          color: #555;
        }
        
        .dark-mode .close-modal {
          color: #aaa;
        }
        
        .dark-mode .close-modal:hover {
          color: #ddd;
        }
        
        .close-icon {
          line-height: 1;
        }
        
        .history-content {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(80vh - 70px);
        }

        /* Educational Fact Modal */
        .fact-modal-content {
          max-width: 600px;
          width: 90%;
        }
        
        .fact-content {
          margin: 20px 0;
          line-height: 1.6;
          font-size: 1.1rem;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid var(--primary-color, #4285f4);
        }
        
        .dark-mode .fact-content {
          background-color: rgba(0, 0, 0, 0.2);
        }
        
        /* Add styles for the timer display */
        .timer-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
          margin: 0 8px;
        }
        
        .timer-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .timer-text svg {
          color: var(--text-color, #333);
        }
        
        .timer-progress {
          width: 100%;
          height: 6px;
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .timer-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 1s linear, background-color 0.5s ease;
        }
        
        @media (max-width: 768px) {
          .game-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .timer-display {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          
          .timer-text {
            margin-bottom: 0;
            margin-right: 10px;
          }
          
          .timer-progress {
            flex: 1;
          }
        }
        
        /* Animation for timer when it's running low */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .timer-text span {
          transition: color 0.3s ease;
        }
        
        .timer-text span[data-time-remaining="low"] {
          color: #e74c3c;
          animation: pulse 1s infinite;
        }

        .fact-modal-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
          gap: 15px;
        }

        .tts-button {
          background-color: #f0f0f0;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.2s;
          color: #333;
          padding: 0;
        }

        .tts-button:hover {
          background-color: #e0e0e0;
          transform: scale(1.05);
        }

        .tts-button:active {
          transform: scale(0.95);
        }

        .dark-mode .tts-button {
          background-color: #3a3a3a;
          color: #e0e0e0;
        }

        .dark-mode .tts-button:hover {
          background-color: #4a4a4a;
        }

        .dark-mode .tts-button:hover {
          background-color: #4a4a4a;
        }

        .modal-button {
          padding: 10px 20px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-button:hover {
          background-color: var(--primary-color-dark, #3367d6);
          transform: translateY(-2px);
        }

        .dark-mode .fact-content {
          background-color: rgba(0, 0, 0, 0.2);
        }

        .history-item-controls {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .history-tts-button {
          width: 36px;
          height: 36px;
          background-color: rgba(240, 240, 240, 0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          color: #333;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .history-tts-button:hover {
          background-color: var(--primary-color, #4285f4);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .dark-mode .history-tts-button {
          background-color: #3a3a3a;
          color: #f5f5f5;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        
        .dark-mode .history-tts-button:hover {
          background-color: var(--primary-color, #6fa4f5);
        }
        
        .dark-mode .history-item {
          border-left: 4px solid #4a90e2;
          background-color: rgba(50, 50, 50, 0.5);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .dark-mode .history-text {
          color: #ddd;
        }
      `}</style>
      
      {/* Educational Fact Modal */}
      {showFactModal && (
        <div className="modal-overlay">
          <div className="fact-modal">
            <div className="fact-content">
              <div className="fact-icon">💡</div>
              <div className="fact-text">{factContent}</div>
            </div>
            <div className="fact-modal-buttons">
              <button 
                className="tts-button" 
                onClick={isSpeaking ? stopSpeaking : speakFactContent}
                title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
              >
                {isSpeaking ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                )}
              </button>
              <button className="modal-button" onClick={closeFactModal}>Got it!</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Achievements Modal */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="modal achievements-modal" onClick={e => e.stopPropagation()}>
            <h2>Your Achievements</h2>
            <button 
              className="achievement-close-icon" 
              onClick={() => setShowAchievements(false)}
              aria-label="Close achievements"
            >
              <span className="achievement-close-icon-x">×</span>
            </button>
            
            <div className="achievements-list">
              {Object.values(ACHIEVEMENTS).map(achievement => {
                const isUnlocked = currentUser && 
                                  achievements[currentUser.username]?.includes(achievement.id);
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-details">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      {isUnlocked ? (
                        <div className="achievement-status">Unlocked</div>
                      ) : (
                        <div className="achievement-status locked">Locked</div>
                      )}
      </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Question History Modal */}
      {showQuestionHistory && (
        <div className="modal-overlay" onClick={() => {
          stopSpeaking(); // Stop any speech when closing modal
          setShowQuestionHistory(false);
        }}>
          <div className="history-modal" onClick={e => e.stopPropagation()}>
            <div className="history-header">
              <button className="close-modal" onClick={() => {
                stopSpeaking(); // Stop any speech when closing modal
                setShowQuestionHistory(false);
              }}>
                <span className="close-icon">×</span>
              </button>
              <h2>Trivia History</h2>
            </div>
            
            <div className="history-content">
              {loadingHistory ? (
                <div className="history-loading">Loading your trivia history...</div>
              ) : questionHistory.length === 0 ? (
                <div className="no-history">No trivia in history yet.</div>
              ) : (
                <div className="question-list">
                  {questionHistory.map((item, index) => {
                    // Try to extract the trivia from the response
                    const responseText = item.response || '';
                    
                    // Remove any JSON-formatted content and question-related content
                    const cleanedResponse = responseText.replace(/{[^}]*"word"[^}]*}/, '')
                                                      .replace(/{[^}]*"hint"[^}]*}/, '')
                                                      .replace(/```json[\s\S]*?```/, '')
                                                      .replace(/question:|question is:|you asked:?/gi, '');
                    
                    // Extract any educational/trivia content (typically paragraph length)
                    const triviaMatch = cleanedResponse.split(/\.|!|\?/).filter(sentence => 
                      sentence.length > 30 && 
                      !sentence.toLowerCase().includes('word is') && 
                      !sentence.toLowerCase().includes('term is') &&
                      !sentence.toLowerCase().includes('hint is') &&
                      !sentence.toLowerCase().includes('clue is') &&
                      !sentence.toLowerCase().includes('"word"') &&
                      !sentence.toLowerCase().includes('"hint"') &&
                      !sentence.toLowerCase().match(/\?$/) // Exclude sentences ending with question marks
                    ).slice(0, 2).join('. ') + '.';
                    
                    // Only display if we have valid trivia content
                    if (!triviaMatch || triviaMatch.trim().length === 0) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="history-item">
                        <div className="history-timestamp">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div className="history-text">{triviaMatch}</div>
                        <div className="history-item-controls">
                          <button 
                            className="tts-button history-tts-button" 
                            onClick={() => 
                              speakingHistoryIndex === index ? 
                              stopSpeaking() : 
                              speakHistoryItem(triviaMatch, index)
                            }
                            title={speakingHistoryIndex === index ? "Stop Speaking" : "Read Aloud"}
                          >
                            {speakingHistoryIndex === index ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
