import React, { useState } from "react";
import Puzzle1 from "../puzzles/Puzzle1";
import Puzzle2 from "../puzzles/Puzzle2";

const puzzleComponents = [Puzzle1, Puzzle2];

const PuzzlePage: React.FC = () => {
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const CurrentPuzzle = puzzleComponents[currentPuzzleIndex];

    const handleSolve = () => {
        if (currentPuzzleIndex < puzzleComponents.length - 1) {
            setCurrentPuzzleIndex(currentPuzzleIndex + 1);
        } else {
            alert("Congratulations! You solved all the puzzles!");
        }
    };

    return (
        <div>
            <CurrentPuzzle onSolve={handleSolve} />
        </div>
    );
};

export default PuzzlePage;