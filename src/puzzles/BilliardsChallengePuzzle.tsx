import React, {useCallback, useEffect, useRef, useState} from "react";
import Confetti from "react-confetti";

/**
 * Represents a pool or billiard ball with properties for position, velocity, radius, color, and state.
 *
 * The Ball interface is used to define the attributes of the ball, including its physical
 * characteristics, current state (position, velocity), and whether it is active or pocketed.
 */
interface Ball {
    number: number;      // Ball number (0 for cue ball)
    x: number;          // Current x position
    y: number;          // Current y position
    vx: number;         // Velocity in x direction
    vy: number;         // Velocity in y direction
    radius: number;     // Ball radius
    color: string;      // Ball color
    active: boolean;    // Whether ball is in play or pocketed
    initialX: number;   // Starting x position for resets
    initialY: number;   // Starting y position for resets
}

/**
 * Represents the width of the canvas in pixels.
 * Used to define the horizontal dimension of the drawing area.
 */
const canvasWidth = 800;

/**
 * Represents the height of the canvas in pixels.
 * This variable determines the vertical dimension of the canvas element
 * which can be used for rendering graphical elements.
 */
const canvasHeight = 400;

/**
 * Represents the margin size for a table layout.
 *
 * The `tableMargin` variable defines the spacing (in pixels) to be used
 * around a table, ensuring consistent aesthetic appearance and alignment.
 *
 * It is commonly applied to provide padding or create separation between
 * a table and surrounding components or content within a user interface.
 */
const tableMargin = 40;

/**
 * Represents the left margin of a table.
 * The `feltLeft` variable is used to store the value for the margin on the left side of a table.
 * It is equivalent to the `tableMargin` value.
 */
const feltLeft = tableMargin;

/**
 * Represents the top margin of a table layout.
 * Assigns the value of `tableMargin` to control the spacing above the table.
 * This variable is used to ensure consistent visual alignment in the layout.
 */
const feltTop = tableMargin;

/**
 * Represents the calculated position indicating the rightmost boundary
 * of a drawing or layout area on the canvas. This position is determined
 * by subtracting the margin of the table from the total width of the canvas.
 *
 * @type {number}
 */
const feltRight = canvasWidth - tableMargin;

/**
 * The vertical position representing the bottom edge of the felt surface
 * in relation to the canvas. Calculated as the total canvas height minus
 * the margin allocated for the table.
 *
 * @type {number}
 */
const feltBottom = canvasHeight - tableMargin;

/**
 * Represents the base friction rate applied per second in a simulation or calculation.
 * This value determines the reduction factor affecting movement or velocity over time.
 *
 * Range: Typically between 0 (no friction) and 1 (maximum friction).
 * A lower value indicates higher friction, while a value closer to 1 indicates lower friction.
 */
const baseFrictionPerSec = 0.85;

/**
 * Represents the radius of a circular area referred to as "pocket".
 * This value is used to determine the size of the pocket area.
 *
 * @type {number}
 */
const pocketRadius = 30;

/**
 * Represents the positions of pockets on a rectangular layout, typically used in a game's playing surface.
 * Each pocket is defined by its coordinates on the felt (e.g., a playing table).
 *
 * @type {Array<{x: number, y: number}>}
 *
 * Properties:
 * - x: The horizontal coordinate of the pocket position.
 * - y: The vertical coordinate of the pocket position.
 */
const pockets = [
    {x: feltLeft, y: feltTop},
    {x: feltRight, y: feltTop},
    {x: feltLeft, y: feltBottom},
    {x: feltRight, y: feltBottom},
];

const availableBallNumbers = [2, 3, 7, 8, 11, 13, 17, 5, 6, 9, 12, 10];

const ballColorMap: { [key: number]: string } = {
    0: "white",         // Cue ball.
    2: "#E74C3C",
    3: "#9B59B6",
    7: "#F39C12",
    8: "#3498DB",
    11: "#2ECC71",
    13: "#E91E63",
    17: "#1ABC9C",
    5: "#F1C40F",
    6: "#FF9800",
    9: "#00BCD4",
    12: "#8BC34A",
    10: "#673AB7",
};

/**
 * Computes all possible unique target sums that can be formed by selecting subsets
 * of the given numbers array, where the subset size is at least 7 elements. The
 * function recursively explores all possible subsets, calculating their sums,
 * and stores unique results as output.
 *
 * @param {number[]} numbers - The array of numbers to calculate valid target sums from.
 * @returns {number[]} An array of unique target sums formed from subsets of the input array with at least 7 elements.
 */
const computeValidTargets = (numbers: number[]): number[] => {
    const results = new Set<number>();
    const n = numbers.length;
    const recurse = (index: number, count: number, sum: number) => {
        if (index === n) {
            if (count >= 7) {
                results.add(sum);
            }
            return;
        }
        // Include the current number.
        recurse(index + 1, count + 1, sum + numbers[index]);
        // Exclude the current number.
        recurse(index + 1, count, sum);
    };
    recurse(0, 0, 0);
    return Array.from(results);
};

/**
 * Generates a random target value based on the available ball numbers.
 *
 * This function computes valid targets using a predefined set of available ball numbers,
 * filters the targets to ensure they do not exceed the maximum possible sum of all available
 * ball numbers, and then randomly selects a target from the feasible targets.
 * If no feasible targets are found, the function defaults to returning the maximum possible sum.
 *
 * @function
 * @returns {number} A random target value from the list of feasible targets or the maximum possible sum if no feasible targets exist.
 */
const generateRandomTarget = () => {
    const validTargets = computeValidTargets(availableBallNumbers);
    const maxPossibleSum = availableBallNumbers.reduce((acc, v) => acc + v, 0);
    const feasibleTargets = validTargets.filter((target) => target <= maxPossibleSum);
    if (feasibleTargets.length === 0) {
        return maxPossibleSum;
    }
    return feasibleTargets[Math.floor(Math.random() * feasibleTargets.length)];
};

const BilliardsInteractivePuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastTimeRef = useRef<number | null>(null);

    const [feedback, setFeedback] = useState<string>("");
    const [aiming, setAiming] = useState<boolean>(false);
    const [aimPos, setAimPos] = useState<{ x: number; y: number } | null>(null);
    const [pocketedCount, setPocketedCount] = useState<number>(0);
    const [pocketedSum, setPocketedSum] = useState<number>(0);
    const [targetSum, setTargetSum] = useState<number>(generateRandomTarget());
    const [balls, setBalls] = useState<Ball[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    /**
     * Resets the game state to its initial configuration.
     *
     * This function:
     * - Resets the position and velocity of all balls to their initial values,
     *   and reactivates them.
     * - Resets the count of pocketed balls to zero.
     * - Resets the total sum of pocketed balls to zero.
     * - Generates a new target sum randomly and updates the game's target sum.
     * - Sets feedback to notify the user that the game has been reset and provides the new target.
     *
     * It ensures the game is reset and ready to start with a fresh state.
     */
    const resetGame = () => {
        setBalls((prevBalls) =>
            prevBalls.map((ball) => ({
                ...ball,
                x: ball.initialX,
                y: ball.initialY,
                vx: 0,
                vy: 0,
                active: true,
            }))
        );
        setPocketedCount(0);
        setPocketedSum(0);
        const newTarget = generateRandomTarget();
        setTargetSum(newTarget);
        setFeedback(`Сборът надвиши целта! Играта е рестартирана. Новата цел е ${newTarget}.`);
    };

    useEffect(() => {
        /**
         * Represents the initial set of balls for a game or simulation.
         */
        const initialBalls: Ball[] = [
            {
                number: 0,
                x: feltLeft + 60,
                y: canvasHeight / 2,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[0],
                active: true,
                initialX: feltLeft + 60,
                initialY: canvasHeight / 2,
            },
            {
                number: 2,
                x: 400,
                y: 80,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[2],
                active: true,
                initialX: 400,
                initialY: 80,
            },
            {
                number: 3,
                x: 600,
                y: 200,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[3],
                active: true,
                initialX: 600,
                initialY: 200,
            },
            {
                number: 7,
                x: 700,
                y: 320,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[7],
                active: true,
                initialX: 700,
                initialY: 320,
            },
            {
                number: 8,
                x: 450,
                y: 250,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[8],
                active: true,
                initialX: 450,
                initialY: 250,
            },
            {
                number: 11,
                x: 550,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[11],
                active: true,
                initialX: 550,
                initialY: 100,
            },
            {
                number: 13,
                x: 350,
                y: 150,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[13],
                active: true,
                initialX: 350,
                initialY: 150,
            },
            {
                number: 17,
                x: 650,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[17],
                active: true,
                initialX: 650,
                initialY: 300,
            },
            {
                number: 5,
                x: 250,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[5],
                active: true,
                initialX: 250,
                initialY: 100,
            },
            {
                number: 6,
                x: 200,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[6],
                active: true,
                initialX: 200,
                initialY: 300,
            },
            {
                number: 9,
                x: 500,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[9],
                active: true,
                initialX: 500,
                initialY: 300,
            },
            {
                number: 12,
                x: 300,
                y: 350,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[12],
                active: true,
                initialX: 300,
                initialY: 350,
            },
            {
                number: 10,
                x: 300,
                y: 200,
                vx: 0,
                vy: 0,
                radius: 15,
                color: ballColorMap[10],
                active: true,
                initialX: 300,
                initialY: 200,
            },
        ];
        setBalls(initialBalls);
        lastTimeRef.current = performance.now();
    }, []);

    /**
     * Renders a visually enhanced background onto a provided canvas context.
     *
     * The function draws a background consisting of three layers:
     * 1. A full canvas gradient to establish depth and overall coloring.
     * 2. A simulated wooden border using a gradient to mimic wood texture.
     * 3. A felt-like inner region with a vertical gradient to create realism.
     *
     * @param {CanvasRenderingContext2D} ctx - The rendering context of the canvas where the background will be drawn.
     */
    const renderBackground = (ctx: CanvasRenderingContext2D) => {
        // First, fill the entire canvas with a gradient to enhance depth.
        const overallGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        overallGradient.addColorStop(0, "#FDEFF8");
        overallGradient.addColorStop(1, "#E6D8EC");
        ctx.fillStyle = overallGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw wood border with its own gradient.
        const woodGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        woodGradient.addColorStop(0, "#8B5A2B");
        woodGradient.addColorStop(1, "#A0522D");
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the felt inside the wood border with a vertical gradient.
        const feltGradient = ctx.createLinearGradient(0, feltTop, 0, feltBottom);
        feltGradient.addColorStop(0, "#476A2E");
        feltGradient.addColorStop(1, "#185A22");
        ctx.fillStyle = feltGradient;
        ctx.fillRect(feltLeft, feltTop, canvasWidth - tableMargin * 2, canvasHeight - tableMargin * 2);
    };

    /**
     * Handles collisions between an array of `Ball` objects by detecting overlaps and adjusting their velocities and positions accordingly.
     *
     * This function checks every unique pair of balls in the array to determine if they are overlapping. If two active balls are colliding:
     * - Their velocities are adjusted based on the collision's normal and tangential components.
     * - Their positions are updated to resolve any overlap.
     *
     * @param {Ball[]} balls - An array of `Ball` objects. Each ball should have properties `x`, `y`, `vx`, `vy`, `radius`, and `active`.
     */
    const handleBallCollisions = (balls: Ball[]) => {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ballA = balls[i];
                const ballB = balls[j];
                if (!ballA.active || !ballB.active) continue;
                const dx = ballB.x - ballA.x;
                const dy = ballB.y - ballA.y;
                const dist = Math.hypot(dx, dy);
                const minDist = ballA.radius + ballB.radius;
                if (dist < minDist && dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const vAn = ballA.vx * nx + ballA.vy * ny;
                    const vBn = ballB.vx * nx + ballB.vy * ny;
                    const vA_tangential_x = ballA.vx - vAn * nx;
                    const vA_tangential_y = ballA.vy - vAn * ny;
                    const vB_tangential_x = ballB.vx - vBn * nx;
                    const vB_tangential_y = ballB.vy - vBn * ny;
                    ballA.vx = vA_tangential_x + vBn * nx;
                    ballA.vy = vA_tangential_y + vBn * ny;
                    ballB.vx = vB_tangential_x + vAn * nx;
                    ballB.vy = vB_tangential_y + vAn * ny;
                    const overlap = minDist - dist;
                    ballA.x -= (overlap / 2) * nx;
                    ballA.y -= (overlap / 2) * ny;
                    ballB.x += (overlap / 2) * nx;
                    ballB.y += (overlap / 2) * ny;
                }
            }
        }
    };

    /**
     * Updates the physics and state of the simulation at each frame.
     *
     * This callback handles various physics-related updates like ball positions, velocities, collisions, and interactions with boundaries and pockets. It operates based on the elapsed time since the last update.
     *
     * @param {number} dt - The delta time in milliseconds, representing the time passed since the last physics update.
     *
     * Function Details:
     * - Calculates new positions for balls based on their velocities and time step.
     * - Applies friction to ball velocities to simulate gradual slowing.
     * - Detects and handles collisions with the felt boundaries by reversing velocity and clamping ball positions within valid bounds.
     * - Processes pocket interactions:
     *    - If the cue ball is pocketed, it is reset to its initial position.
     *    - If an active ball is pocketed, its state and game-related statistics like count and sum are updated.
     * - Evaluates win/loss conditions based on pocketed balls, their numbers, and the target sum.
     */
    const updatePhysics = useCallback(
        (dt: number) => {
            const dtSec = dt / 100;
            setBalls((prevBalls) => {
                const newBalls = prevBalls.map((ball) => {
                    if (!ball.active) return ball;
                    const updated = {...ball};
                    updated.x += updated.vx * dtSec;
                    updated.y += updated.vy * dtSec;
                    const frictionMultiplier = Math.pow(baseFrictionPerSec, dtSec);
                    updated.vx *= frictionMultiplier;
                    updated.vy *= frictionMultiplier;
                    // Collision with felt boundaries.
                    if (updated.x - updated.radius < feltLeft || updated.x + updated.radius > feltRight) {
                        updated.vx = -updated.vx;
                        updated.x = Math.max(feltLeft + updated.radius, Math.min(feltRight - updated.radius, updated.x));
                    }
                    if (updated.y - updated.radius < feltTop || updated.y + updated.radius > feltBottom) {
                        updated.vy = -updated.vy;
                        updated.y = Math.max(feltTop + updated.radius, Math.min(feltBottom - updated.radius, updated.y));
                    }
                    return updated;
                });

                handleBallCollisions(newBalls);

                // Check if a ball falls into a pocket.
                newBalls.forEach((ball) => {
                    pockets.forEach((pocket) => {
                        const dx = ball.x - pocket.x;
                        const dy = ball.y - pocket.y;
                        if (Math.hypot(dx, dy) < pocketRadius) {
                            if (ball.number === 0) {
                                // Reset cue ball.
                                ball.x = ball.initialX;
                                ball.y = ball.initialY;
                                ball.vx = 0;
                                ball.vy = 0;
                                setFeedback("Нарушение! Топката бияч е вкарана в джоб. Опитайте отново 💕." );
                            } else if (ball.active) {
                                ball.active = false;
                                const newSum = pocketedSum + ball.number;
                                const newCount = pocketedCount + 1;
                                setPocketedSum(newSum);
                                setPocketedCount(newCount);
                                setFeedback(`Вкарана топка ${ball.number}. Общ брой: ${newCount}, Сбор: ${newSum}.`);
                                if (newSum > targetSum) {
                                    resetGame();
                                } else if (newCount >= 7 && newSum === targetSum) {
                                    setFeedback(`Пъзелът е решен! Постигна ${newSum} с ${newCount} топки.`);
                                    setShowConfetti(true);
                                    setTimeout(() => onSolve(), 7000);
                                }
                            }
                        }
                    });
                });
                return newBalls;
            });
        },
        [pocketedCount, pocketedSum, targetSum, onSolve]
    );

    useEffect(() => {
        let animationFrameId: number;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        /**
         * Handles the rendering logic for the pool game. This is a recursive function
         * that updates and renders the game state at each animation frame.
         *
         * @param {number} timestamp - The current timestamp provided by the browser
         *                              during the animation frame.
         *
         * The function performs the following operations:
         * - Updates the time delta and frame physics based on the provided timestamp.
         * - Renders the pool table background.
         * - Draws the pockets on the table.
         * - Renders the pool balls, including their numbers for identification,
         *   if applicable.
         * - Displays the aiming cue if the player is currently aiming.
         * - Repeats the rendering process by scheduling the next animation frame
         *   recursively.
         */
        const render = (timestamp: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
            const dt = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;
            updatePhysics(dt);

            // Draw the pool table background.
            renderBackground(ctx);

            // Draw pockets.
            pockets.forEach((pocket) => {
                ctx.beginPath();
                ctx.arc(pocket.x, pocket.y, pocketRadius, 0, 2 * Math.PI);
                ctx.fillStyle = "#000";
                ctx.fill();
            });

            // Draw balls.
            balls.forEach((ball) => {
                if (!ball.active) return;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
                ctx.fillStyle = ball.color;
                ctx.fill();
                if (ball.number !== 0) {
                    ctx.fillStyle = "#333";
                    ctx.font = "bold 14px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`${ball.number}`, ball.x, ball.y);
                }
            });

            // Draw aiming cue if applicable.
            if (aiming && aimPos) {
                const cue = balls.find((b) => b.number === 0);
                if (cue) {
                    ctx.beginPath();
                    ctx.moveTo(cue.x, cue.y);
                    ctx.lineTo(aimPos.x, aimPos.y);
                    ctx.strokeStyle = "#FF69B4";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [aimPos, aiming, balls, updatePhysics, onSolve]);

    /**
     * Handles the mouse down event on the canvas element.
     *
     * This function determines the coordinates of the mouse with respect to the canvas
     * and checks if the mouse click occurred within a certain distance of the cue ball.
     * If the cue ball is clicked, it sets the aiming state to true and calculates the aiming position.
     *
     * @param {React.MouseEvent<HTMLCanvasElement>} e - The mouse event triggered by the user clicking on the canvas.
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const cueBall = balls.find((b) => b.number === 0);
        if (cueBall) {
            const distance = Math.hypot(mouseX - cueBall.x, mouseY - cueBall.y);
            if (distance < cueBall.radius + 5) {
                setAiming(true);
                setAimPos({x: mouseX, y: mouseY});
            }
        }
    };

    /**
     * Handles the mouse move event for a canvas element.
     *
     * This function updates the aiming position based on the mouse location relative to the canvas,
     * provided that aiming is active. It retrieves the bounding rectangle of the canvas to calculate
     * the mouse coordinates within the canvas.
     *
     * @param {React.MouseEvent<HTMLCanvasElement>} e - The mouse event containing information
     * about the interaction with the canvas.
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!aiming) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setAimPos({x: mouseX, y: mouseY});
    };

    /**
     * Handles the mouse up event on the canvas element.
     *
     * This function is triggered when the user releases the mouse button
     * after aiming on the canvas. If the `aiming` state is set to true, it calculates
     * the direction and power of the shot based on the mouse position relative to the ball
     * with `number === 0` and modifies its velocity accordingly.
     *
     * @param {React.MouseEvent<HTMLCanvasElement>} e - The mouse event triggered when the user releases the mouse button on the canvas.
     */
    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!aiming) return;
        setAiming(false);
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setBalls((prevBalls) =>
            prevBalls.map((ball) => {
                if (ball.number === 0 && ball.active) {
                    const dx = mouseX - ball.x;
                    const dy = mouseY - ball.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance > 0) {
                        const unitX = dx / distance;
                        const unitY = dy / distance;
                        const power = Math.min(distance * 0.5, 1000);
                        ball.vx = unitX * power;
                        ball.vy = unitY * power;
                    }
                }
                return ball;
            })
        );
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{
                background: "linear-gradient(to right, #F472B6, #F87171, #FBBF24)"
            }}
        >

            {showConfetti && <Confetti recycle={false} numberOfPieces={500}/>}

            <h2 className="text-4xl font-bold mb-4" style={{color: "#333"}}>
                Нашето първо предизвикателство и среща 😘: Билярд! 🎱
             </h2>
            <p className="text-xl mb-2" style={{color: "#333"}}>
                Вкарвай топки в джобовете, докато събереш поне 7 и сборът им стане точно {targetSum}.
            </p>
            <div
                className="mb-4 p-2 rounded"
                style={{
                    backgroundColor: "#fff0f5",
                    color: "#333",
                    border: "2px dashed #FFB6C1",
                }}
            >
                Вкарани: {pocketedCount} топки | Текущ сбор: {pocketedSum}
            </div>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="mb-4 border-4"
                style={{
                    borderColor: "#FFB6C1",
                    boxShadow: "0 0 15px rgba(255,182,193,0.5)",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
            {feedback && <div className="text-2xl" style={{color: "#333"}}>{feedback}</div>}
        </div>
    );
};

export default BilliardsInteractivePuzzle;