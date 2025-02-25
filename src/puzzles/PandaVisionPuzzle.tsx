import React, {useState} from "react";
import localImage from "../../public/assets/panda.jpg";
import Confetti from "react-confetti";

// Hotspot defines a clickable area on the image that reveals the underlying image.
interface Hotspot {
    x: number; // percentage (0 to 100)
    y: number; // percentage (0 to 100)
    radius: number; // percentage (of container's width, for example)
}

const PandaVisionPuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    // Define hotspots for the image (adjust as needed)
    const hotspots: Hotspot[] = [
        {x: 20, y: 30, radius: 13},
        {x: 50, y: 70, radius: 15},
        {x: 80, y: 40, radius: 12},
        {x: 10, y: 80, radius: 13},
        {x: 30, y: 50, radius: 15},
        {x: 60, y: 20, radius: 17},
        {x: 90, y: 60, radius: 16},
        {x: 40, y: 20, radius: 15},
        {x: 70, y: 80, radius: 14},
        {x: 15, y: 15, radius: 13},
        {x: 85, y: 85, radius: 12},
        {x: 25, y: 85, radius: 10},
        {x: 75, y: 25, radius: 10},
        {x: 35, y: 35, radius: 10},
        {x: 65, y: 65, radius: 10},
    ];

    const [clearedSpots, setClearedSpots] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<string>("");
    const [showConfetti, setShowConfetti] = useState(false);

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        let spotFound = false;

        hotspots.forEach((spot, index) => {
            const distance = Math.sqrt((spot.x - clickX) ** 2 + (spot.y - clickY) ** 2);
            if (distance < spot.radius && !clearedSpots.includes(index)) {
                setClearedSpots((prev) => [...prev, index]);
                setFeedback("Страхотно! Точката е разкрита 🎯");
                spotFound = true;
            }
        });

        if (!spotFound) {
            setFeedback("Опа! Това не е съвсем правилно. Опитайте отново. 🙃");
        }

        // When last hotspot is cleared, remove the blur overlay after a short delay.
        if (clearedSpots.length + (spotFound ? 1 : 0) === hotspots.length) {
            setShowConfetti(true);
            setTimeout(() => {
                setFeedback("Напълно разкри изображението! 🎉");
                onSolve();
            }, 6000);
        }
    };

    // Render SVG circles for cleared hotspots using objectBoundingBox coordinates (0-1)
    const renderMaskCircles = () =>
        clearedSpots.map((index) => {
            const {x, y, radius} = hotspots[index];
            return (
                <circle
                    key={index}
                    cx={x / 100} // converting percentage to 0-1 scale
                    cy={y / 100}
                    r={radius / 100} // converting percentage to 0-1 scale
                    fill="black"
                />
            );
        });

    // Check if all spots have been cleared.
    const isFullyUnblurred = clearedSpots.length === hotspots.length;

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-400 via-pink-300 to-yellow-300 p-6">

            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            {/* SVG Mask Definition */}
            {/* Only needed if not fully unblurred */}
            {!isFullyUnblurred && (
                <svg width="0" height="0" style={{position: "absolute"}}>
                    <mask id="revealMask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
                        {/* Full area opaque */}
                        <rect x="0" y="0" width="1" height="1" fill="white"/>
                        {/* Black circles cut holes through the blurred layer */}
                        {renderMaskCircles()}
                    </mask>
                </svg>
            )}

            <h2 className="text-3xl md:text-5xl  font-bold text-white text-center mb-4">Панда Визия 🐼</h2>
            <p className="text-3xl font-medium text-white text-center mb-6">
                Кликни върху правилните места, за да изясниш изображението! 🎯
            </p>

            <div
                className="relative"
                style={{
                    width: "90%",
                    maxWidth: "600px",
                    aspectRatio: "16/9",
                    cursor: "pointer",
                }}
                onClick={handleImageClick}
            >
                {/* Blurred layer with SVG mask - only render if the image is not fully unblurred */}
                {!isFullyUnblurred && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${localImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(15px)",
                            mask: "url(#revealMask)",
                            WebkitMask: "url(#revealMask)",
                            zIndex: 2,
                        }}
                    />
                )}

                {/* Unblurred base image */}
                <img
                    src={localImage}
                    alt="Unblurred version"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Display clickable spots counter */}
            <div className="mt-4 text-2xl text-white">
                {`Разкрити точки: ${clearedSpots.length} / ${hotspots.length}`}
            </div>

            {feedback && (
                <div className="mt-4 text-lg font-bold text-white" style={{transition: "opacity 0.3s ease"}}>
                    {feedback}
                </div>
            )}
        </div>
    );
};


export default PandaVisionPuzzle;
