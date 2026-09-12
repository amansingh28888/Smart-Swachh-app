import { useState, useEffect, useRef } from "react";
import wasteItems from "../data/wasteQuestions";
import "./WasteGame.css";

const QUESTIONS_PER_GAME = 10;
const INITIAL_TIME_PER_ITEM = 15;

const BINS = [
  {
    id: "green",
    label: "Green Bin",
    category: "Wet / Organic Waste",
    icon: "🟢",
    color: "#10b981",
    lightBg: "#ecfdf5",
    borderColor: "#34d399",
    accentGlow: "rgba(16, 185, 129, 0.4)",
    itemsText: "Food scraps, fruit peels, leaves, coffee grounds",
  },
  {
    id: "blue",
    label: "Blue Bin",
    category: "Dry / Recyclable Waste",
    icon: "🔵",
    color: "#3b82f6",
    lightBg: "#eff6ff",
    borderColor: "#60a5fa",
    accentGlow: "rgba(59, 130, 246, 0.4)",
    itemsText: "Paper, cardboard, plastic bottles, metal cans, glass",
  },
  {
    id: "red",
    label: "Red Bin",
    category: "Hazardous & Medical Waste",
    icon: "🔴",
    color: "#ef4444",
    lightBg: "#fef2f2",
    borderColor: "#f87171",
    accentGlow: "rgba(239, 68, 68, 0.4)",
    itemsText: "Syringes, bandages, old medicines, chemicals, paint",
  },
  {
    id: "ewaste",
    label: "E-Waste Bin",
    category: "Electronic Waste",
    icon: "⚡",
    color: "#8b5cf6",
    lightBg: "#f5f3ff",
    borderColor: "#a78bfa",
    accentGlow: "rgba(139, 92, 246, 0.4)",
    itemsText: "Phones, laptops, batteries, chargers, light bulbs",
  },
];

// Simple Web Audio API Synthesizer for retro arcade sound effects
const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "streak") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.25); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
  }
};

// Shuffle helper
const getRandomQuestions = () => {
  const shuffled = [...wasteItems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[r]] = [shuffled[r], shuffled[i]];
  }
  return shuffled.slice(0, QUESTIONS_PER_GAME);
};

export default function WasteGame() {
  const [questions, setQuestions] = useState(getRandomQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedBin, setSelectedBin] = useState(null);
  const [draggedOverBin, setDraggedOverBin] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_PER_ITEM);
  const [timerActive, setTimerActive] = useState(true);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("smartsort_high_score") || "0", 10);
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  const currentItem = questions[currentIndex];
  const timerRef = useRef(null);

  // Timer Countdown logic
  useEffect(() => {
    if (!timerActive || selectedBin !== null || isFinished) return;

    if (timeLeft <= 0) {
      handleAnswer(null, true); // Auto-fail on timeout
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timerActive, selectedBin, isFinished]);

  // Trigger answer evaluation
  const handleAnswer = (binId, isTimeout = false) => {
    if (selectedBin !== null) return;
    setTimerActive(false);

    const isCorrect = !isTimeout && binId === currentItem.correct;
    setSelectedBin(binId);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Multiplier bonus: 1x baseline, 2x for streak>=2, 3x for streak>=4, 5x for streak>=7
      const multiplier = newStreak >= 7 ? 5 : newStreak >= 4 ? 3 : newStreak >= 2 ? 2 : 1;
      const speedBonus = Math.floor(timeLeft * 5);
      const pointsEarned = 100 * multiplier + speedBonus;

      setScore((prev) => prev + pointsEarned);

      if (newStreak >= 3) {
        playSound("streak");
      } else {
        playSound("correct");
      }
    } else {
      setStreak(0);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
      playSound("wrong");
    }
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
      const finalScore = score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("smartsort_high_score", finalScore.toString());
        setShowConfetti(true);
      } else if (finalScore >= 800) {
        setShowConfetti(true);
      }
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedBin(null);
    setTimeLeft(INITIAL_TIME_PER_ITEM);
    setTimerActive(true);
  };

  const handleRestart = () => {
    setQuestions(getRandomQuestions());
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedBin(null);
    setIsFinished(false);
    setShowConfetti(false);
    setTimeLeft(INITIAL_TIME_PER_ITEM);
    setTimerActive(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", currentItem.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, binId) => {
    e.preventDefault();
    if (selectedBin === null && draggedOverBin !== binId) {
      setDraggedOverBin(binId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverBin(null);
  };

  const handleDrop = (e, binId) => {
    e.preventDefault();
    setDraggedOverBin(null);
    if (selectedBin === null) {
      handleAnswer(binId);
    }
  };

  // Multiplier Label
  const getMultiplierLabel = () => {
    if (streak >= 7) return "🔥 5x MULTIPLIER!";
    if (streak >= 4) return "🔥 3x MULTIPLIER!";
    if (streak >= 2) return "⚡ 2x STREAK!";
    return null;
  };

  // GAME OVER / SUMMARY SCREEN
  if (isFinished) {
    const accuracy = Math.round((score / (QUESTIONS_PER_GAME * 200)) * 100);
    const isNewRecord = score > 0 && score >= highScore;

    return (
      <div className="game-card game-finished-card">
        {showConfetti && <div className="confetti-burst" aria-hidden="true" />}
        <div className="game-result-container">
          <div className="badge-glow">
            {score >= 1200 ? "🏆" : score >= 800 ? "🌟" : "🌱"}
          </div>

          <h2 className="result-headline">
            {score >= 1200
              ? "Master Eco Champion!"
              : score >= 800
              ? "Awesome Recycling Specialist!"
              : "Good Effort! Keep Learning!"}
          </h2>

          <p className="result-sub">
            You processed <strong>{QUESTIONS_PER_GAME} waste items</strong> with high accuracy!
          </p>

          <div className="stats-dashboard">
            <div className="stat-box">
              <span className="stat-label">Final Score</span>
              <span className="stat-val highlight-score">{score}</span>
              {isNewRecord && <span className="new-high-badge">New High Score!</span>}
            </div>
            <div className="stat-box">
              <span className="stat-label">Max Streak</span>
              <span className="stat-val">🔥 {maxStreak}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Rating</span>
              <span className="stat-val">
                {score >= 1200 ? "100% Pro" : score >= 800 ? "Great" : "Apprentice"}
              </span>
            </div>
          </div>

          <div className="educational-recap">
            <h3>💡 Waste Segregation Rulebook</h3>
            <div className="recap-grid">
              <div className="recap-item green-recap">
                <strong>🟢 Green Bin:</strong> Organic & wet kitchen waste goes to composting.
              </div>
              <div className="recap-item blue-recap">
                <strong>🔵 Blue Bin:</strong> Clean paper, cardboard, plastic & glass go to recycling.
              </div>
              <div className="recap-item red-recap">
                <strong>🔴 Red Bin:</strong> Medical waste, chemical cans & needles require safe disposal.
              </div>
              <div className="recap-item ewaste-recap">
                <strong>⚡ E-Waste Bin:</strong> Old phones, laptops & batteries go to e-waste centers.
              </div>
            </div>
          </div>

          <button className="arcade-btn primary-btn restart-action-btn" onClick={handleRestart}>
            🔄 Play Again & Beat High Score
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = selectedBin !== null;
  const isCorrect = isAnswered && selectedBin === currentItem.correct;
  const targetBinInfo = BINS.find((b) => b.id === currentItem.correct);

  return (
    <div className="game-card">
      {/* ═══ GAME HEADER BAR ═══ */}
      <div className="game-top-bar">
        <div className="game-title-group">
          <div className="game-logo-icon">♻️</div>
          <div>
            <h2 className="game-title">SmartSort Arcade</h2>
            <p className="game-subtitle">Drag waste items to the correct bin!</p>
          </div>
        </div>

        <div className="game-stats-pill">
          <div className="stat-chip streak-chip">
            <span className="chip-icon">🔥</span>
            <span>Streak: {streak}</span>
          </div>
          <div className="stat-chip score-chip">
            <span className="chip-icon">⭐</span>
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* ═══ PROGRESS & TIMER BAR ═══ */}
      <div className="progress-section">
        <div className="progress-meta">
          <span>
            Item <strong>{currentIndex + 1}</strong> of {QUESTIONS_PER_GAME}
          </span>
          <span className={`timer-text ${timeLeft <= 5 ? "timer-warning" : ""}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentIndex + 1) / QUESTIONS_PER_GAME) * 100}%` }}
          />
        </div>
      </div>

      {/* ═══ ITEM TO BE SORTED (DRAGGABLE CARD) ═══ */}
      <div
        className={`item-display-card ${shakeCard ? "shake-anim" : ""} ${
          isAnswered ? (isCorrect ? "correct-card-glow" : "wrong-card-glow") : ""
        }`}
        draggable={!isAnswered}
        onDragStart={handleDragStart}
      >
        {getMultiplierLabel() && (
          <div className="multiplier-banner">{getMultiplierLabel()}</div>
        )}

        <div className="item-icon-wrapper">
          <span className="item-emoji">{currentItem.item}</span>
          {!isAnswered && <span className="drag-hint">🤏 Drag or Click Below</span>}
        </div>

        <h3 className="item-name">{currentItem.name}</h3>
        <p className="item-prompt">Where does this waste belong?</p>
      </div>

      {/* ═══ THE 4 DESTINATION BINS ═══ */}
      <div className="bins-grid">
        {BINS.map((bin) => {
          let binStateClass = "";
          if (isAnswered) {
            if (bin.id === currentItem.correct) {
              binStateClass = "bin-correct-target";
            } else if (bin.id === selectedBin) {
              binStateClass = "bin-wrong-choice";
            } else {
              binStateClass = "bin-disabled-fade";
            }
          } else if (draggedOverBin === bin.id) {
            binStateClass = "bin-drag-active";
          }

          return (
            <button
              key={bin.id}
              className={`bin-card bin-${bin.id} ${binStateClass}`}
              onClick={() => handleAnswer(bin.id)}
              onDragOver={(e) => handleDragOver(e, bin.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bin.id)}
              disabled={isAnswered}
            >
              <div className="bin-lid-graphic">
                <span className="bin-lid-top" />
              </div>

              <div className="bin-body">
                <span className="bin-emoji">{bin.icon}</span>
                <span className="bin-name">{bin.label}</span>
                <span className="bin-category">{bin.category}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ EDUCATIONAL FEEDBACK CARD ═══ */}
      {isAnswered && (
        <div className={`educational-feedback-card ${isCorrect ? "feedback-success" : "feedback-error"}`}>
          <div className="feedback-header">
            <span className="feedback-status-icon">{isCorrect ? "🎉" : "❌"}</span>
            <div>
              <h4 className="feedback-headline">
                {isCorrect ? "Spot On! Correct Bin!" : `Not Quite! It belongs in ${targetBinInfo.label}`}
              </h4>
              <p className="feedback-explanation">{currentItem.explanation}</p>
            </div>
          </div>

          <div className="eco-fact-box">
            <span className="fact-badge">🌱 Eco Impact Fact</span>
            <p className="fact-text">{currentItem.ecoFact}</p>
          </div>

          <button className="arcade-btn next-action-btn" onClick={handleNext}>
            {currentIndex === questions.length - 1 ? "View Final Results 🏆" : "Next Item →"}
          </button>
        </div>
      )}
    </div>
  );
}