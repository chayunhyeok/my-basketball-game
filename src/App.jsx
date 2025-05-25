// App.jsx
import React, { useState } from "react";
import GameCanvas from "./components/GameCanvas";
import "./App.css";
function App() {
  const [score, setScore] = useState(0);
  
  return (
    <div className="game-container">
      <div className="score">incoding: {score}</div>
      <GameCanvas onScore={() => setScore(score + 1)} />
    </div>
  );
}

export default App;