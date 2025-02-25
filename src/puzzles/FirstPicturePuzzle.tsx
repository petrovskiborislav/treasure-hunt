import React, { useState } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Confetti from "react-confetti";

const FirstPicturePuzzle: React.FC<{ onSolve: () => void }> = ({ onSolve }) => {
    // Correct answer for the puzzle (place name).
    const correctAnswer = "Мегалит Вратата на богинята";

    // State for the user input.
    const [userAnswer, setUserAnswer] = useState<string>("");

    // State to show feedback for the answer.
    const [feedback, setFeedback] = useState<string>("");

    // State to control hint visibility.
    const [showHint, setShowHint] = useState<boolean>(false);

    // Track if map is shown.
    const [showMapHint, setShowMapHint] = useState<boolean>(false);

    const [showConfetti, setShowConfetti] = useState(false);

    // Latitude and Longitude of Казанлък.
    const location = { lat: 42.61927418203289, lng: 25.39446447361693 };
    // Radius in meters 10km.
    const radius = 10000;


    // Function to handle form submission
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
            // If the answer is correct, proceed to the next puzzle
            setFeedback("Правилно! 🥰 Успя!");
            setShowConfetti(true);
            setTimeout(() => {
                setFeedback(""); // Clear feedback after a short delay
                setShowHint(false); // Hide the hint for the next puzzle
                setShowMapHint(false);
                onSolve(); // Move to the next puzzle
            }, 6000);
        } else {
            // If the answer is incorrect, show an error message.
            setFeedback("Опа, не съвсем правилно. Опитай отново! 💕");
            if (!showHint) {
                // Show first hint.
                setShowHint(true);
            } else {
                // Show map hint as the second hint.
                setShowMapHint(true);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-400 via-red-300 to-yellow-300 p-6">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            {/* Title */}
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-6">
                Къде направихме първата си снимка заедно? 💖
            </h2>

            {/* Image */}
            <div className="mb-6">
                <img
                    src="/assets/place-we-took-our-first-image.jpg"
                    alt="Place Puzzle"
                    className="w-full max-w-md rounded-lg shadow-lg border-4 border-pink-600"
                />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
                <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Въведи мястото тук..."
                    className="px-4 py-2 w-72 text-lg border-2 border-pink-400 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-pink-300"
                />
                <button
                    type="submit"
                    className="px-6 py-3 bg-pink-700 hover:bg-purple-900 text-white text-lg font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    Потвърди
                </button>
            </form>

            {/* Feedback */}
            {feedback && (
                <div className="mt-4 text-lg font-semibold text-center text-white">
                    {feedback}
                </div>
            )}

            {showHint && !showMapHint && (
                <div className="mt-2 text-md italic font-light text-center text-white">
                    📌 Намек: Помисли кога се е случило и къде сме били!
                </div>
            )}

            {/* Second Hint - Map with Radius */}
            {showMapHint && (
                <div className="mt-6 w-full max-w-md h-64 rounded-lg overflow-hidden shadow-lg">
                    <MapContainer
                        center= {location}
                        zoom={10}
                        scrollWheelZoom={true}
                        style={{ width: "100%", height: "100%" }}
                    >
                        {/* Map Tiles */}
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Circle Radius */}
                        <Circle
                            center={location}
                            radius={radius}
                            pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
                        />
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export default FirstPicturePuzzle;
