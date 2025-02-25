import React, { useState } from "react";
import WordsArrangePuzzle from "../puzzles/WordsArrangePuzzle.tsx";
import FirstPicturePuzzle from "../puzzles/FirstPicturePuzzle.tsx";
import PandaVisionPuzzle from "../puzzles/PandaVisionPuzzle.tsx";
import BilliardsInteractivePuzzle    from "../puzzles/BilliardsChallengePuzzle.tsx";
import NumberPuzzle from "../puzzles/NumberPuzzle.tsx";

const puzzleComponents = [  NumberPuzzle, BilliardsInteractivePuzzle, PandaVisionPuzzle,FirstPicturePuzzle,WordsArrangePuzzle,];

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