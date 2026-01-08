import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="min-h-screen bg-slate-900 text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden">
    
    <!-- Navigation -->
    <nav class="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
            <span class="self-center text-2xl font-bold whitespace-nowrap bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Zenith</span>
        </a>
        <div class="hidden md:block w-full md:w-auto" id="navbar-default">
          <ul class="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0">
            <li>
              <a href="#" class="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-cyan-400 md:p-0" aria-current="page">Home</a>
            </li>
            <li>
              <a href="#" class="block py-2 px-3 text-gray-300 rounded hover:bg-gray-700 md:hover:bg-transparent md:border-0 md:hover:text-cyan-400 md:p-0 transition-colors">Features</a>
            </li>
            <li>
              <a href="#" class="block py-2 px-3 text-gray-300 rounded hover:bg-gray-700 md:hover:bg-transparent md:border-0 md:hover:text-cyan-400 md:p-0 transition-colors">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
         <div class="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]"></div>
         <div class="absolute top-40 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div class="container mx-auto px-4 text-center relative z-10">
        <h1 class="mb-4 text-4xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl">
          Build the <span class="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Future</span> Today
        </h1>
        <p class="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 lg:px-48">
          Experience the next generation of web development with our premium static web app skeleton. Fast, responsive, and beautiful.
        </p>
        <div class="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
          <a href="#" class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 transition-all hover:scale-105">
            Get started
            <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </a>
          <a href="#" class="inline-flex justify-center items-center py-3 px-5 sm:ms-4 text-base font-medium text-center text-gray-300 rounded-lg border border-gray-700 hover:text-white hover:bg-gray-800 focus:ring-4 focus:ring-gray-400 transition-all hover:scale-105 backdrop-blur-sm">
            Learn more
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-slate-800/50">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
               <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-white">Lightning Fast</h3>
            <p class="text-gray-400">Powered by Vite, your app loads instantly and updates in real-time.</p>
          </div>
          
          <!-- Feature 2 -->
          <div class="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
               <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-white">Modern Design</h3>
            <p class="text-gray-400">Tailwind CSS v3 configured for premium, responsive layouts out of the box.</p>
          </div>

          <!-- Feature 3 -->
           <div class="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
               <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-white">Deploy Anywhere</h3>
            <p class="text-gray-400">Ready for GitHub Pages with a pre-configured workflow.</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="bg-slate-900 border-t border-slate-800 py-8">
        <div class="container mx-auto px-4 text-center text-gray-500">
            <p>&copy; 2024 Zenith App. All rights reserved.</p>
        </div>
    </footer>
  </div>
`
