import React, {useEffect, useState} from "react";
import Confetti from "react-confetti";

// Define the type for each floating item.
type PoolItem = {
    id: string;
    letter: string;
    order: number | null;
    top: string;
    left: string;
};

// Helper to return a random percentage string between min and max.
const randomPercent = (min: number, max: number): string =>
    `${Math.floor(Math.random() * (max - min + 1) + min)}%`;

// The full correct answer (spaces removed): "БАСЕЙНЪТНАВСИ"
const correctLetters = ["Б", "А", "С", "Е", "Й", "Н", "Ъ", "Т", "Н", "А", "В", "С", "И"];

// Build initial pool items with correct letters and decoys.
const createInitialPoolItems = (): PoolItem[] => {
    const correctItems: PoolItem[] = correctLetters.map((letter, index) => ({
        id: `correct-${index}`,
        letter,
        order: index,
        top: randomPercent(10, 70),
        left: randomPercent(10, 70),
    }));

    const decoyLetters = ["О", "К", "Р", "Л", "П", "Д"];
    const decoyItems: PoolItem[] = decoyLetters.map((letter, index) => ({
        id: `decoy-${index}`,
        letter,
        order: null,
        top: randomPercent(10, 70),
        left: randomPercent(10, 70),
    }));

    return [...correctItems, ...decoyItems];
};

const SwimmingPoolPuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    const [poolItems, setPoolItems] = useState<PoolItem[]>(createInitialPoolItems());
    const [progress, setProgress] = useState<number>(0);
    const [revealedLetters, setRevealedLetters] = useState<string[]>([]);
    const [clickedItems, setClickedItems] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<string>("");
    const [showConfetti, setShowConfetti] = useState(false);

    // Update positions every 3 seconds while the puzzle is unsolved.
    useEffect(() => {
        if (showConfetti) return;
        const interval = setInterval(() => {
            setPoolItems(prevItems =>
                prevItems.map(item => ({
                    ...item,
                    top: randomPercent(10, 70),
                    left: randomPercent(10, 70),
                }))
            );
        }, 3000);
        return () => clearInterval(interval);
    }, [showConfetti]);

    const handleItemClick = (item: PoolItem) => {
        if (clickedItems.includes(item.id)) return;

        // If the clicked letter is the next in sequence.
        if (item.order === progress) {
            setRevealedLetters(prev => [...prev, item.letter]);
            setClickedItems(prev => [...prev, item.id]);
            const newProgress = progress + 1;
            setProgress(newProgress);
            setFeedback("");

            if (newProgress === correctLetters.length) {
                setShowConfetti(true);
                setTimeout(() => {
                    onSolve();
                }, 6000);
            }
        } else if (item.order !== null) {
            // If it's a correct letter but not the next expected, ignore the click.
            return;
        } else {
            // Decoy letter clicked – reset progress.
            setFeedback("Неправилен избор! Опитайте отново 💕.");
            resetProgress();
        }
    };

    const resetProgress = () => {
        setProgress(0);
        setRevealedLetters([]);
        setClickedItems([]);
        setTimeout(() => {
            setFeedback("");
        }, 2000);
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{
                // A transitioning gradient that blends a romantic pink with a soft blue.
                background: "linear-gradient(135deg, #f5c6c6, #a1c4fd)",
            }}
        >
            {showConfetti && <Confetti recycle={false} numberOfPieces={500}/>}

            <h2 className="text-4xl font-bold text-gray-800 mb-4">Там където се запознахме ❤️‍🔥</h2>
            <p className="text-2xl text-gray-800 mb-6 text-center max-w-2lg">
                Кликай върху плаващите предмети в правилния ред, за да откриеш тайната дума.<br/>
            </p>

            {/* Puzzle area with styling similar to other puzzles */}
            <div
                className="relative w-full max-w-4xl h-[500px] border-4 rounded shadow-lg overflow-hidden"
                style={{
                    // The container uses a soft base color that complements the swimming pool image.
                    backgroundColor: "#e0f7fa",
                    borderColor: "#039be5",
                    backgroundImage: 'url("../assets/swimming-pool.jpg")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "background 1s ease-in-out",
                }}
            >
                {poolItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        disabled={clickedItems.includes(item.id)}
                        style={{position: "absolute", top: item.top, left: item.left}}
                        className={`px-3 py-2 rounded-full ${
                            clickedItems.includes(item.id)
                                ? "bg-green-500 text-white opacity-70 cursor-default"
                                : "bg-white text-blue-700 hover:bg-blue-100"
                        }`}
                    >
                        {item.letter}
                    </button>
                ))}
            </div>

            <div className="mt-6 text-gray-800 text-2xl">
                Открити букви: {revealedLetters.join("")}
            </div>

            {feedback && (
                <div className="mt-4 text-red-500 text-xl">
                    {feedback}
                </div>
            )}
        </div>
    );
};

export default SwimmingPoolPuzzle;