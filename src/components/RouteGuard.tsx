import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow, validateState } from '@/lib/flowContext';

interface RouteGuardProps {
  requireUsername?: boolean;
  requireScan?: boolean;
  requireSectors?: boolean;
  requireNotReviewed?: boolean;
  children: React.ReactNode;
}

export default function RouteGuard({ requireUsername, requireScan, requireSectors, requireNotReviewed, children }: RouteGuardProps) {
  const { state } = useFlow();
  const navigate = useNavigate();

  // Run state validator on every guarded route
  const validated = validateState(state);

  useEffect(() => {
    if (requireUsername && !validated.username) {
      navigate('/', { replace: true });
      return;
    }
    if (requireScan && !validated.scanDone) {
      navigate('/menu', { replace: true });
      return;
    }
    if (requireSectors && validated.sectorOrder.length === 0) {
      navigate('/menu', { replace: true });
      return;
    }
    if (requireNotReviewed && validated.opReviewed) {
      navigate('/menu', { replace: true });
      return;
    }
  }, [validated.username, validated.scanDone, validated.sectorOrder.length, validated.opReviewed]);

  if (requireUsername && !validated.username) return null;
  if (requireScan && !validated.scanDone) return null;
  if (requireSectors && validated.sectorOrder.length === 0) return null;
  if (requireNotReviewed && validated.opReviewed) return null;

  return <>{children}</>;
}
