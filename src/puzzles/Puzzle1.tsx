import React, { useState } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const correctAnswer = "СЛАДУРО ТОВА Е ЕДИН СПЕЦИАЛЕН ПЪЗЕЛ".split(" ").map((word) => word.split(""));
const shuffledLetters = correctAnswer.flat().sort(() => Math.random() - 0.5);

const DraggableLetter = ({
                             letter,
                             id,
                         }: {
    letter: string;
    id: string;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        boxShadow: isDragging ? "0 5px 8px rgba(0, 0, 0, 0.2)" : undefined,
        cursor: "grab",
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="px-3 py-1 bg-blue-500 text-white text-lg font-semibold flex items-center justify-center rounded-md shadow-md"
        >
            {letter}
        </div>
    );
};

const DroppableSlot = ({
                           wordIndex,
                           letterIndex,
                           letter,
                           isCorrect,
                       }: {
    wordIndex: number;
    letterIndex: number;
    letter: string | null;
    isCorrect: boolean;
}) => {
    const { setNodeRef } = useDroppable({
        id: `slot-${wordIndex}-${letterIndex}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={`m-0.5 w-10 h-10 border-2 text-lg text-center font-semibold flex items-center justify-center ${
                isCorrect ? "bg-green-500 text-white border-green-700" : "bg-gray-100 border-gray-400"
            }`}
        >
            {letter ? <DraggableLetter letter={letter} id={`slotLetter-${wordIndex}-${letterIndex}`} /> : "_"}
        </div>
    );
};

const Puzzle1: React.FC<{ onSolve: () => void }> = ({ onSolve }) => {
    const [placedLetters, setPlacedLetters] = useState<(string | null)[][]>(
        correctAnswer.map((word) => word.map(() => null)) // Initially all null
    );

    const [availableLetters, setAvailableLetters] = useState(shuffledLetters);
    const [activeLetter, setActiveLetter] = useState<string | null>(null);

    const checkSolution = (currentPlacedLetters: (string | null)[][]) => {
        // Compare currentPlacedLetters with correctAnswer
        const isSolved = JSON.stringify(currentPlacedLetters) === JSON.stringify(correctAnswer);
        if (isSolved) {
            onSolve();
        }
    };

    const handleDrop = (
        letter: string,
        targetWordIndex: number | null,
        targetLetterIndex: number | null,
        source: { type: "available"; index: number } | { type: "placed"; wordIndex: number; letterIndex: number }
    ) => {
        const updatedPlacedLetters = placedLetters.map((word) => [...word]);
        let replacedLetter: string | null = null;

        if (source.type === "available") {
            // Remove the letter from the available pool
            setAvailableLetters((prev) => prev.filter((_, i) => i !== source.index));
        } else if (source.type === "placed") {
            // Remove the letter from its original slot
            updatedPlacedLetters[source.wordIndex][source.letterIndex] = null;
        }

        if (targetWordIndex !== null && targetLetterIndex !== null) {
            // Check if the target slot already has a letter
            replacedLetter = updatedPlacedLetters[targetWordIndex][targetLetterIndex];

            // Place the new letter in the target slot
            updatedPlacedLetters[targetWordIndex][targetLetterIndex] = letter;
        } else {
            // Return the letter to the available pool
            setAvailableLetters((prev) => [...prev, letter]);
        }

        // If a letter was replaced, return it to the available pool
        if (replacedLetter) {
            setAvailableLetters((prev) => [...prev, replacedLetter]);
        }

        setPlacedLetters(updatedPlacedLetters);

        // Check if the puzzle is solved
        checkSolution(updatedPlacedLetters);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active && over) {
            const activeId = active.id.toString();
            const overId = over.id.toString();

            if (activeId.startsWith("letter-")) {
                // Dragging from available letters to a slot
                const activeIndex = parseInt(activeId.replace("letter-", ""), 10);
                const letter = availableLetters[activeIndex];
                if (overId.startsWith("slot-")) {
                    const [, targetWordIndex, targetLetterIndex] = overId.split("-").map(Number);
                    handleDrop(letter, targetWordIndex, targetLetterIndex, {
                        type: "available",
                        index: activeIndex,
                    });
                }
            } else if (activeId.startsWith("slotLetter-")) {
                // Dragging from one slot to another or back to available
                const [, sourceWordIndex, sourceLetterIndex] = activeId.split("-").map(Number);
                const letter = placedLetters[sourceWordIndex][sourceLetterIndex];
                if (overId.startsWith("slot-")) {
                    const [, targetWordIndex, targetLetterIndex] = overId.split("-").map(Number);
                    handleDrop(letter!, targetWordIndex, targetLetterIndex, {
                        type: "placed",
                        wordIndex: sourceWordIndex,
                        letterIndex: sourceLetterIndex,
                    });
                } else {
                    handleDrop(letter!, null, null, {
                        type: "placed",
                        wordIndex: sourceWordIndex,
                        letterIndex: sourceLetterIndex,
                    });
                }
            }
        }

        setActiveLetter(null);
    };

    const handleDragStart = (event: DragEndEvent) => {
        const activeID = event.active.id.toString();
        if (activeID.startsWith("letter-")) {
            const activeIndex = parseInt(activeID.replace("letter-", ""), 10);
            setActiveLetter(availableLetters[activeIndex]);
        } else if (activeID.startsWith("slotLetter-")) {
            const [, wordIndex, letterIndex] = activeID.split("-").map(Number);
            setActiveLetter(placedLetters[wordIndex][letterIndex]);
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 text-center">
                {/* Puzzle Title */}
                <h2 className={`text-2xl font-semibold mb-4`}>
                    Подредете буквите в правилния ред:
                </h2>

                {/* Puzzle Grid */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300">
                    {correctAnswer.map((word, wordIndex) => (
                        <div key={wordIndex} className="flex p-4">
                            {word.map((correctLetter, letterIndex) => (
                                <DroppableSlot
                                    key={letterIndex}
                                    wordIndex={wordIndex}
                                    letterIndex={letterIndex}
                                    letter={placedLetters[wordIndex][letterIndex]}
                                    isCorrect={placedLetters[wordIndex][letterIndex] === correctLetter}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Draggable Letters */}
                <div className="flex gap-2 mt-4 flex-wrap">
                    {availableLetters.map((letter, index) => (
                        <DraggableLetter key={index} letter={letter} id={`letter-${index}`} />
                    ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeLetter ? (
                        <div className="px-2 py-1 bg-blue-500 text-white text-lg font-semibold flex items-center justify-center rounded-md shadow-md scale-110">
                            {activeLetter}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default Puzzle1;