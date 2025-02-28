import React, {useEffect, useState} from "react";
import WordsArrangePuzzle from "../puzzles/WordsArrangePuzzle.tsx";
import FirstPicturePuzzle from "../puzzles/FirstPicturePuzzle.tsx";
import PandaVisionPuzzle from "../puzzles/PandaVisionPuzzle.tsx";
import BilliardsInteractivePuzzle from "../puzzles/BilliardsChallengePuzzle.tsx";
import NumberPuzzle from "../puzzles/NumberPuzzle.tsx";
import SwimmingPoolPuzzle from "../puzzles/SwimmingPoolPuzzle.tsx";
import CrosswordPuzzle from "../puzzles/FeatureCodePuzzle.tsx";
import JigsawPuzzle from "../puzzles/JigsawPuzzle.tsx";
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet"; // For the map
import "leaflet/dist/leaflet.css"; // Import Leaflet styles


const puzzleComponents = [
    SwimmingPoolPuzzle,
    BilliardsInteractivePuzzle,
    NumberPuzzle,
    PandaVisionPuzzle,
    WordsArrangePuzzle,
    FirstPicturePuzzle,
    JigsawPuzzle,
    CrosswordPuzzle,
];

const PuzzlePage: React.FC = () => {
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(() => {
        // Retrieve the saved index from localStorage (if it exists)
        const savedIndex = localStorage.getItem("currentPuzzleIndex");
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });
    const [isCompleted, setIsCompleted] = useState(false); // Track if all puzzles are solved

    const CurrentPuzzle = puzzleComponents[currentPuzzleIndex];

    const handleSolve = () => {
        if (currentPuzzleIndex < puzzleComponents.length - 1) {
            const nextIndex = currentPuzzleIndex + 1;
            setCurrentPuzzleIndex(nextIndex);
            localStorage.setItem("currentPuzzleIndex", nextIndex.toString()); // Save next index
        } else {
            localStorage.removeItem("currentPuzzleIndex"); // Clear saved index
            setIsCompleted(true); // Mark as completed
        }
    };

    // Ensure the current puzzle index is always saved when it changes
    useEffect(() => {
        localStorage.setItem("currentPuzzleIndex", currentPuzzleIndex.toString());
    }, [currentPuzzleIndex]);


    // Display congratulations screen when all puzzles are solved
    if (isCompleted) {
        return (
            <div
                className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-red-300">
                {/* Romantic Background Decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute top-10 left-10 w-20 h-20 bg-red-400 opacity-50 rounded-full animate-pulse"></div>
                    <div
                        className="absolute bottom-20 right-20 w-32 h-32 bg-pink-400 opacity-60 rounded-full animate-bounce"></div>
                    <div
                        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-purple-400 opacity-50 rounded-full"></div>
                    <div
                        className="absolute top-1/3 right-1/2 transform translate-x-1/2 w-40 h-40 bg-pink-200 opacity-30 rounded-full animate-ping"></div>
                </div>

                {/* Congratulations Message */}
                <h1 className="text-4xl font-bold text-white mb-6 animate-fade-in">
                    Поздравления Панда! ❤️🐼🎉
                </h1>
                <p className="text-2xl text-white font-light mb-6 max-w-1/3 text-center">
                    Tи реши всички пъзели! Като за финал те очаква един подарък на локацията. 🌹💌
                </p>

                {/* Romantic Map */}
                <div className="mt-4 w-4/5 lg:w-3/5 xl:w-1/2">
                    <MapContainer
                        center={[42.11953458038944, 24.72916323142459]} // Replace with actual location coordinates
                        zoom={13}
                        style={{height: "400px", borderRadius: "20px", overflow: "hidden"}}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[42.11953458038944, 24.72916323142459]}>
                            <Popup>
                                Тук се намира твоят подарък! 🎁💘
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        );
    }

    // Display the current puzzle
    return (
        <div>
            <CurrentPuzzle onSolve={handleSolve}/>
        </div>
    );
};

export default PuzzlePage;