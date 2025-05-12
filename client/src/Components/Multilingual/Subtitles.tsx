import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SubtitleItem {
  id: string;
  speakerName: string;
  speakerLanguage: string;
  originalText: string;
  translatedText: string;
  timestamp: Date;
  isFinal: boolean;
}

interface SubtitlesProps {
  subtitles: SubtitleItem[];
  maxItems?: number;
  position?: "bottom" | "top";
  className?: string;
}

const Subtitles: React.FC<SubtitlesProps> = ({
  subtitles,
  maxItems = 3,
  position = "bottom",
  className = "",
}) => {
  const [visibleSubtitles, setVisibleSubtitles] = useState<SubtitleItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and limit the number of subtitles to show
  useEffect(() => {
    // Only show final subtitles, or the most recent non-final one
    const finalSubtitles = subtitles
      .filter((s) => s.isFinal)
      .slice(-maxItems + 1);
    const nonFinalSubtitle = subtitles.find((s) => !s.isFinal);

    let visibleItems = [...finalSubtitles];
    if (nonFinalSubtitle) {
      visibleItems.push(nonFinalSubtitle);
    }

    // Sort by timestamp, most recent last
    visibleItems.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Limit to maxItems
    visibleItems = visibleItems.slice(-maxItems);

    setVisibleSubtitles(visibleItems);
  }, [subtitles, maxItems]);

  // Scroll to bottom when new subtitles appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleSubtitles]);

  // Time-based cleanup - remove subtitles after 10 seconds
  useEffect(() => {
    const now = new Date();
    const timeoutIds = visibleSubtitles
      .map((subtitle) => {
        const age = now.getTime() - new Date(subtitle.timestamp).getTime();
        const timeLeft = Math.max(10000 - age, 0); // 10 seconds max display time

        if (subtitle.isFinal && timeLeft > 0) {
          return setTimeout(() => {
            setVisibleSubtitles((current) =>
              current.filter((s) => s.id !== subtitle.id)
            );
          }, timeLeft);
        }
        return null;
      })
      .filter(Boolean);

    return () => {
      timeoutIds.forEach((id) => id && clearTimeout(id));
    };
  }, [visibleSubtitles]);

  if (visibleSubtitles.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`
        ${position === "bottom" ? "bottom-14" : "top-0"}
        fixed left-0 right-0 z-10 px-4 py-2 pointer-events-none
        flex flex-col ${position === "bottom" ? "justify-end" : "justify-start"}
        max-h-48 overflow-y-auto scrollbar-hide
        ${className}
      `}
    >
      <AnimatePresence>
        {visibleSubtitles.map((subtitle) => {
          // Determine if this is from the local user
          const isLocalUser = subtitle.speakerName === "You";

          return (
            <motion.div
              key={subtitle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className={`
                bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3 mb-2
                text-white shadow-lg border border-gray-700 max-w-3xl mx-auto w-full
                ${!subtitle.isFinal ? "border-l-4 border-l-blue-400" : ""}
                ${isLocalUser ? "border-r-4 border-r-green-400" : ""}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isLocalUser ? "text-green-300" : "text-blue-300"
                    }`}
                  >
                    {subtitle.speakerName}
                  </span>
                  <span className="text-xs text-gray-400">
                    speaking {subtitle.speakerLanguage}
                  </span>
                </div>
                {subtitle.originalText !== subtitle.translatedText && (
                  <span className="text-xs text-gray-400 italic">
                    (translated)
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base">
                {subtitle.translatedText || subtitle.originalText}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Subtitles;
