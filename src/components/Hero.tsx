

export const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl">
                    Build the <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Future</span> Today
                </h1>
                <p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 lg:px-48">
                    Experience the next generation of web development with our premium static web app skeleton. Fast, responsive, and beautiful.
                </p>
                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
                    <a href="#" className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 transition-all hover:scale-105">
                        Get started
                        <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </a>
                    <a href="#" className="inline-flex justify-center items-center py-3 px-5 sm:ms-4 text-base font-medium text-center text-gray-300 rounded-lg border border-gray-700 hover:text-white hover:bg-gray-800 focus:ring-4 focus:ring-gray-400 transition-all hover:scale-105 backdrop-blur-sm">
                        Learn more
                    </a>
                </div>
            </div>
        </section>
    );
};
