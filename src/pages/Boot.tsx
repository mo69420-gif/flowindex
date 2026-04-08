import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFlow, getOsTone } from '@/lib/flowContext';
import { BOOT_MESSAGES } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Boot() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [bootMsg, setBootMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewUser, setShowNewUser] = useState(false);

  useEffect(() => {
    if (location.pathname === '/new-user') {
      setShowNewUser(true);
    }
  }, [location.pathname]);

  // Dynamic tone-aware boot message
  const tone = getOsTone(state);

  useEffect(() => {
    let cancelled = false;
    const fallback = BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)];

    supabase.functions.invoke('analyze-room', {
      body: { mode: 'boot_message', tone },
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.message) setBootMsg(fallback);
      else setBootMsg(data.message);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setBootMsg(fallback); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [tone]);

  const allUsers = state.allUsers;

  // New user form
  if (showNewUser || (allUsers.length === 0)) {
    return (
      <TerminalLayout title="FIRST BOOT" syslog="The OS is waiting." showMatrix={false}>
        <div className="border border-border bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            {allUsers.length > 0 ? 'NEW OPERATOR' : 'FIRST BOOT // OPERATOR ID'}
          </div>
          <div className="text-muted-foreground text-xs mb-4 font-body leading-relaxed">
            {loading ? (
              <span className="animate-pulse">INITIALIZING BOOT SEQUENCE...</span>
            ) : bootMsg}
          </div>
          <input
            type="text"
            className="w-full bg-muted border border-border text-primary font-display text-base px-3.5 py-3 mb-3 tracking-[2px] text-center uppercase focus:outline-none focus:border-primary"
            placeholder="ENTER CALLSIGN"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) {
                dispatch({ type: 'ADD_USER', payload: name.trim() });
                dispatch({ type: 'SET_USERNAME', payload: name.trim() });
                navigate('/menu');
              }
            }}
            autoFocus
          />
          <TerminalButton
            variant="confirm"
            disabled={!name.trim()}
            onClick={() => {
              dispatch({ type: 'ADD_USER', payload: name.trim() });
              dispatch({ type: 'SET_USERNAME', payload: name.trim() });
              navigate('/menu');
            }}
          >
            {'>'} INITIALIZE OPERATOR
          </TerminalButton>
          {allUsers.length > 0 && (
            <TerminalButton variant="back" onClick={() => { setShowNewUser(false); navigate('/'); }}>
              {'<'} BACK TO OPERATOR SELECT
            </TerminalButton>
          )}
        </div>
      </TerminalLayout>
    );
  }

  // Operator select
  return (
    <TerminalLayout title="BOOT" syslog="Select your profile or create a new one." showMatrix={false}>
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          SELECT OPERATOR // SAVE SLOTS
        </div>
        <div className="text-muted-foreground text-xs mb-3">Who's running this op?</div>
        <div className="flex flex-col gap-1.5">
          {allUsers.map(u => (
            <TerminalButton
              key={u}
              onClick={() => {
                dispatch({ type: 'SET_USERNAME', payload: u });
                navigate('/menu');
              }}
            >
              {'>'} {u}
            </TerminalButton>
          ))}
          <TerminalButton variant="back" onClick={() => setShowNewUser(true)}>
            {'>'} NEW OPERATOR
          </TerminalButton>
        </div>
      </div>
    </TerminalLayout>
  );
}
