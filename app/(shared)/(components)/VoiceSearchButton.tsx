"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface SpeechRecognitionResultLike {
  0?: {
    transcript?: string;
  };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onnomatch: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
}

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

const getErrorMessage = (error?: string) => {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "마이크 권한을 허용해주세요.";
  }
  if (error === "no-speech") {
    return "음성이 인식되지 않았습니다.";
  }
  return "음성인식 중 오류가 발생했습니다.";
};

export default function VoiceSearchButton({ onTranscript }: VoiceSearchButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCheckRafRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTranscriptRef = useRef(false);
  const hasSpeechStartedRef = useRef(false);
  const hasAudioInputRef = useRef(false);
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(getSpeechRecognition());
  });
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (nextMessage: string, autoHide = false) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    setMessage(nextMessage);

    if (autoHide) {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage("");
        messageTimeoutRef.current = null;
      }, 2500);
    }
  };

  const cleanupMic = () => {
    if (audioCheckRafRef.current) {
      cancelAnimationFrame(audioCheckRafRef.current);
      audioCheckRafRef.current = null;
    }
    audioContextRef.current?.close();
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      cleanupMic();
    };
  }, []);

  const startAudioInputCheck = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextConstructor) return;

    const audioContext = new AudioContextConstructor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    audioContextRef.current = audioContext;

    const checkAudioLevel = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const centered = value - 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / data.length);

      if (rms > 6) {
        hasAudioInputRef.current = true;
      }

      audioCheckRafRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const stopListening = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    recognitionRef.current?.stop();
    cleanupMic();
    setIsListening(false);
  };

  const requestMicAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      return stream;
    } catch {
      showMessage("브라우저/시스템 마이크 권한을 허용해주세요.", true);
      setIsListening(false);
      return null;
    }
  };

  const startListening = async () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setIsSupported(false);
      showMessage("이 브라우저는 음성인식을 지원하지 않습니다.", true);
      return;
    }

    showMessage("마이크 권한 확인 중");
    setIsListening(true);

    const canRequestMicAccess = Boolean(navigator.mediaDevices?.getUserMedia);
    const stream = await requestMicAccess();
    if (!stream && canRequestMicAccess) return;
    if (stream) startAudioInputCheck(stream);

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    hasTranscriptRef.current = false;
    hasSpeechStartedRef.current = false;
    hasAudioInputRef.current = false;

    recognition.onstart = () => {
      showMessage("8초 동안 듣는 중");
      setIsListening(true);
    };

    recognition.onaudiostart = () => {
      showMessage("듣는 중");
      setIsListening(true);
    };

    recognition.onspeechstart = () => {
      hasSpeechStartedRef.current = true;
      showMessage("말하는 중");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        hasTranscriptRef.current = true;
        onTranscript(transcript);
        showMessage(`"${transcript}"`, true);
        if (stopTimeoutRef.current) {
          clearTimeout(stopTimeoutRef.current);
        }
        stopTimeoutRef.current = setTimeout(() => {
          recognition.stop();
        }, 900);
      } else {
        showMessage("음성이 인식되지 않았습니다.", true);
      }
    };

    recognition.onnomatch = () => {
      showMessage("이름을 인식하지 못했습니다.", true);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" && hasTranscriptRef.current) {
        showMessage("인식된 이름을 검색했습니다.", true);
      } else {
        showMessage(getErrorMessage(event.error), true);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      cleanupMic();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    showMessage("마이크 시작 중");
    setIsListening(true);

    try {
      recognition.start();
      stopTimeoutRef.current = setTimeout(() => {
        recognition.stop();
        if (!hasTranscriptRef.current) {
          showMessage(
            hasAudioInputRef.current || hasSpeechStartedRef.current
              ? "음성은 감지됐지만 텍스트로 변환되지 않았습니다."
              : "마이크 입력이 감지되지 않았습니다.",
            true
          );
        }
      }, 8000);
    } catch {
      cleanupMic();
      showMessage("음성인식을 시작하지 못했습니다.", true);
      setIsListening(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          isListening
            ? "border-[#2C79FF] bg-[#F7F8FF] text-[#2C79FF]"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label={isListening ? "음성인식 중지" : "음성으로 검색"}
        title={!isSupported ? "이 브라우저는 음성인식을 지원하지 않습니다." : "음성으로 검색"}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      {message && (
        <span className="absolute right-0 top-12 z-20 whitespace-nowrap rounded-md border border-gray-100 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm">
          {message}
        </span>
      )}
    </div>
  );
}
