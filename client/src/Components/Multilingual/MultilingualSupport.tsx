import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Room, Participant, RoomEvent, DataPacket_Kind } from "livekit-client";
import ISO6391 from "iso-639-1";

import SpeechRecognitionService from "./SpeechRecognitionService";
import TranslationService from "./TranslationService";
import LanguageSelector from "./LanguageSelector";
import Subtitles, { SubtitleItem } from "./Subtitles";

interface MultilingualSupportProps {
  room: Room | null;
  localParticipant: Participant | null;
  participants: Participant[];
}

interface TranscriptMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderLanguage: string;
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

// Add types for LiveKit track events
interface TrackPublication {
  kind: string;
}

const MultilingualSupport: React.FC<MultilingualSupportProps> = ({
  room,
  localParticipant,
  participants,
}) => {
  // User's preferred language (for translation)
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");

  // Track if speech recognition is enabled
  const [isRecognitionEnabled, setIsRecognitionEnabled] =
    useState<boolean>(true);

  // Track if microphone is enabled in LiveKit
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState<boolean>(true);

  // Current subtitles to display
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);

  // Services
  const speechRecognition = useRef<SpeechRecognitionService | null>(null);
  const translationService = useRef<TranslationService | null>(null);

  // Settings panel visibility
  const [showLanguageSettings, setShowLanguageSettings] =
    useState<boolean>(false);

  // Current speech state for local participant
  const currentSpeechRef = useRef<{
    text: string;
    messageId: string | null;
  }>({
    text: "",
    messageId: null,
  });

  // For debugging
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Track LiveKit microphone status
  useEffect(() => {
    if (!localParticipant) return;

    // Initial state
    setIsMicrophoneEnabled(localParticipant.isMicrophoneEnabled);

    // Define handlers outside to use in both add and remove
    const handleTrackMuted = (pub: TrackPublication) => {
      if (pub.kind === "audio") {
        console.log("LiveKit microphone disabled");
        setIsMicrophoneEnabled(false);
      }
    };

    const handleTrackUnmuted = (pub: TrackPublication) => {
      if (pub.kind === "audio") {
        console.log("LiveKit microphone enabled");
        setIsMicrophoneEnabled(true);
      }
    };

    // Add event listeners
    localParticipant.on("trackMuted", handleTrackMuted);
    localParticipant.on("trackUnmuted", handleTrackUnmuted);

    return () => {
      // Clean up event listeners
      localParticipant.off("trackMuted", handleTrackMuted);
      localParticipant.off("trackUnmuted", handleTrackUnmuted);
    };
  }, [localParticipant]);

  // Send transcript to all participants via data channel
  const sendTranscriptToParticipants = useCallback(
    (transcript: TranscriptMessage) => {
      if (!room) return;

      try {
        const data = {
          type: "transcript",
          id: transcript.id,
          text: transcript.text,
          language: transcript.senderLanguage,
          isFinal: transcript.isFinal,
          timestamp: transcript.timestamp.toISOString(),
          senderName: transcript.senderName,
          senderId: transcript.senderId,
        };

        // Convert to binary data
        const encoder = new TextEncoder();
        const jsonString = JSON.stringify(data);
        const payload = encoder.encode(jsonString);

        // Send to all participants
        room.localParticipant.publishData(payload, {
          reliable: true,
        });

        console.log("Sent transcript to participants:", data);
      } catch (error) {
        console.error("Error sending transcript:", error);
      }
    },
    [room]
  );

  // Process received transcripts and translate if needed
  const handleTranscriptReceived = useCallback(
    async (transcript: TranscriptMessage) => {
      // Always translate if translation service is available
      if (translationService.current) {
        try {
          const result = await translationService.current.translate(
            transcript.text,
            transcript.senderLanguage,
            preferredLanguage
          );

          const subtitleItem: SubtitleItem = {
            id: transcript.id,
            speakerName: transcript.senderName,
            speakerLanguage:
              ISO6391.getName(transcript.senderLanguage) ||
              transcript.senderLanguage,
            originalText: transcript.text,
            translatedText: result.translatedText,
            timestamp: transcript.timestamp,
            isFinal: transcript.isFinal,
          };

          setSubtitles((prev) => {
            const exists = prev.some((s) => s.id === subtitleItem.id);
            return exists
              ? prev.map((s) => (s.id === subtitleItem.id ? subtitleItem : s))
              : [...prev, subtitleItem];
          });
        } catch (error) {
          console.error("Translation error:", error);
          const subtitleItem: SubtitleItem = {
            id: transcript.id,
            speakerName: transcript.senderName,
            speakerLanguage:
              ISO6391.getName(transcript.senderLanguage) ||
              transcript.senderLanguage,
            originalText: transcript.text,
            translatedText: transcript.text,
            timestamp: transcript.timestamp,
            isFinal: transcript.isFinal,
          };

          setSubtitles((prev) => {
            const exists = prev.some((s) => s.id === subtitleItem.id);
            return exists
              ? prev.map((s) => (s.id === subtitleItem.id ? subtitleItem : s))
              : [...prev, subtitleItem];
          });
        }
      }
    },
    [preferredLanguage]
  );

  // Handle speech recognition results - define this after the above functions
  const handleSpeechResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (!room || !localParticipant) return;

      // If microphone is disabled in LiveKit, don't process speech
      if (!isMicrophoneEnabled) {
        console.log(
          "Ignoring speech recognition - microphone is disabled in LiveKit"
        );
        return;
      }

      // Skip empty or very short texts unless final
      if (!isFinal && text.trim().length < 2) return;

      const messageId = currentSpeechRef.current.messageId || uuidv4();
      currentSpeechRef.current.text = text;
      currentSpeechRef.current.messageId = messageId;

      // Prepare transcript message
      const transcript: TranscriptMessage = {
        id: messageId,
        senderId: localParticipant.identity,
        senderName: localParticipant.name || "You",
        senderLanguage: preferredLanguage,
        text,
        isFinal,
        timestamp: new Date(),
      };

      // Send to other participants
      sendTranscriptToParticipants(transcript);

      // For local display, explicitly mark as local user
      const localTranscript: TranscriptMessage = {
        ...transcript,
        senderName: "You", // Always "You" for local user display
      };

      // Also process locally
      handleTranscriptReceived(localTranscript);

      // When speech is final, reset the message ID for new utterances
      if (isFinal) {
        currentSpeechRef.current.messageId = null;
      }
    },
    [
      room,
      localParticipant,
      preferredLanguage,
      isMicrophoneEnabled,
      sendTranscriptToParticipants,
      handleTranscriptReceived,
    ]
  );

  // Initialize translation service
  useEffect(() => {
    if (!translationService.current) {
      translationService.current = new TranslationService();
    }

    return () => {
      // No need to clean up the translation service
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // Function to create a new speech recognition service
    const createSpeechRecognition = () => {
      // Clear any previous instance
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }

      // Only create if we have the necessary global objects
      if (typeof window !== "undefined") {
        speechRecognition.current = new SpeechRecognitionService({
          language: preferredLanguage,
          continuous: true,
          interimResults: true,
          onResult: handleSpeechResult,
          onError: (error) => {
            console.error("Speech recognition error:", error);
          },
        });
      }
    };

    // Create with a small delay to avoid DOM not ready issues
    const initTimeout = setTimeout(() => {
      createSpeechRecognition();
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [preferredLanguage, handleSpeechResult]);

  // Start/stop speech recognition based on enabled state AND microphone state
  useEffect(() => {
    // Only start if both settings allow
    const shouldBeRunning = isRecognitionEnabled && isMicrophoneEnabled;

    const startRecognitionWithDelay = () => {
      if (speechRecognition.current && shouldBeRunning) {
        setTimeout(() => {
          try {
            console.log("Starting speech recognition - microphone is enabled");
            speechRecognition.current?.start();
          } catch (error) {
            console.error("Failed to start speech recognition:", error);
          }
        }, 500);
      }
    };

    if (shouldBeRunning) {
      startRecognitionWithDelay();
    } else {
      if (speechRecognition.current) {
        console.log(
          "Stopping local speech recognition - " +
            (isMicrophoneEnabled
              ? "user disabled recognition"
              : "microphone is disabled")
        );
        // This only stops our own speech recognition, not the handling of received transcripts
        speechRecognition.current.stop();
      }
    }

    return () => {
      // Cleanup will be handled by the main useEffect
    };
  }, [isRecognitionEnabled, isMicrophoneEnabled]);

  // Set up room data channel for transcript exchange
  useEffect(() => {
    if (!room) return;

    // Listen for transcript messages from other participants
    const handleDataReceived = (
      payload: Uint8Array,
      topic: string | undefined,
      senderId: string
    ) => {
      try {
        // Convert binary data to string
        const jsonString = new TextDecoder().decode(payload);
        const data = JSON.parse(jsonString);
        console.log("Received data packet:", data, "from:", senderId);

        if (data.type === "transcript") {
          // Get sender participant
          const sender = participants.find((p) => p.identity === senderId);

          console.log("Found sender:", sender?.name, "for ID:", senderId);

          // Don't process our own messages from the data channel
          if (senderId === localParticipant?.identity) {
            return;
          }

          // Process transcript even if sender not found
          const senderName =
            sender?.name || data.senderName || "Unknown participant";

          const transcript: TranscriptMessage = {
            id: data.id,
            senderId: senderId,
            senderName: senderName,
            senderLanguage: data.language || "unknown",
            text: data.text,
            isFinal: data.isFinal,
            timestamp: new Date(data.timestamp || Date.now()),
          };

          // Always handle received transcripts regardless of our microphone state
          console.log("Processing received transcript:", transcript);
          handleTranscriptReceived(transcript);
        }
      } catch (error) {
        console.error("Error handling data message:", error);
      }
    };

    // Add event listener for all data types
    const dataReceivedHandler = (
      payload: Uint8Array,
      participant: Participant | undefined,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {
      console.log(
        "Data received from participant:",
        participant?.identity,
        "kind:",
        kind
      );
      handleDataReceived(payload, topic, participant?.identity || "");
    };

    // Listen for ALL data events
    room.on(RoomEvent.DataReceived, dataReceivedHandler);

    console.log("Set up data channel listener for room:", room.name);

    // Clean up
    return () => {
      room.off(RoomEvent.DataReceived, dataReceivedHandler);
    };
  }, [
    room,
    participants,
    handleTranscriptReceived,
    localParticipant?.identity,
  ]);

  // Toggle speech recognition
  const toggleSpeechRecognition = useCallback(() => {
    if (!speechRecognition.current) return;

    setIsRecognitionEnabled((prev) => !prev);
  }, []);

  // Handle language change
  const handleLanguageChange = useCallback((language: string) => {
    setPreferredLanguage(language);

    if (speechRecognition.current) {
      speechRecognition.current.setLanguage(language);
    }

    // Clear current subtitles when language changes
    setSubtitles([]);
  }, []);

  // Check if speech recognition is supported
  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Display debugging information
  const renderDebugInfo = () => {
    if (!debugMode) return null;

    return (
      <div className="absolute top-0 left-0 z-50 max-w-full p-2 overflow-auto font-mono text-xs text-white bg-black bg-opacity-75">
        <div>Room: {room?.name}</div>
        <div>
          Local: {localParticipant?.identity} ({preferredLanguage})
        </div>
        <div>Participants: {participants.length}</div>
        <div>Mic: {isMicrophoneEnabled ? "ON" : "OFF"}</div>
        <div>Recognition: {isRecognitionEnabled ? "ON" : "OFF"}</div>
        <div>Subtitles: {subtitles.length}</div>
        <div>
          <button
            className="p-1 mt-1 text-xs text-white bg-red-500 rounded"
            onClick={() => setShowLanguageSettings(true)}
          >
            Open Settings
          </button>
          <button
            className="p-1 mt-1 ml-2 text-xs text-white bg-blue-500 rounded"
            onClick={() => setSubtitles([])}
          >
            Clear Subtitles
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Debug info */}
      {renderDebugInfo()}

      {/* Subtitles display */}
      <Subtitles subtitles={subtitles} position="bottom" maxItems={3} />

      {/* Language settings button */}
      <div className="absolute z-20 flex flex-col gap-2 right-4 bottom-20">
        <button
          onClick={() => setShowLanguageSettings(!showLanguageSettings)}
          className="flex items-center justify-center p-2 text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 cursor-pointer"
          title="Language settings"
        >
          Setting
        </button>

        <button
          onClick={() => setDebugMode(!debugMode)}
          className="flex items-center justify-center p-2 text-white bg-gray-600 rounded-full shadow-lg hover:bg-gray-700 cursor-pointer px-4"
          title="Toggle debug mode"
        >
          Debug
        </button>
      </div>

      {/* Settings panel */}
      {showLanguageSettings && (
        <div className="absolute z-20 w-64 p-4 bg-white rounded-lg shadow-xl right-4 bottom-32 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Language Settings
            </h3>
            <button
              onClick={() => setShowLanguageSettings(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Language
            </label>
            <LanguageSelector
              selectedLanguage={preferredLanguage}
              onLanguageChange={handleLanguageChange}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Subtitles will be translated to this language. You&apos;ll always
              receive translations from other speakers, even if your microphone
              is off.
            </p>
          </div>

          {isSpeechRecognitionSupported && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speech Recognition
              </span>
              <button
                onClick={toggleSpeechRecognition}
                className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                  isRecognitionEnabled
                    ? "bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                    isRecognitionEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {!isMicrophoneEnabled && (
            <div className="p-2 mt-3 text-xs text-yellow-800 bg-yellow-100 rounded">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Microphone is muted
              </div>
              <p className="mt-1">
                Enable your microphone in call controls for speech recognition
                to work.
              </p>
            </div>
          )}

          {!isSpeechRecognitionSupported && (
            <p className="text-xs text-red-500">
              Speech recognition is not supported in your browser
            </p>
          )}

          {/* Test message feature */}
          {/* <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Translation
            </label>
            <div className="flex gap-2">
              {" "}
              <input
                type="text"
                placeholder="Type a test message"
                className="flex-1 p-1 text-sm border rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                onKeyDown={(e) => {
                  const inputValue = e.currentTarget.value.trim();
                  if (
                    e.key === "Enter" &&
                    inputValue &&
                    localParticipant &&
                    room
                  ) {
                    const testTranscript: TranscriptMessage = {
                      id: uuidv4(),
                      senderId: localParticipant.identity,
                      senderName: localParticipant.name || "You",
                      senderLanguage: preferredLanguage,
                      text: inputValue,
                      isFinal: true,
                      timestamp: new Date(),
                    };

                    sendTranscriptToParticipants(testTranscript);
                    handleTranscriptReceived({
                      ...testTranscript,
                      senderName: "You",
                    });

                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                onClick={() => {
                  const input = document.querySelector(
                    'input[type="text"]'
                  ) as HTMLInputElement;
                  const inputValue = input?.value.trim();

                  if (inputValue && localParticipant && room) {
                    const testTranscript: TranscriptMessage = {
                      id: uuidv4(),
                      senderId: localParticipant.identity,
                      senderName: localParticipant.name || "You",
                      senderLanguage: preferredLanguage,
                      text: inputValue,
                      isFinal: true,
                      timestamp: new Date(),
                    };

                    sendTranscriptToParticipants(testTranscript);
                    handleTranscriptReceived({
                      ...testTranscript,
                      senderName: "You",
                    });

                    input.value = "";
                  }
                }}
              >
                Send
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use this to test translations when speech recognition is not
              working
            </p> 
          {/* </div> */}
        </div>
      )}
    </>
  );
};

export default MultilingualSupport;
