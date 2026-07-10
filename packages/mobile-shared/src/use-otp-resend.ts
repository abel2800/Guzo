import { useCallback, useEffect, useState } from 'react';
import { OTP_RESEND_COOLDOWN_SEC } from './otp';

export function useOtpResendCooldown(cooldownSec = OTP_RESEND_COOLDOWN_SEC) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startCooldown = useCallback(() => {
    setSecondsLeft(cooldownSec);
  }, [cooldownSec]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const canResend = secondsLeft === 0;

  function formatCountdown(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return {
    secondsLeft,
    canResend,
    startCooldown,
    countdownLabel: secondsLeft > 0 ? formatCountdown(secondsLeft) : null,
  };
}
