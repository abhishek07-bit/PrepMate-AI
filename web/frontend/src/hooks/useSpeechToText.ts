import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechToTextOptions {
  onResult?: (transcript: string) => void;
  lang?: string;
}

const isSpeechSupported =
  typeof window !== 'undefined' &&
  !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { lang = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(options.onResult);

  // Keep the callback ref in sync without re-creating the recognition instance
  useEffect(() => {
    onResultRef.current = options.onResult;
  }, [options.onResult]);

  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // iOS Safari does NOT support continuous mode — it silently fails.
    // Detect iOS/iPadOS and disable continuous for compatibility.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    recognition.continuous = !isIOS;
    recognition.interimResults = true;
    recognition.lang = lang;

    let shouldRestart = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      // On iOS (non-continuous mode), auto-restart if user hasn't explicitly stopped
      if (shouldRestart && isIOS) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      // 'no-speech' is common on iOS and not a real error
      if (event.error === 'no-speech') return;
      console.error('Speech recognition error:', event.error);
      shouldRestart = false;
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);
      if (onResultRef.current && event.results[event.results.length - 1].isFinal) {
        onResultRef.current(event.results[event.results.length - 1][0].transcript);
      }
    };

    recognitionRef.current = recognition;
    // Expose shouldRestart control
    (recognitionRef.current as any).__shouldRestart = (val: boolean) => { shouldRestart = val; };

    // Cleanup: stop recognition on unmount
    return () => {
      shouldRestart = false;
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      // Enable iOS auto-restart
      (recognitionRef.current as any).__shouldRestart?.(true);
      try {
        recognitionRef.current.start();
      } catch {
        // Already started
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Disable iOS auto-restart before stopping
      (recognitionRef.current as any).__shouldRestart?.(false);
      if (isListening) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already stopped
        }
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSpeechSupported,
  };
}
