import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { BOOT_MESSAGES } from '@/lib/mockData';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Boot() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const bootMsg = useMemo(() => BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)], []);

  const allUsers = state.allUsers;

  // If users exist, show selection
  if (allUsers.length > 0) {
    return (
      <TerminalLayout title="BOOT" syslog="Select your profile or create a new one." showMatrix={false}>
        <div className="border border-border bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            SELECT OPERATOR
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
            <TerminalButton
              variant="back"
              onClick={() => {
                dispatch({ type: 'SET_USERNAME', payload: '' });
                navigate('/new-user');
              }}
            >
              {'>'} NEW OPERATOR
            </TerminalButton>
          </div>
        </div>
      </TerminalLayout>
    );
  }

  return (
    <TerminalLayout title="FIRST BOOT" syslog="The OS is waiting." showMatrix={false}>
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          FIRST BOOT // OPERATOR ID
        </div>
        <div className="text-muted-foreground text-xs mb-4 font-body leading-relaxed">
          {bootMsg}
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
      </div>
    </TerminalLayout>
  );
}
