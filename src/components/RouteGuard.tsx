import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';

interface RouteGuardProps {
  requireUsername?: boolean;
  requireScan?: boolean;
  requireSectors?: boolean;
  children: React.ReactNode;
}

export default function RouteGuard({ requireUsername, requireScan, requireSectors, children }: RouteGuardProps) {
  const { state } = useFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (requireUsername && !state.username) {
      navigate('/', { replace: true });
      return;
    }
    if (requireScan && !state.scanDone) {
      navigate('/menu', { replace: true });
      return;
    }
    if (requireSectors && state.sectorOrder.length === 0) {
      navigate('/menu', { replace: true });
      return;
    }
  }, [state.username, state.scanDone, state.sectorOrder.length]);

  if (requireUsername && !state.username) return null;
  if (requireScan && !state.scanDone) return null;
  if (requireSectors && state.sectorOrder.length === 0) return null;

  return <>{children}</>;
}
