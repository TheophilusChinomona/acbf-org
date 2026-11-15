import { useEffect, useState } from 'react';
import Counter from '../common/Counter/Counter';
import { countdownParts, toEpochMs } from '../../utils/awardsVoting';

export default function VotingCountdown({ closesAt, deadlineLabel }) {
  const [now, setNow] = useState(Date.now);
  const deadline = toEpochMs(closesAt);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (deadline === null) return null;
  const remaining = countdownParts(deadline, now);
  return (
    <section aria-label="Voting deadline" className="rounded-lg bg-primary/5 px-4 py-5 sm:px-6">
      <p className="font-medium text-gray-900">
        {now >= deadline ? 'Voting closed' : 'Voting closes'} {deadlineLabel}
      </p>
      <div role="timer" aria-label="Time remaining until voting closes" aria-live="off" className="mt-4 grid max-w-md grid-cols-4 gap-2 sm:gap-4">
        {Object.entries(remaining).map(([unit, value]) => (
          <div key={unit} className="min-w-0 text-center text-3xl sm:text-4xl">
            <Counter
              value={value}
              minDigits={2}
              format={{ useGrouping: false }}
              fontSize="inherit"
              fontWeight={600}
              direction="down"
              intro={false}
              motionBlur={false}
              duration={0.4}
              stagger={0}
              className="text-primary"
            />
            <span className="mt-2 block text-xs text-gray-700 sm:text-sm">{unit}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
