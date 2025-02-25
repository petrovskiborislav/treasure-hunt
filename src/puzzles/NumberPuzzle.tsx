import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { DndContext, closestCenter, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


/**
 * Represents a step in a puzzle with a description, hints, and a method to compute the answer.
 *
 * @property {string} description - A descriptive text detailing the specific puzzle step.
 * @property {string[]} hints - A list of hints or clues to assist in solving the puzzle step.
 * @property {function} getAnswer - A function that calculates the answer to the current puzzle step based on a previous number.
 * @param {number} prev - The previous step's number or input to use in the calculation.
 * @returns {number} The calculated answer for the current puzzle step.
 */
interface PuzzleStep {
    description: string;
    hints: string[];
    getAnswer: (prev: number) => number;
}

/**
 * This interface is used to define the structure of the props necessary to uniquely identify a draggable item.
 *
 * Properties:
 * - id: A unique string identifier for the draggable item.
 */
interface DraggableItemProps {
    id: string;
}

/**
 * DraggableItem is a React functional component designed for creating draggable items.
 * It utilizes the `useSortable` hook to manage drag-and-drop interactions.
 *
 * The component automatically applies styling and necessary attributes for drag-and-drop functionality,
 * including listeners and transformation effects such as smooth transitions.
 *
 * Props:
 * - `id` (string): The unique identifier for the draggable item. It is passed to the `useSortable` hook
 *   and is used to render the content of the draggable element.
 *
 * Features:
 * - Drag-and-drop support.
 * - Dynamic styling based on the current drag-and-drop state.
 */
const DraggableItem: React.FC<DraggableItemProps> = ({ id }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded shadow m-1 cursor-move"
        >
            {id}
        </div>
    );
};

/**
 * TrashDropZone is a React functional component that represents a droppable area for a trash zone.
 * It utilizes the `useDroppable` hook to create a drop area and reacts to drag-and-drop interactions.
 * The component visually changes its appearance when an item is being dragged over it.
 *
 * Features:
 * - Implements a droppable region with the ID "trash".
 * - Highlights the area with a different background color (`bg-red-300`) when an item is dragged over.
 * - Displays a default appearance with a dashed border and a specific background color (`bg-red-100`) when not active.
 *
 * Returns:
 * React element representing the trash drop zone.
 */
const TrashDropZone: React.FC = () => {
    const { setNodeRef, isOver } = useDroppable({ id: "trash" });
    return (
        <div
            ref={setNodeRef}
            className={`w-32 h-16 border-4 rounded-lg border-dashed flex items-center justify-center mt-6 
        ${isOver ? "bg-red-300" : "bg-red-100"}`}
        >
            Кошче
        </div>
    );
};

const NumberPuzzle: React.FC<{ onSolve: () => void }> = ({ onSolve }) => {
    const steps: PuzzleStep[] = [
        {
            description: "Стъпка 1: Колко е 9 на квадрат",
            hints: ["Подсказка: Умножи 9 по себе си (9 × 9)."],
            getAnswer: () => 81,
        },
        {
            description:
                "Стъпка 2: Извади сумата от любимите ни числа (твоето + моето) от предишния отговор.",
            hints: [
                "Подсказка: 5 + 4 е равно на 9. Извади го от предишния резултат.",
                "Подсказка: 81 - 9 е равно на 72.",
            ],
            getAnswer: (prev) => prev - (5 + 4), // 81 - 9 = 72.
        },
        {
            description:
                "Стъпка 3: Извади два пъти сумата от любимите ни числа (2 × (твоето + моето)) от предишния резултат, за да разкриеш тайния код. След това подреди цифрите правилно. Също така премахни всички подвеждащи цифри, като ги плъзнете в кошчето.",
            hints: [
                "Подсказка: 2 × (5 + 4) е равно на 18.",
                "Подсказка: 72 - 18 дава 54.",
            ],
            getAnswer: (prev) => prev - 2 * (5 + 4), // 72 - 18 = 54.
        },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [hintsShown, setHintsShown] = useState<{ hint1: boolean; hint2: boolean }>({hint1: false, hint2: false});

    // Store the result of the last successful step.
    const [previousResult, setPreviousResult] = useState<number>(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [animateLock, setAnimateLock] = useState(false);

    // For the final interactive step:
    // mainItems holds the digits intended for the secret code (both correct and decoy).
    // trashItems will store decoy digits that the user removes.
    const [mainItems, setMainItems] = useState<string[]>([]);
    const [trashItems, setTrashItems] = useState<string[]>([]);

    /**
     * Initializes the final step of the process by setting up correct digits, decoy digits, and shuffling them into a combined array.
     * This function also clears out previous "trash" items for a fresh start.
     *
     * The function performs the following operations:
     * - Defines the correct digits that need to be included.
     * - Defines additional decoy digits to add complexity.
     * - Combines the correct digits and decoy digits into a single array.
     * - Shuffles the combined array to randomize the order of the digits.
     * - Updates the main items with the shuffled digits.
     * - Resets the trash items to an empty array.
     */
    const initFinalStep = () => {
        const correctDigits = ["5", "4"];
        const decoyDigits = ["7", "9", "1", "3"];
        const combined = [...correctDigits, ...decoyDigits];

        // Shuffle the digits for extra complexity.
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setMainItems(shuffled);
        setTrashItems([]);
    };

    /**
     * Handles the submission of a textual input form within an interactive multistep puzzle.
     *
     * @param {React.FormEvent} e - The form submission event.
     *
     * This method evaluates the user's answer against the correct answer for the current step.
     * If the answer is correct, it provides positive feedback, animates a transition lock, and updates the
     * state to progress to the next step. It also manages additional state for user feedback, hints, confetti
     * display, and final step initialization if applicable.
     *
     * If the answer is incorrect, it provides negative feedback and reveals progressively more hints
     * based on user attempts. The state of revealed hints is also updated accordingly.
     */
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const correctAnswer = steps[currentStep].getAnswer(previousResult);
        if (userAnswer.trim() === correctAnswer.toString()) {
            setFeedback("Правилно! Преминаване към следващата стъпка.");
            setAnimateLock(true);
            setTimeout(() => {
                setPreviousResult(correctAnswer);
                if (currentStep < steps.length - 1) {
                    const nextStep = currentStep + 1;
                    setCurrentStep(nextStep);
                    setUserAnswer("");
                    setFeedback("");
                    setAnimateLock(false);
                    setHintsShown({ hint1: false, hint2: false });

                    // Prepare the final interactive step.
                    if (nextStep === 2) {
                        initFinalStep();
                    }
                } else {
                    setFeedback("Поздравления панда 💕! Ти реши този пъзел!");
                    setShowConfetti(true);
                    setTimeout(() => {
                        onSolve();
                    }, 7000);
                }
            }, 1000);
        } else {
            setFeedback("Упс, не е правилно. Опитай отново 💕!");
            if (!hintsShown.hint1) {
                setHintsShown({ ...hintsShown, hint1: true });
            } else if (!hintsShown.hint2 && steps[currentStep].hints.length > 1) {
                setHintsShown({ ...hintsShown, hint2: true });
            }
        }
    };

    /**
     * Handles the drag-and-drop "end" event, determining the appropriate actions based on the drag source and drop target.
     *
     * @param {DragEndEvent} event - The event object containing details about the drag-and-drop action.
     *
     * The function performs the following actions:
     * 1. If there is no drop target (`over` is null or undefined), the function exits early.
     * 2. If the dragged item is dropped over a "trash" zone, it removes the item from `mainItems`
     *    and adds it to `trashItems`.
     * 3. If the dragged item is dropped back onto the main drop zone, updates the order of items in `mainItems`
     *    based on the indices of the drag source and drop target.
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id as string;
        // If dropped over the trash area, remove the digit from mainItems.
        if (over.id === "trash") {
            setMainItems((items) => items.filter((item) => item !== activeId));
            setTrashItems((old) => [...old, activeId]);
            return;
        }
        // If dropped over the main drop zone, update the order.
        const oldIndex = mainItems.indexOf(activeId);
        const newIndex = mainItems.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(mainItems, oldIndex, newIndex);
            setMainItems(newOrder);
        }
    };

    // Reset handler for the final step.
    const resetFinalStep = () => {
        initFinalStep();
        setFeedback("Последната стъпка беше нулирана. Опитай отново!");
    };

    // Check if the final puzzle is solved.
    // The puzzle is solved if only the two correct digits remain in the main area in the exact order: "5" then "4".
    useEffect(() => {
        if (currentStep === 2) {
            if (mainItems.length === 2 && mainItems.join("") === "54") {
                setFeedback("Да 🐼! Тайният код е разкрит! Tова са нашите любими числа!");
                setShowConfetti(true);
                setTimeout(() => {
                    onSolve();
                }, 7000);
            }
        }
    }, [mainItems, currentStep, onSolve]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-yellow-300 via-red-300 to-pink-400 p-6">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
            {/* Title */}
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-6">
                Интерактивен числов 🧩: Разгадай кода!
            </h2>

            {/* Visual Lock Display */}
            <div className="lock-display flex items-center justify-center p-4 mb-6">
                <div
                    className={`w-24 h-24 flex items-center justify-center bg-green-500 text-white text-2xl font-bold shadow-lg rounded-md transition-transform duration-500 ${
                        animateLock ? "scale-110" : ""
                    }`}
                >
                    {currentStep > 0 ? previousResult : "?"}
                </div>
                <div className="mx-4 text-white text-xl">→</div>
                <div className="w-24 h-24 flex items-center justify-center bg-yellow-500 text-white text-2xl font-bold shadow-lg rounded-md">
                    ?
                </div>
            </div>

            {/* Step Description */}
            <p className="text-3xl  text-center text-white mb-4 max-w-6xl">
                {steps[currentStep].description}
            </p>

            {/* Steps 1 & 2: User submits answer via text input */}
            {currentStep < 2 && (
                <form onSubmit={handleTextSubmit} className="flex flex-col items-center gap-4">
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Въведи отговор..."
                        className="px-4 py-2 w-72 text-lg border-2 border-yellow-400 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-yellow-700 hover:bg-red-900 text-white text-lg font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        Изпрати
                    </button>
                </form>
            )}

            {/* Final Step: Interactive Drag and Drop */}
            {currentStep === 2 && mainItems.length > 0 && (
                <div className="w-full flex flex-col items-center">
                    <p className="text-2xl mb-4 text-white">
                        Подреди цифрите в основната зона в правилния ред, за да съставиш тайният код.
                        Премахни всички подвеждащи цифри, като ги сложиш в кошчето.
                    </p>
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={mainItems} strategy={horizontalListSortingStrategy}>
                            <div className="flex p-4 bg-white rounded shadow-lg">
                                {mainItems.map((item) => (
                                    <DraggableItem key={item} id={item} />
                                ))}
                            </div>
                        </SortableContext>
                        <TrashDropZone />
                    </DndContext>
                    <div className="flex flex-col items-center mt-4">
                        <p className="text-white">
                            Подредба в основната зона: {mainItems.join(" - ")} <br />
                            Кошче: {trashItems.join(" - ")}
                        </p>
                        <button
                            onClick={resetFinalStep}
                            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-900 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                        >
                            Нулиране
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback */}
            {feedback && (
                <div className="mt-4 text-lg font-semibold text-center text-white">
                    {feedback}
                </div>
            )}

            {/* Hints */}
            {hintsShown.hint1 && (
                <div className="mt-2 text-md italic font-light text-center text-white">
                    {steps[currentStep].hints[0]}
                </div>
            )}
            {hintsShown.hint2 && steps[currentStep].hints[1] && (
                <div className="mt-2 text-md italic font-light text-center text-white">
                    {steps[currentStep].hints[1]}
                </div>
            )}
        </div>
    );
};

export default NumberPuzzle;