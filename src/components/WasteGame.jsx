import { useState } from "react";
import wasteItems from "../data/wasteQuestions";
import "./WasteGame.css";

const QUESTIONS_PER_GAME = 10;

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
    label: "Special Waste",
    description: "Hazardous / Medical",
  },
  {
    id: "ewaste",
    icon: "♻️",
    label: "E-Waste",
    description: "Electronics",
  },
];


const getRandomQuestions = () => {
  const shuffled = [...wasteItems];

  // Fisher-Yates Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1)
    );

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled.slice(0, QUESTIONS_PER_GAME);
};


export default function WasteGame() {
  const [gameQuestions, setGameQuestions] = useState(
    getRandomQuestions
  );

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);


  const currentItem = gameQuestions[current];


  const handleAnswer = (binId) => {
    if (selected !== null) return;

    setSelected(binId);

    if (binId === currentItem.correct) {
      setScore((prev) => prev + 10);
    }
  };


  const nextQuestion = () => {
    if (current === gameQuestions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setSelected(null);
  };


  const restartGame = () => {
    setGameQuestions(getRandomQuestions());
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };


  if (finished) {
    const percentage =
      (score / (QUESTIONS_PER_GAME * 10)) * 100;

    return (
      <div className="game-card">
        <div className="game-result">

          <div className="trophy">
            {percentage === 100
              ? "🏆"
              : percentage >= 70
              ? "🌟"
              : "🌱"}
          </div>

          <h2>Challenge Complete!</h2>

          <p>Your Score</p>

          <div className="final-score">
            {score} / 100
          </div>

          <p className="result-message">
            {percentage === 100
              ? "🌟 Perfect! You are an Eco Champion!"
              : percentage >= 80
              ? "♻️ Excellent! You know waste segregation very well!"
              : percentage >= 60
              ? "🌱 Good job! Keep improving your waste knowledge!"
              : "📚 Keep learning! Every correct choice helps the planet."}
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

          <p>
            Choose the correct place for the waste!
          </p>
        </div>

        <div className="score">
          ⭐ {score}
        </div>

      </div>


      <div className="progress">
        Question {current + 1} / {QUESTIONS_PER_GAME}
      </div>


      <div className="waste-item">

        <div className="waste-icon">
          {currentItem.item}
        </div>

        <h3>{currentItem.name}</h3>

        <p>
          Where should this go?
        </p>

      </div>


      <div className="bins">

        {bins.map((bin) => {

          let className = "bin";


          if (selected !== null) {

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

              <strong>
                {bin.label}
              </strong>

              <small>
                {bin.description}
              </small>

            </button>
          );
        })}

      </div>


      {selected !== null && (

        <div
          className={`feedback ${
            isCorrect
              ? "success"
              : "error"
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

            {current ===
            gameQuestions.length - 1
              ? "See Result 🏆"
              : "Next Question →"}

          </button>

        </div>

      )}

    </div>
  );
}