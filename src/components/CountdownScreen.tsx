import { useState, useEffect } from 'react';

interface CountdownScreenProps {
  scheduledStart: Date;
  sessionTitle: string;
  waitingCount: number;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Countdown screen component that displays time until session starts.
 * Shows a large countdown timer, session title, and number of waiting users.
 */
const CountdownScreen = ({ scheduledStart, sessionTitle, waitingCount }: CountdownScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = scheduledStart.getTime();
      const difference = start - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return true; // Countdown reached zero
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
      return false; // Countdown still running
    };

    // Calculate immediately
    const isZero = calculateTimeRemaining();

    if (isZero) {
      return; // Don't start interval if already at zero
    }

    // Update every second
    const interval = setInterval(() => {
      const reachedZero = calculateTimeRemaining();
      if (reachedZero) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [scheduledStart]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-6xl font-bold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-12">
        {/* Countdown Timer */}
        <div>
          <h2 className="text-2xl text-gray-300 mb-8">Live class starts in</h2>
          <div className="grid grid-cols-4 gap-8 mb-8">
            <TimeUnit value={timeRemaining.days} label="Days" />
            <TimeUnit value={timeRemaining.hours} label="Hours" />
            <TimeUnit value={timeRemaining.minutes} label="Minutes" />
            <TimeUnit value={timeRemaining.seconds} label="Seconds" />
          </div>
        </div>

        {/* Session Title */}
        <div className="text-3xl font-semibold text-white">
          {sessionTitle}
        </div>

        {/* Waiting Users Count */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 rounded-full">
          <div className="relative">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-gray-300 text-sm">
            {waitingCount} {waitingCount === 1 ? 'user' : 'users'} waiting
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountdownScreen;
