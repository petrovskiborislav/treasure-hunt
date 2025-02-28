// @ts-expect-error since headbreaker is not typed
import * as headbreaker from "headbreaker";
import React, {useEffect, useRef, useState} from "react";
import Confetti from "react-confetti";

type JigsawProps = {
    id: string;
    pieceSize: number;
    image: string;
    onSolved: () => void;
};

function DemoJigsaw({id, pieceSize, image, onSolved}: JigsawProps) {
    const puzzleRef = useRef<HTMLDivElement>(null);
    const [canvasKey, setCanvasKey] = useState(0); // Key to force reinitialization

    const [canvasDimensions, setCanvasDimensions] = useState({
        width: 0,
        height: 0,
        computedPieceSize: pieceSize,
    });

    // Set the fixed number of pieces
    const horizontalPiecesCount = 5
    const verticalPiecesCount = 5;

    // Measure container dimensions and compute the size of each piece and canvas dimensions.
    useEffect(() => {
        if (document.getElementById('container')) {
            const computedPieceSize = 75;
            const canvasWidth = computedPieceSize * horizontalPiecesCount * 1.5;
            const canvasHeight = computedPieceSize * verticalPiecesCount * 1.5;
            setCanvasDimensions({width: canvasWidth, height: canvasHeight, computedPieceSize});
        }
    }, [horizontalPiecesCount, verticalPiecesCount, id, canvasKey]);

    const imgObj = new Image();
    imgObj.src = image;
    imgObj.onload = () => {
        if (puzzleRef.current && puzzleRef.current.id) {
            const canvasInstance = new headbreaker.Canvas(puzzleRef.current.id, {
                width: canvasDimensions.width,
                height: canvasDimensions.height,
                image: imgObj,
                pieceSize: canvasDimensions.computedPieceSize,
                outline: new headbreaker.outline.Rounded(),
                preventOffstageDrag: true,
                fixed: true,
                painter: new headbreaker.painters.Konva(),
                borderFill: canvasDimensions.computedPieceSize / 20,
                strokeWidth: 2,
                lineSoftness: 0.3,
            });

            canvasInstance.adjustImagesToPuzzleHeight();
            canvasInstance.autogenerate({
                horizontalPiecesCount,
                verticalPiecesCount,
                insertsGenerator: headbreaker.generators.flipflop,
            });
            canvasInstance.shuffle(0.7);
            canvasInstance.draw();
            canvasInstance.attachSolvedValidator();
            canvasInstance.onValid(() => {
                const overlay = document.getElementById("validated-canvas-overlay");
                if (overlay) {
                    overlay.style.opacity = "1";
                }
                onSolved();
            });
        }
    }

    // Function to reinitialize the puzzle
    const handleReinitialize = () => {
        setCanvasKey(canvasKey + 1); // Update key to trigger reinitialization
    };


    return (
        <div className="relative flex flex-col items-center justify-center">
            <div
                ref={puzzleRef}
                id={id}
                className="flex border-2 border-pink-300 rounded-xl shadow-2xl p-4 bg-white/60"
            >
            </div>
            <img
                id="validated-canvas-overlay"
                alt="overlay"
                src={image}
                className="top-0 left-0 absolute w-full h-full transition-opacity duration-500 opacity-0 pointer-events-none"
            />
            <button
                onClick={handleReinitialize}
                className="mt-4 w-1/2 bg-purple-400 hover:bg-purple-500 text-white px-4 py-2 rounded shadow transition duration-300 ease-in-out transform hover:scale-105"
            >
                Размести отново
            </button>
        </div>
    );
}

type Question = {
    question: string;
    options: string[];
    answer: string;
};

function PuzzleCycle({onSolve, setShowConfetti}: { onSolve: () => void, setShowConfetti: (value: boolean) => void }) {
    const images = [
        "/assets/italy.jpg",
        "/assets/japan.jpg",
        "/assets/london.jpg",
        "/assets/plovdiv.jpg",
        "/assets/ireland.jpg",
    ];

    const questions: Question[] = [
        {
            question: "С коя държава свързваш този нареден пъзел?",
            options: ["Франция", "Италия", "Испания"],
            answer: "Италия",
        },
        {
            question: "С коя държава свързваш този нареден пъзел?",
            options: ["Германия", "Белгия", "Япония"],
            answer: "Япония",
        },
        {
            question: "С кой град свързваш този нареден пъзел?",
            options: ["Лондон", "Париж", "Рим"],
            answer: "Лондон",
        },
        {
            question: "За кой град ти напомня този нареден пъзел?",
            options: ["Хасково", "Стара Загора", "Пловдив"],
            answer: "Пловдив",
        },
        {
            question: "С кой факт свързваш този наредн пъзел?",
            options: ["Англия има над 5000 замъка", "Ирландия има над 30000 замъка", "Дания има над 15000 замъка"],
            answer: "Ирландия има над 30000 замъка",
        },
    ];

    // Fixed values for this example:
    // We pass a default pieceSize value (this will be re-computed in DemoJigsaw)
    const defaultPieceSize = 100;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [allSolved, setAllSolved] = useState(false);
    const [showQuestion, setShowQuestion] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handlePuzzleSolvedFromPuzzle = () => {
        setShowQuestion(true);
    };

    const handleAnswerSelection = (option: string) => {
        setSelectedOption(option);
        if (option === questions[currentIndex].answer) {
            setTimeout(() => {
                setShowQuestion(false);
                setSelectedOption(null);
                if (currentIndex < images.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    setAllSolved(true);
                }
            }, 200);
        }
    };

    if (allSolved) {
        setShowConfetti(true);
        setTimeout(() => {
            onSolve()
        }, 6000);
    }

    return (
        <div id="container" className="h-2/3 w-full grow flex flex-col md:flex-row justify-center items-start gap-8">
            {/* Puzzle container with fixed dimensions where the jigsaw should fit exactly */}
            <div className="justify-center items-center">
                <DemoJigsaw
                    key={currentIndex}
                    id="puzzle"
                    pieceSize={defaultPieceSize}
                    image={images[currentIndex]}
                    onSolved={handlePuzzleSolvedFromPuzzle}
                />
            </div>
            {/* Question container */}
            <div className="flex flex-col justify-center items-center">
                {showQuestion ? (
                    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
                        <p className="text-xl mb-4 text-pink-700">
                            {questions[currentIndex].question}
                        </p>
                        <div className="flex flex-col space-y-3">
                            {questions[currentIndex].options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleAnswerSelection(option)}
                                    className={`px-4 py-2 rounded-md border transition-colors ${
                                        selectedOption
                                            ? option === questions[currentIndex].answer
                                                ? "bg-green-300 border-green-500"
                                                : option === selectedOption
                                                    ? "bg-red-300 border-red-500"
                                                    : "bg-gray-100 border-gray-300"
                                            : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        {selectedOption &&
                            selectedOption !== questions[currentIndex].answer && (
                                <p className="mt-4 text-red-500">Опитай отново 😘!</p>
                            )}
                    </div>
                ) : (
                    <div className="w-full max-w-md p-6 bg-gray-100 rounded-xl shadow-inner">
                        <p className="text-lg text-gray-700">
                            Подреди пъзела и след това отговори на въпроса.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const JigsawPuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    const [showConfetti, setShowConfetti] = useState(false);

    return (
        <div
            className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-pink-300 to-yellow-100 p-4">

            {showConfetti && <Confetti recycle={false} numberOfPieces={500}/>}

            <h2 className="text-3xl md:text-5xl text-center font-bold text-white m-14">
                Нареди пъзелите и отговори на въпросите! 💖
            </h2>

            <PuzzleCycle onSolve={onSolve} setShowConfetti={setShowConfetti}/>
        </div>
    );
}

export default JigsawPuzzle;