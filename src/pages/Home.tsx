import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-600 flex flex-col items-center justify-center text-white p-6">
            <motion.h1
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                Началото на специално пътешествие, само за теб!
            </motion.h1>
            <motion.p
                className="text-lg md:text-2xl text-center mb-8 max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                Това е специална игра, създадена с много любов за теб! Решавай пъзелите и разкривай тайните на нашите спомени. 💖
            </motion.p>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
            >
                <Link
                    to="/puzzle"
                    className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg text-xl font-semibold shadow-md transition-transform transform hover:scale-105"
                >
                    Започни приключението
                </Link>
            </motion.div>
        </div>
    );
};

export default Home;