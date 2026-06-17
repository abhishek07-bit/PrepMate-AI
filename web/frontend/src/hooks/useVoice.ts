import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

const isSynthesisSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useVoice(options: UseVoiceOptions = {}) {
  const { rate = 1.0, pitch = 1.0, volume = 0.9, voiceName } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!isSynthesisSupported) return;
    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch (e) {
        console.error('[PrepMate] Failed to get speech voices:', e);
      }
    };
    loadVoices();
    try {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } catch (e) {
      console.warn('[PrepMate] Failed to bind onvoiceschanged:', e);
    }
  }, []);

  const getPreferredVoice = useCallback(() => {
    if (voices.length === 0) return null;
    if (voiceName) {
      const match = voices.find((v) => v.name.includes(voiceName));
      if (match) return match;
    }
    // Prefer natural-sounding English voices
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    );
    return preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }, [voiceName, voices]);

  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (!isSynthesisSupported || !isEnabled || !text.trim()) return;

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clear any existing iOS resume interval
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current);
          resumeIntervalRef.current = null;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voice = getPreferredVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          if (resumeIntervalRef.current) {
            clearInterval(resumeIntervalRef.current);
            resumeIntervalRef.current = null;
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          if (resumeIntervalRef.current) {
            clearInterval(resumeIntervalRef.current);
            resumeIntervalRef.current = null;
          }
        };

        utteranceRef.current = utterance;

        // iOS Safari workaround: speechSynthesis silently pauses after ~15s.
        // Periodically call resume() to keep it alive.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Small delay after cancel for iOS compatibility
        const startSpeaking = () => {
          window.speechSynthesis.speak(utterance);
          if (isIOS) {
            resumeIntervalRef.current = setInterval(() => {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              } else {
                if (resumeIntervalRef.current) {
                  clearInterval(resumeIntervalRef.current);
                  resumeIntervalRef.current = null;
                }
              }
            }, 10000);
          }
        };

        if (isIOS) {
          setTimeout(startSpeaking, 100);
        } else {
          startSpeaking();
        }
      } catch (e) {
        console.error('[PrepMate] Speech synthesis speak failed:', e);
        setIsSpeaking(false);
      }
    },
    [isEnabled, rate, pitch, volume, getPreferredVoice]
  );

  const stop = useCallback(() => {
    if (!isSynthesisSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error('[PrepMate] Speech synthesis cancel failed:', e);
    }
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (isSpeaking) stop();
    setIsEnabled((prev) => !prev);
  }, [isSpeaking, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSynthesisSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current);
        resumeIntervalRef.current = null;
      }
    };
  }, []);

  return { speak, stop, toggle, isSpeaking, isEnabled, setIsEnabled, isSupported: isSynthesisSupported };
}
