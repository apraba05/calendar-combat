import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendar Combat",
  description: "Corporate scheduling reframed as a pay-per-view blood sport.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="canvas-texture min-h-screen text-on-surface font-body-main selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
        
        {/* TopNavBar */}
        <header className="bg-slate-950 dark:bg-black text-white font-lexend font-black uppercase italic tracking-tighter border-b-4 border-red-600 shadow-[0_10px_30px_-15px_rgba(255,0,51,0.5)] flex justify-between items-center px-8 py-4 w-full sticky top-0 z-50">
          <div className="text-3xl font-black text-white italic tracking-widest drop-shadow-[0_2px_0px_#FF0033]"><a href="/">CALENDAR COMBAT</a></div>
          <nav className="hidden md:flex gap-8 items-center">
            <a className="text-white hover:text-red-500 transition-colors" href="/">MATCHUPS</a>
            <a className="text-amber-400 border-b-4 border-amber-400 pb-1" href="/">THE ARENA</a>
            <a className="text-white hover:text-red-500 transition-colors" href="/">RANKINGS</a>
            <a className="text-white hover:text-red-500 transition-colors" href="/">PPV REPLAYS</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-white hover:bg-red-600 hover:text-white transition-all duration-75 p-2 cursor-pointer">notifications_active</span>
            <span className="material-symbols-outlined text-white hover:bg-red-600 hover:text-white transition-all duration-75 p-2 cursor-pointer">settings</span>
            <button className="bg-primary-container text-on-primary-container px-6 py-2 font-black skew-x-[-12deg] hover:bg-white hover:text-red-600 transition-all">GO LIVE</button>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-80px)]">
          {/* SideNavBar */}
          <aside className="fixed left-0 top-20 hidden lg:flex flex-col h-[calc(100vh-80px)] w-72 bg-slate-950 dark:bg-[#05050A] border-r-4 border-red-600 z-40 overflow-y-auto">
            <div className="p-8 flex flex-col items-center gap-4 border-b-2 border-red-900/20">
              <div className="w-24 h-24 rounded-full border-4 border-tertiary p-1">
                <img alt="Champion Belt" className="w-full h-full rounded-full bg-surface-container-highest object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_g3VN0WXXp-2eRVAyoNocKLLFjzX9hH_LtCUTYR8JwatoJmqO4gBSvw8Qq-91T7by0WQDqoe8MZD7IDk_Qp1NhyJuPI4ChXvKxT6EUVbIvIuW7rkIJk7Rs0Dx-NsjalnybBtY96YpsD868sYuQ7kuX2qgjSHMFfSyF3IXJTGFv9wwiFP9UDynCxHxo2RMTe0cIPQmqB7So7earUmBZEBRND5iXG0Cv8XDedMRAmIlCcKqyj4Ctz7y6nH_H7favnQRCq2UWPGBSA"/>
              </div>
              <div className="text-center">
                <h4 className="font-lexend font-black text-white italic uppercase">HEAVYWEIGHT</h4>
                <p className="font-label-caps text-[10px] text-red-500">12-0 UNDEFEATED</p>
              </div>
            </div>
            <nav className="flex-1 flex flex-col gap-2 py-8">
              <a className="bg-red-600 text-white font-black -skew-x-6 mx-2 px-8 py-3 flex items-center gap-4 shadow-lg" href="/">
                <span className="material-symbols-outlined">sports_kabaddi</span>
                <span className="font-lexend font-bold uppercase">FIGHT CARD</span>
              </a>
              <a className="text-slate-400 hover:text-white px-8 py-3 flex items-center gap-4 group hover:translate-x-2 transition-transform duration-150" href="/">
                <span className="material-symbols-outlined group-hover:text-red-500">fitness_center</span>
                <span className="font-lexend font-bold uppercase">TRAINING CAMP</span>
              </a>
              <a className="text-slate-400 hover:text-white px-8 py-3 flex items-center gap-4 group hover:translate-x-2 transition-transform duration-150" href="/">
                <span className="material-symbols-outlined group-hover:text-red-500">meeting_room</span>
                <span className="font-lexend font-bold uppercase">LOCKER ROOM</span>
              </a>
              <a className="text-slate-400 hover:text-white px-8 py-3 flex items-center gap-4 group hover:translate-x-2 transition-transform duration-150" href="/">
                <span className="material-symbols-outlined group-hover:text-red-500">emoji_events</span>
                <span className="font-lexend font-bold uppercase">HALL OF FAME</span>
              </a>
            </nav>
            <div className="p-4">
              <a href="/api/auth/google?action=login" className="block text-center w-full bg-transparent border-2 border-red-600 text-red-600 font-black py-4 hover:bg-red-600 hover:text-white transition-all uppercase italic tracking-widest">
                NEW CHALLENGE
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow lg:ml-72 flex flex-col min-h-0">
            {children}

            {/* Footer */}
            <footer className="w-full mt-auto py-10 px-12 flex flex-col items-center gap-6 bg-black dark:bg-[#05050A] border-t-2 border-red-900/30">
              <div className="text-slate-800 font-black font-lexend text-2xl italic tracking-widest">CALENDAR COMBAT</div>
              <div className="flex gap-8">
                <a className="font-lexend text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-amber-400 transition-colors" href="#">RING RULES</a>
                <a className="font-lexend text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-amber-400 transition-colors" href="#">TERMS OF COMBAT</a>
                <a className="font-lexend text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-amber-400 transition-colors" href="#">CONTACT PROMOTER</a>
              </div>
              <p className="font-lexend text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">© 2024 CALENDAR COMBAT. ALL RIGHTS RESERVED. NO MERCY FOR OVERLAPS.</p>
            </footer>
          </main>
        </div>

      </body>
    </html>
  );
}
