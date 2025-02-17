import { Link } from "react-router-dom";

function Home()  {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Добре дошла в нашия специален Лов на съкровища! ❤️</h1>
            <p className="text-lg text-gray-700 max-w-xl mb-6">
                Това е пътешествие, изпълнено с пъзели и спомени, водещо към изненада само за теб!
                Всеки пъзел е част от нашата история. Решавай ги и изживей отново прекрасните ни моменти заедно.
            </p>
            <Link to="/puzzle">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all">
                    Започни приключението
                </button>
            </Link>
        </div>
    );
}

export default Home;