import { NextRequest, NextResponse } from 'next/server';
import { getFight, setFight } from '@/lib/fightStore';
import { pusherServer } from '@/lib/pusher';
import { broadcastToChat } from '@/lib/chatBroadcast';
import { getManagerPrompt, getICPrompt, getCommentatorPrompt } from '@/lib/prompts';
import { streamText } from '@/lib/gemini';
import { validateProposal } from '@/lib/google';
import { randomUUID } from 'crypto';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const PERSONA_LABEL: Record<string, string> = {
  ic: 'INDIVIDUAL CONTRIBUTOR',
  swe: 'SOFTWARE ENGINEER',
  team_lead: 'TEAM LEAD',
  director: 'DIRECTOR',
  executive: 'EXECUTIVE',
  intern: 'INTERN',
};

export async function POST(req: NextRequest, { params }: { params: { fightId: string } }) {
  const fight = getFight(params.fightId);
  if (!fight || !fight.tapeData) return NextResponse.json({ error: 'Fight not ready' }, { status: 400 });

  fight.readyCount += 1;
  setFight(fight.id, fight);

  if (fight.readyCount < 2) {
    return NextResponse.json({ waiting: true });
  }

  if (fight.status === 'arena') {
    return NextResponse.json({ success: true });
  }

  fight.status = 'arena';
  setFight(fight.id, fight);

  const startMsg = `🥊 NEW FIGHT: ${fight.tapeData.challengerCard.archetype} vs ${fight.tapeData.opponentCard.archetype}\nSubject: ${fight.config.subject}\nDuration: ${fight.config.durationMinutes}m\nUrgency: ${fight.config.urgency}`;
  broadcastToChat(startMsg, "Fight Commenced", "Calendar Combat");

  const orchestrate = async () => {
    let turns = 0;
    const maxTurns = 12;
    const { challengerCard, opponentCard } = fight.tapeData!;
    
    const isChallengerManager = challengerCard.role === 'MANAGER';
    const managerCard = isChallengerManager ? challengerCard : opponentCard;
    const icCard = isChallengerManager ? opponentCard : challengerCard;
    const managerPriorities = isChallengerManager ? fight.config.challengerPriorities : fight.config.opponentPriorities;
    const icPriorities = isChallengerManager ? fight.config.opponentPriorities : fight.config.challengerPriorities;
    const managerLabel = PERSONA_LABEL[isChallengerManager ? (fight.config.challengerPersona || '') : (fight.config.opponentPersona || '')] || 'RED CORNER';
    const icLabel = PERSONA_LABEL[isChallengerManager ? (fight.config.opponentPersona || '') : (fight.config.challengerPersona || '')] || 'BLUE CORNER';
    const labelForRole = (role: 'MANAGER' | 'IC') => (role === 'MANAGER' ? managerLabel : icLabel);

    let chatHistory = '';

    while (turns < maxTurns) {
      const currentRole = turns % 2 === 0 ? 'MANAGER' : 'IC';
      const prompt = currentRole === 'MANAGER'
        ? getManagerPrompt(fight.config, managerCard.rawEvents?.map(e => ({start: e.start, end: e.end})), managerPriorities)
        : getICPrompt(fight.config, icCard.rawEvents?.map(e => ({start: e.start, end: e.end})), icPriorities);

      let validTurn = false;
      let agentText = '';
      let attempts = 0;

      while (!validTurn && attempts < 3) {
        attempts++;
        const msgId = randomUUID();
        agentText = '';
        
        if (pusherServer) {
          pusherServer.trigger(`fight-${fight.id}`, 'start-turn', {
            id: msgId,
            role: currentRole,
            roleLabel: labelForRole(currentRole),
          });
        }
        
        agentText = await streamText(prompt, chatHistory, (chunk) => {
          if (pusherServer) {
            pusherServer.trigger(`fight-${fight.id}`, 'chunk', {
              id: msgId,
              role: currentRole,
              roleLabel: labelForRole(currentRole),
              text: chunk,
            });
          }
        });
        
        if (pusherServer) {
          pusherServer.trigger(`fight-${fight.id}`, 'end-turn', {
            id: msgId,
            role: currentRole,
            roleLabel: labelForRole(currentRole),
            text: agentText,
          });
        }

        const agreementMatch = agentText.match(/\[AGREEMENT:\s*(.+?),\s*(\d+)\]/);
        if (agreementMatch) {
          const time = agreementMatch[1];
          const isValid = validateProposal(time, fight.config.durationMinutes, managerCard.rawEvents || [], icCard.rawEvents || []);
          
          if (!isValid) {
            chatHistory += `\n${labelForRole(currentRole)}: ${agentText}\n[SYSTEM VALIDATION]: ERROR - CONFLICT DETECTED AT ${time}. You MUST propose a different time.`;
            continue; 
          }
        }
        
        validTurn = true;
      }

      chatHistory += `\n${labelForRole(currentRole)}: ${agentText}`;
      fight.transcript.push({ id: randomUUID(), role: currentRole, text: agentText, timestamp: new Date().toISOString() });
      broadcastToChat(`${currentRole === 'MANAGER' ? '🟥' : '🟦'} ${labelForRole(currentRole)}: "${agentText.replace(/\[.*\]/g, '')}"`);

      if (agentText.includes('[AGREEMENT:') || agentText.includes('[WALKAWAY]')) {
        break;
      }

      if (turns % 2 === 1) {
        const commMsgId = randomUUID();
        if (pusherServer) pusherServer.trigger(`fight-${fight.id}`, 'start-turn', { id: commMsgId, role: 'COMMENTATOR' });
        
        const commentatorPrompt = getCommentatorPrompt(managerLabel, icLabel);
        const commText = await streamText(commentatorPrompt, chatHistory, (chunk) => {
          if (pusherServer) pusherServer.trigger(`fight-${fight.id}`, 'chunk', { id: commMsgId, role: 'COMMENTATOR', text: chunk });
        });
        
        if (pusherServer) pusherServer.trigger(`fight-${fight.id}`, 'end-turn', { id: commMsgId, role: 'COMMENTATOR', text: commText });
        
        fight.transcript.push({ id: randomUUID(), role: 'COMMENTATOR', text: commText, timestamp: new Date().toISOString() });
        const parts = commText.split('\n');
        broadcastToChat(parts[1] || parts[0], `🎙️ ${parts[0]}`);
      }

      turns++;
    }

    fight.status = 'verdict';
    setFight(fight.id, fight);
    if (pusherServer) pusherServer.trigger(`fight-${fight.id}`, 'verdict-ready', {});
  };

  orchestrate().catch(console.error);

  return NextResponse.json({ success: true, started: true });
}
