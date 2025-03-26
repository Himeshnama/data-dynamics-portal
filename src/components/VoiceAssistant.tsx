
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Headphones } from 'lucide-react';

interface VoiceAssistantProps {
  onTranscript: (transcript: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onTranscript,
  isListening,
  startListening,
  stopListening
}) => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<string>('');

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        type="button"
        variant={isListening ? "destructive" : "default"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        className="gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Start Listening
          </>
        )}
      </Button>
      
      {transcript && (
        <div className="text-sm text-gray-400 ml-2">
          "{transcript}"
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
