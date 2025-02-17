import React, { useState } from "react";

type PuzzleProps = {
    onSolve: () => void;
};

const Puzzle2: React.FC<PuzzleProps> = ({ onSolve }) => {
    const [userInput, setUserInput] = useState("");
    const answer = "Мегалит Вратата на богинята";

    const checkAnswer = () => {
        if (userInput.toLowerCase() === answer.toLowerCase()) {
            onSolve();
        }
    };

    return (
        <div>
            <h2>Where did we take our first photo?</h2>
            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} />
            <button onClick={checkAnswer}>Submit</button>
        </div>
    );
};

export default Puzzle2;