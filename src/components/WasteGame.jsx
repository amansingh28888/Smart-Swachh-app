import { useState } from "react";
import "./WasteGame.css";

const wasteItems = [
  {
    item: "🍌",
    name: "Banana Peel",
    correct: "green",
    explanation:
      "Banana peels are biodegradable wet waste and can be composted.",
  },
  {
    item: "🍎",
    name: "Food Waste",
    correct: "green",
    explanation:
      "Food waste is biodegradable and belongs in the wet waste bin.",
  },
  {
    item: "📰",
    name: "Newspaper",
    correct: "blue",
    explanation:
      "Clean and dry paper can be recycled with dry waste.",
  },
  {
    item: "🧴",
    name: "Plastic Bottle",
    correct: "blue",
    explanation:
      "Clean plastic bottles should be separated for recycling.",
  },
  {
    item: "💉",
    name: "Used Syringe",
    correct: "red",
    explanation:
      "Used syringes are biomedical waste and require safe handling.",
  },
  {
    item: "🔋",
    name: "Battery",
    correct: "red",
    explanation:
      "Batteries contain harmful materials and should not go into normal waste.",
  },
  {
    item: "💻",
    name: "Old Laptop",
    correct: "ewaste",
    explanation:
      "Electronic devices should be given to authorised e-waste recyclers.",
  },
];

const bins = [
  {
    id: "green",
    icon: "🟢",
    label: "Green Bin",
    description: "Wet / Biodegradable",
  },
  {
    id: "blue",
    icon: "🔵",
    label: "Blue Bin",
    description: "Dry / Recyclable",
  },
  {
    id: "red",
    icon: "🔴",
    label: "Red Bin",
    description: "Hazardous / Medical",
  },
  {
    id: "ewaste",
    icon: "♻️",
    label: "E-Waste",
    description: "Electronics",
  },
];

export default function WasteGame() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const currentItem = wasteItems[current];

  const handleAnswer = (binId) => {
    if (selected) return;

    setSelected(binId);

    if (binId === currentItem.correct) {
      setScore((prev) => prev + 10);
    }
  };

  const nextQuestion = () => {
    if (current === wasteItems.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setSelected(null);
  };

  const restartGame = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="game-card">
        <div className="game-result">
          <div className="trophy">🏆</div>

          <h2>Challenge Complete!</h2>

          <p>Your Score</p>

          <div className="final-score">
            {score} / {wasteItems.length * 10}
          </div>

          <p className="result-message">
            {score === wasteItems.length * 10
              ? "🌟 Perfect! You are an Eco Champion!"
              : score >= 40
              ? "♻️ Great job! You know waste segregation well!"
              : "🌱 Keep learning! Every correct choice helps the planet."}
          </p>

          <button
            className="restart-btn"
            onClick={restartGame}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  const isCorrect =
    selected === currentItem.correct;

  return (
    <div className="game-card">

      <div className="game-header">
        <div>
          <h2>♻️ SmartSort Challenge</h2>

          <p>Choose the correct place for the waste!</p>
        </div>

        <div className="score">
          ⭐ {score}
        </div>
      </div>

      <div className="progress">
        Question {current + 1} / {wasteItems.length}
      </div>

      <div className="waste-item">
        <div className="waste-icon">
          {currentItem.item}
        </div>

        <h3>{currentItem.name}</h3>

        <p>Where should this go?</p>
      </div>

      <div className="bins">

        {bins.map((bin) => {

          let className = "bin";

          if (selected) {

            if (
              bin.id === currentItem.correct
            ) {
              className += " correct";
            } else if (
              bin.id === selected
            ) {
              className += " wrong";
            }

          }

          return (
            <button
              key={bin.id}
              className={className}
              onClick={() =>
                handleAnswer(bin.id)
              }
              disabled={selected !== null}
            >
              <span className="bin-icon">
                {bin.icon}
              </span>

              <strong>{bin.label}</strong>

              <small>
                {bin.description}
              </small>
            </button>
          );
        })}

      </div>

      {selected && (
        <div
          className={`feedback ${
            isCorrect ? "success" : "error"
          }`}
        >
          <h3>
            {isCorrect
              ? "🎉 Correct!"
              : "❌ Not quite!"}
          </h3>

          <p>
            {currentItem.explanation}
          </p>

          <button
            className="next-btn"
            onClick={nextQuestion}
          >
            {current === wasteItems.length - 1
              ? "See Result 🏆"
              : "Next Question →"}
          </button>
        </div>
      )}

    </div>
  );
}