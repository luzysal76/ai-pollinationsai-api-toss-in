// Web Speech API 기반 음성 인식 훅
// 한국어(ko-KR) 우선, interim 결과 실시간 콜백

import { useState, useRef, useEffect } from 'react';

const SR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * @param {{ onResult?: ({final, interim}) => void, onEnd?: () => void }} opts
 */
export function useSpeechRecognition({ onResult, onEnd } = {}) {
  const [isListening, setIsListening]   = useState(false);
  const recognitionRef                   = useRef(null);
  const onResultRef                      = useRef(onResult);
  const onEndRef                         = useRef(onEnd);
  const isSupported                      = !!SR;

  // 콜백 최신 참조 유지 (리렌더 시 재구독 방지)
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // 언마운트 시 정리
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const startListening = () => {
    if (!SR || isListening) return;

    const r = new SR();
    r.lang            = 'ko-KR';
    r.continuous      = true;
    r.interimResults  = true;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final   += transcript;
        else                       interim += transcript;
      }
      onResultRef.current?.({ final, interim });
    };

    r.onend = () => {
      setIsListening(false);
      onEndRef.current?.();
    };

    r.onerror = (e) => {
      console.warn('[음성인식] 오류:', e.error);
      setIsListening(false);
      onEndRef.current?.();
    };

    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else             startListening();
  };

  return { isListening, isSupported, startListening, stopListening, toggleListening };
}
