"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinFight({ params }: { params: { fightId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = () => {
    setLoading(true);
    window.location.href = `/api/auth/google?action=join&fightId=${params.fightId}`;
  };

  useEffect(() => {
    const attemptJoin = async () => {
      const res = await fetch(`/api/fight/${params.fightId}/join`, { method: 'POST' });
      if (res.ok) {
        router.push(`/fight/${params.fightId}/tape`);
      } else if (res.status !== 401) {
        setError('Fight not found or already started.');
      }
    };
    attemptJoin();
  }, [params.fightId, router]);

  return (
    <div className="min-h-[calc(100vh-80px)] canvas-bg flex flex-col items-center justify-center p-8">
      <div className="bg-surface-container border-4 border-secondary-container p-12 max-w-2xl w-full text-center shadow-[10px_10px_0px_#000]">
        <h1 className="font-lexend font-black text-4xl italic text-white uppercase mb-8">CHALLENGE RECEIVED</h1>
        <p className="text-outline font-body-main mb-8">You've been challenged to a scheduling bout. Connect your Google Calendar to enter the ring.</p>
        
        {error ? (
          <p className="text-red-500 font-bold mb-4">{error}</p>
        ) : (
          <button onClick={handleAuth} disabled={loading} className="w-full bg-secondary-container text-white font-black text-2xl py-6 uppercase italic hover:bg-white hover:text-black transition-all shadow-lg skew-x-[4deg]">
            CONNECT CALENDAR TO ACCEPT
          </button>
        )}
      </div>
    </div>
  );
}
