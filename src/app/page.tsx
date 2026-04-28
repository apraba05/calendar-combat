"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [joinId, setJoinId] = useState('');

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8 relative">
      <div className="absolute top-0 left-0 w-full caution-tape h-4"></div>
      
      <h1 className="font-lexend font-black text-6xl md:text-8xl italic text-primary tracking-tighter drop-shadow-[0_4px_0px_rgba(104,0,14,1)] mb-8 text-center">
        CALENDAR<br />COMBAT
      </h1>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1 bg-surface-container border-4 border-red-600 p-8 flex flex-col gap-6 shadow-[10px_10px_0px_#000]">
          <h2 className="font-h2-stadium text-white italic text-3xl">ISSUE CHALLENGE</h2>
          <p className="text-outline font-body-main">Connect your Google Calendar and send a fight link to a colleague.</p>
          <button onClick={() => router.push('/fight/new')} className="mt-auto bg-primary text-black font-black text-xl py-4 uppercase italic hover:bg-white transition-all shadow-md skew-x-[-4deg]">
            CHALLENGE A COLLEAGUE
          </button>
        </div>

        <div className="flex-1 bg-surface-container border-4 border-secondary-container p-8 flex flex-col gap-6 shadow-[10px_10px_0px_#000]">
          <h2 className="font-h2-stadium text-white italic text-3xl">JOIN A FIGHT</h2>
          <p className="text-outline font-body-main">Got a link? Enter the Fight ID to enter the ring.</p>
          <input 
            type="text" 
            placeholder="ENTER FIGHT ID" 
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            className="bg-black border-2 border-outline-variant text-white p-4 font-body-bold text-center uppercase focus:border-secondary-container focus:outline-none"
          />
          <button onClick={() => joinId && router.push(`/fight/${joinId}/join`)} disabled={!joinId} className="mt-auto bg-secondary-container text-white font-black text-xl py-4 uppercase italic hover:bg-white hover:text-black transition-all shadow-md skew-x-[4deg] disabled:opacity-50">
            ENTER THE RING
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-black border-t-2 border-primary py-2 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block font-label-caps text-xs text-white tracking-[0.2em]">
          <span className="text-primary mx-4">●</span> MEETINGS NEGOTIATED TONIGHT: 1,247
          <span className="text-primary mx-4">●</span> AVERAGE FIGHT DURATION: 47 SECONDS
          <span className="text-primary mx-4">●</span> LONGEST RECORDED STALEMATE: 12 ROUNDS
        </div>
      </div>
    </div>
  );
}
