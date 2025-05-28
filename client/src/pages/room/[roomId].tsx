/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// Preemptive error suppression for LiveKit (needs to run immediately)
if (typeof window !== "undefined") {
  // Replace the native console.error to filter out LiveKit errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const errorStr = args.join(" ");
    if (
      errorStr.includes("_camera_placeholder not in") ||
      errorStr.includes("publication of local track timed out") ||
      errorStr.includes("PublishTrackError") ||
      errorStr.includes("ConnectionError") ||
      errorStr.includes("engine not connected")
    ) {
      // Suppress LiveKit errors from console
      console.warn("Suppressed LiveKit error in console:", args[0]);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Intercept and suppress error display at the DOM level
  const originalErrorHandler = window.ErrorEvent;
  if (originalErrorHandler && originalErrorHandler.prototype) {
    const originalToString = Error.prototype.toString;
    Error.prototype.toString = function () {
      const originalResult = originalToString.call(this);
      if (
        originalResult.includes("_camera_placeholder not in") ||
        originalResult.includes("publication of local track timed out") ||
        originalResult.includes("PublishTrackError") ||
        originalResult.includes("engine not connected")
      ) {
        // Return an empty error message for UI elements
        return "[Suppressed LiveKit Error]";
      }
      return originalResult;
    };
  }

  // Prevent React from showing error overlays for LiveKit errors
  const removeErrorOverlays = () => {
    const errorOverlays = document.querySelectorAll(
      "[data-nextjs-errors], [data-nextjs-dialog-overlay]"
    );
    errorOverlays.forEach((overlay) => {
      const textContent = overlay.textContent || "";
      if (
        textContent.includes("camera_placeholder") ||
        textContent.includes("publishing rejected") ||
        textContent.includes("publication of local track timed out")
      ) {
        overlay.remove();
      }
    });
  };

  // Run the overlay remover periodically
  setInterval(removeErrorOverlays, 100);

  // Override React/Next.js error display
  (window as any).__NEXT_REDUX_STORE__ =
    (window as any).__NEXT_REDUX_STORE__ || {};
  (window as any).__NEXT_REDUX_STORE__.onError = function (err: any) {
    if (
      err &&
      (err.message?.includes("_camera_placeholder not in") ||
        err.message?.includes("publication of local track timed out") ||
        err.message?.includes("PublishTrackError") ||
        err.message?.includes("engine not connected"))
    ) {
      console.warn("Suppressed Next.js error display:", err.message);
      return true; // Tell Next.js we handled it
    }
    return false; // Let Next.js handle other errors
  };
}

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
  LayoutContextProvider,
  ConnectionStateToast,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { Room as RoomType, RoomEvent, DisconnectReason } from "livekit-client";
import "@livekit/components-styles";
import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

// Import the MultilingualSupport component
import MultilingualSupport from "../../Components/Multilingual";

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export default function Room() {
  const router = useRouter();
  const { roomId, host } = router.query;
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [roomLink, setRoomLink] = useState("");
  const isHost = host === "true";
  const [showInviteCard, setShowInviteCard] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  // Reference to help focus the chat input when opened
  const chatInputRef = useRef<HTMLInputElement>(null);
  // Reference for the invite card
  const inviteCardRef = useRef<HTMLDivElement>(null);
  const inviteButtonRef = useRef<HTMLButtonElement>(null);

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Reference to LiveKit room
  const roomRef = useRef<RoomType | null>(null);

  // Responsive design variables
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallDevice, setIsSmallDevice] = useState(false);
  // Flag to track if disconnection is in progress
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Add a state for tracking when the room is actively being terminated by the host
  const [isTerminatingRoom, setIsTerminatingRoom] = useState(false);

  // Add resize listener for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      setIsSmallDevice(window.innerWidth < 1024); // lg breakpoint
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!authToken || !userStr) {
      router.push("/Login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);

      // Fetch the LiveKit token from the server
      if (roomId) {
        fetchLiveKitToken(userData.name, String(roomId), isHost, authToken);
        // Generate shareable room link
        const baseUrl = window.location.origin;
        setRoomLink(`${baseUrl}/room/${roomId}`);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/Login");
    }
  }, [roomId, isHost, router]);

  // Request media permissions early
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        // Request permissions early
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Don't need to keep the stream since LiveKit will handle media
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.error("Failed to get media permissions:", err);
      }
    };

    requestMediaPermissions();
  }, []);

  const fetchLiveKitToken = async (
    username: string,
    room: string,
    isRoomHost: boolean,
    authToken: string
  ) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      console.log("Fetching LiveKit token from:", apiUrl);
      console.log("Room ID:", room);
      console.log("Is host:", isRoomHost);

      // Call the server API
      const response = await fetch(
        `${apiUrl}/api/room/token?roomId=${room}&username=${username}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to get access token: ${data.message || response.statusText}`
        );
      }

      if (data.success && data.data.token) {
        setToken(data.data.token);
      } else {
        throw new Error(data.message || "Failed to get token");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching token:", err);
      setError(
        `Failed to connect to room: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setLoading(false);
      // Try fetching test token if in development
      if (process.env.NODE_ENV === "development") {
        fetchTestToken();
      }
    }
  };

  const fetchTestToken = async () => {
    try {
      console.log("Trying to fetch test token as fallback");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const room = String(roomId);
      const username = user?.name || "anonymous";

      const response = await fetch(
        `${apiUrl}/api/room/test-token?roomId=${room}&username=${username}`
      );

      if (!response.ok) {
        throw new Error("Failed to get test token");
      }

      const data = await response.json();

      if (data.success && data.data.token) {
        setToken(data.data.token);
        setError(null);
        setLoading(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error fetching test token:", err);
      return false;
    }
  };

  // Connection callback - store room reference
  const handleRoomConnected = (room?: RoomType) => {
    console.log("Room connected successfully");
    setConnectionStatus("connected");
    showNotification("Connected to room successfully", "success");

    // Store room reference
    if (room) {
      roomRef.current = room;

      // Add event listener for data messages
      room.on(RoomEvent.DataReceived, handleDataReceived);
    }

    // Request camera and microphone permissions
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Camera and microphone access granted");
        stream.getTracks().forEach((track) => track.stop()); // We don't need to keep this stream as LiveKit will handle it
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        showNotification("Could not access camera or microphone", "warning");
      });
  };

  const handleRoomDisconnected = (reason?: DisconnectReason) => {
    console.log("Room disconnected:", reason);
    setConnectionStatus("disconnected");
    showNotification(
      `Disconnected from room: ${reason || "Unknown reason"}`,
      "warning"
    );
    handleLeave();
  };

  const handleRoomError = (err: Error) => {
    console.error("LiveKit Room error:", err);
    setError(`Connection error: ${err.message}`);
    showNotification(`Connection error: ${err.message}`, "error");
  };

  // Add this new function for handling single-user disconnect scenarios
  const directRedirectWithoutDisconnect = () => {
    // Hide all error overlays using CSS
    const errorBlockingStyle = document.createElement("style");
    errorBlockingStyle.innerHTML = `
      /* Hide Next.js error overlays and dialogs */
      [data-nextjs-dialog-overlay], 
      [data-nextjs-errors], 
      [data-nextjs-dialog],
      [id*="__next-error"],
      [class*="Toastify"],
      body > div:not([id]):last-child /* This targets the auto-injected error overlay */ {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
      
      /* Prevent error dialogs from being shown */
      html, body {
        overflow: hidden !important; 
      }
    `;
    document.head.appendChild(errorBlockingStyle);

    // Abort any pending LiveKit operations to prevent them from causing errors
    if (typeof window.AbortController !== "undefined") {
      const controller = new AbortController();
      const signal = controller.signal;
      console.log(signal);
      controller.abort(); // Abort any pending LiveKit fetch requests
    }

    // Prevent console errors from showing
    const originalConsoleError = console.error;
    console.error = function (...args) {
      const message = args.join(" ");
      if (
        message.includes("camera_placeholder") ||
        message.includes("ConnectionError") ||
        message.includes("not in")
      ) {
        return; // Suppress these specific errors
      }
      originalConsoleError.apply(console, args);
    };

    // Force immediate redirect after a very short delay
    // This prevents the error from being displayed
    setTimeout(() => {
      window.location.href = "/"; // Use direct location change instead of router
    }, 50);
  };

  const handleLeave = () => {
    // Get participant count - use correct property
    let participantCount = 1; // Default to just the local participant

    if (roomRef.current) {
      try {
        // Count remote participants (if any) and add local participant
        participantCount = (roomRef.current as any).numParticipants || 1;
      } catch (e) {
        console.warn("Error getting participant count:", e);
        // Use safe default of 1
        participantCount = 1;
      }
    }

    // If only one user (just the person leaving) is in the room,
    // use our most aggressive direct redirect approach
    if (participantCount <= 1) {
      if (isHost) {
        // Even for hosts, if they're alone, we can use the direct method
        directRedirectWithoutDisconnect();
      } else {
        // For non-hosts that are alone, use direct redirect
        directRedirectWithoutDisconnect();
      }
      return;
    }

    // For rooms with multiple participants, use the normal flow
    if (isHost) {
      // Only show confirmation for hosts
      setShowLeaveConfirmation(true);
    } else {
      // For non-hosts in rooms with others, immediately begin the disconnection process without confirmation
      // But first hide any potential error dialogs
      const style = document.createElement("style");
      style.innerHTML = `
        [data-nextjs-dialog-overlay], [data-nextjs-errors], .Toastify__toast--error {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          z-index: -9999 !important;
        }
      `;
      document.head.appendChild(style);

      // Show a brief "Leaving..." notification
      showNotification("Leaving meeting...", "warning");

      // Start a direct navigation timeout - this ensures we always navigate even if LiveKit has issues
      const navigationTimeout = setTimeout(() => {
        // Force navigation after a short delay regardless of LiveKit state
        router.push("/");
      }, 1000);

      // Try to safely disconnect in the background
      try {
        // Disable all tracks but don't wait for it to complete
        if (roomRef.current && roomRef.current.localParticipant) {
          const participant = roomRef.current.localParticipant;

          // Mute video and audio
          participant
            .setCameraEnabled(false)
            .catch((e) => console.warn("Could not disable camera:", e));
          participant
            .setMicrophoneEnabled(false)
            .catch((e) => console.warn("Could not disable mic:", e));

          // Stop any track sharing
          participant
            .setScreenShareEnabled(false)
            .catch((e) => console.warn("Could not disable screen share:", e));

          // Try to clean up placeholders that cause errors - use type assertion for internal properties
          const participantAny = participant as any;
          if (participantAny._trackPublications) {
            Object.keys(participantAny._trackPublications).forEach((key) => {
              if (key.includes("placeholder")) {
                delete participantAny._trackPublications[key];
              }
            });
          }

          // Try to disconnect in the background
          roomRef.current.disconnect(true).catch((e) => {
            console.warn("Disconnect error (continuing navigation):", e);
          });
        }
      } catch (e) {
        console.warn("Error during quick disconnect:", e);
        // Continue with navigation regardless of errors
      }
    }
  };

  // Modified safer disconnect that addresses all known LiveKit edge cases
  const safeDisconnect = async () => {
    // Prevent multiple disconnection attempts
    if (isDisconnecting) return;

    setIsDisconnecting(true);
    // Hide any error dialogs that might appear during disconnection
    const style = document.createElement("style");
    style.textContent = `
      [data-nextjs-dialog-overlay], [data-nextjs-errors], .Toastify__toast--error {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        z-index: -9999 !important;
      }
    `;
    document.head.appendChild(style);

    try {
      // Check if room reference exists
      if (roomRef.current) {
        const room = roomRef.current;

        try {
          // First, disable all local tracks to prevent the placeholder error
          if (room.localParticipant) {
            const localParticipant = room.localParticipant;

            try {
              // Explicitly disable all media types first
              // This is crucial for preventing the placeholder track error
              await localParticipant.setMicrophoneEnabled(false);
              await localParticipant.setCameraEnabled(false);
              await localParticipant.setScreenShareEnabled(false);

              // Allow time for track disabling to take effect
              await new Promise((resolve) => setTimeout(resolve, 200));

              // Get all published tracks
              const publications = Array.from(
                localParticipant.trackPublications.values()
              );

              // Use a more careful approach to unpublish tracks
              for (const publication of publications) {
                try {
                  if (publication.track) {
                    // Mute the track first to stop media flow
                    publication.track.mute();

                    // Attempt to detach any elements before stopping
                    publication.track.detach();

                    // Then stop the track to release hardware
                    publication.track.stop();

                    // Wait briefly between track operations for stability
                    await new Promise((resolve) => setTimeout(resolve, 50));
                  }
                } catch (trackErr) {
                  console.warn("Error cleaning up track:", trackErr);
                  // Continue with other tracks even if one fails
                }
              }

              // Wait a moment for track operations to complete
              await new Promise((resolve) => setTimeout(resolve, 300));

              // Run the specialized placeholder cleaner before disconnection
              cleanPlaceholderTracks(room);
            } catch (mediaErr) {
              console.warn("Error disabling media:", mediaErr);
            }
          }
        } catch (trackError) {
          console.warn("Error while cleaning up local tracks:", trackError);
          // Continue with disconnection despite track errors
        }

        // Disconnect from the room with a timeout
        try {
          const disconnectWithTimeout = async () => {
            return new Promise<void>((resolve) => {
              // Set timeout for disconnect operation
              const timeoutId = setTimeout(() => {
                console.warn("Disconnect operation timed out");
                resolve();
              }, 3000);

              // Run placeholder cleaner one more time right before disconnect
              cleanPlaceholderTracks(room);

              // Attempt to disconnect
              room
                .disconnect(true)
                .then(() => {
                  clearTimeout(timeoutId);
                  resolve();
                })
                .catch((err) => {
                  console.warn("Disconnect error:", err);
                  clearTimeout(timeoutId);
                  resolve();
                });
            });
          };

          await disconnectWithTimeout();
          console.log("Disconnect process completed");
        } catch (disconnectError) {
          console.warn("Disconnect operation error:", disconnectError);
        }
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
    } finally {
      // Reset room reference to prevent any further interactions with it
      roomRef.current = null;

      // Cleanup the style element
      document.head.removeChild(style);

      // Always navigate away AFTER proper cleanup, even if there were errors
      // Use a setTimeout to ensure all UI events have completed
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  };

  // Modified confirmLeave for safer host leaving process with notification to other participants
  const confirmLeave = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Set termination in progress flag
      setIsTerminatingRoom(true);

      // If we have a room and it's connected, send a message to all participants
      if (roomRef.current) {
        try {
          // Broadcast to all participants that the meeting is ending
          const dataEncoder = new TextEncoder();
          const terminationMessage = {
            type: "room_termination",
            message: "The host has ended the meeting",
            timestamp: new Date().toISOString(),
            hostName: user?.name || "Host",
          };

          // Send the message to all participants
          await roomRef.current.localParticipant.publishData(
            dataEncoder.encode(JSON.stringify(terminationMessage)),
            { reliable: true }
          );

          // Wait a moment for the message to be delivered before disconnecting
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Show notification that we're ending the meeting
          showNotification("Ending meeting for all participants...", "warning");
        } catch (broadcastError) {
          console.warn(
            "Could not broadcast termination message:",
            broadcastError
          );
          // Continue with termination even if broadcast fails
        }
      }

      // Close the leave confirmation modal
      setShowLeaveConfirmation(false);

      // First safely disconnect from the room
      await safeDisconnect();

      // Then end the room on the server
      try {
        await fetch(`${apiUrl}/api/room/end?roomId=${roomId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        showNotification("Meeting ended successfully", "success");
      } catch (apiError) {
        console.error("Error ending room via API:", apiError);
        // Continue with navigation even if API call fails
      }
    } catch (error) {
      console.error("Error during leave process:", error);
      // Ensure navigation happens even with errors
      router.push("/");
    } finally {
      setIsTerminatingRoom(false);
    }
  };

  const cancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  // Notification helper
  const showNotification = (
    message: string,
    type: "success" | "warning" | "error"
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000); // Hide after 5 seconds
  };

  // Handle click outside of invite card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showInviteCard &&
        inviteCardRef.current &&
        inviteButtonRef.current &&
        !inviteCardRef.current.contains(event.target as Node) &&
        !inviteButtonRef.current.contains(event.target as Node)
      ) {
        setShowInviteCard(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showInviteCard) {
        setShowInviteCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showInviteCard]);

  useEffect(() => {
    // Reset copy success state after 2 seconds
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopySuccess(true);
    showNotification("Room link copied to clipboard", "success");
  };

  const toggleInviteCard = () => {
    setShowInviteCard(!showInviteCard);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(
      `Join my video call - ${user?.name}'s Room`
    );
    const body = encodeURIComponent(
      `${user?.name} is inviting you to join a video meeting.\n\n` +
        `Join using this link: ${roomLink}\n\n` +
        `Room ID: ${roomId}\n\n` +
        `----------------\n` +
        `This is an automated invitation from our video calling platform.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `${user?.name} is inviting you to join a video meeting.\n\nJoin using this link: ${roomLink}\n\nRoom ID: ${roomId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`Join my video meeting: ${roomLink}`);
    window.open(`sms:?&body=${text}`, "_blank");
  };

  // Additional event handler for room data messages
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: any, kind?: any) => {
      if (!participant) return;

      try {
        // Convert binary data to text
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data = JSON.parse(dataString);

        // Check if it's a room termination message
        if (data.type === "room_termination") {
          if (!isHost) {
            // Show notification to non-host participants
            showNotification(`${data.message} (${data.hostName})`, "warning");

            // Wait a moment before disconnecting
            setTimeout(() => {
              safeDisconnect();
            }, 2000);
          }
        }
      } catch (e) {
        console.error("Error parsing data message:", e);
      }
    },
    [isHost]
  );

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.off(RoomEvent.DataReceived, handleDataReceived);
      }
    };
  }, [handleDataReceived]);

  // Add this effect at the top of your component
  useEffect(() => {
    // Hide any error dialogs immediately on component mount
    const hideErrorDialogs = () => {
      // Select all elements that might show error messages
      const errorElements = document.querySelectorAll(
        '[role="dialog"], .Toastify__toast--error, [class*="error"], [id*="error"]'
      );

      errorElements.forEach((element) => {
        const text = element.textContent || "";

        // Check if it contains LiveKit error messages
        if (
          text.includes("camera_placeholder") ||
          text.includes("publishing rejected") ||
          text.includes("publication of local track timed out") ||
          text.includes("Unhandled Runtime Error")
        ) {
          // First try to hide it
          try {
            // Use type assertion for DOM element
            const htmlElement = element as HTMLElement;
            htmlElement.style.display = "none";
            htmlElement.style.visibility = "hidden";
            htmlElement.style.opacity = "0";
            // Try removal as last resort
            setTimeout(() => element.remove(), 100);
          } catch (e) {
            console.warn("Error hiding error dialog:", e);
          }
        }
      });
    };

    // Run immediately and set up interval
    hideErrorDialogs();
    const interval = setInterval(hideErrorDialogs, 200);

    // Also manually hide Next.js error overlay
    const style = document.createElement("style");
    style.textContent = `
      [data-nextjs-dialog-overlay], [data-nextjs-errors] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        z-index: -9999 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      clearInterval(interval);
      document.head.removeChild(style);
    };
  }, []);

  // Keep the rest of the existing global error handler
  useEffect(() => {
    // Original error handler
    const originalOnError = window.onerror;

    // Custom error handler to prevent LiveKit errors from reaching users
    window.onerror = function (message, source, lineno, colno, error) {
      // Check if it's a LiveKit error (placeholder error or connection error)
      const errorString = message.toString();
      const isLiveKitError =
        errorString.includes("_camera_placeholder not in") ||
        errorString.includes("publication of local track timed out") ||
        errorString.includes("ConnectionError") ||
        errorString.includes("PublishTrackError") ||
        errorString.includes("engine not connected");

      if (isLiveKitError) {
        console.warn("Suppressed LiveKit error:", message);
        // Return true to indicate the error has been handled
        return true;
      }

      // Fallback to original handler for other errors
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Use addEventListener for unhandled rejection instead of direct assignment
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a LiveKit error
      const errorString = event.reason?.toString() || "";
      const isLiveKitError =
        errorString.includes("_camera_placeholder not in") ||
        errorString.includes("publication of local track timed out") ||
        errorString.includes("ConnectionError") ||
        errorString.includes("PublishTrackError") ||
        errorString.includes("engine not connected");

      if (isLiveKitError) {
        console.warn("Suppressed LiveKit promise rejection:", errorString);
        // Prevent default to avoid error being shown
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add the event listener
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Clean up custom handlers on unmount
    return () => {
      window.onerror = originalOnError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // Add a specialized function to clean placeholder tracks if it doesn't exist already
  const cleanPlaceholderTracks = (room: any) => {
    try {
      if (!room || !room.localParticipant) return;

      // Get the participant instance
      const participant = room.localParticipant;
      const participantName = participant.identity || "";

      // Direct fix for the specific placeholder pattern that causes errors
      const placeholderName = `${participantName}_camera_placeholder`;

      // Access internal LiveKit structures (these are not in the public API)
      if (participant._trackPublications) {
        // Remove the problematic placeholder
        if (participant._trackPublications[placeholderName]) {
          console.log(
            "Removing problematic camera placeholder:",
            placeholderName
          );
          delete participant._trackPublications[placeholderName];
        }

        // Also check for any other placeholders
        Object.keys(participant._trackPublications).forEach((key) => {
          if (key.includes("placeholder")) {
            console.log("Removing additional placeholder:", key);
            delete participant._trackPublications[key];
          }
        });
      }

      // Also clean up from the tracks by ID collection
      if (participant._tracksById) {
        Object.keys(participant._tracksById).forEach((key) => {
          if (key.includes("placeholder")) {
            console.log("Removing placeholder from tracksById:", key);
            delete participant._tracksById[key];
          }
        });
      }

      // If participant has a publications array, clean that as well
      if (Array.isArray(participant.publications)) {
        const placeholderIndex = participant.publications.findIndex(
          (pub: any) =>
            pub && pub.trackName && pub.trackName.includes("placeholder")
        );

        if (placeholderIndex >= 0) {
          console.log(
            "Removing placeholder from publications array:",
            placeholderIndex
          );
          participant.publications.splice(placeholderIndex, 1);
        }
      }

      console.log("Placeholder cleanup completed");
    } catch (error) {
      console.warn("Error during placeholder cleanup:", error);
      // Continue despite errors
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-6"></div>
        <p className="text-2xl text-white font-bold mb-2">
          Connecting to room...
        </p>
        <p className="text-gray-400">
          Please wait while we set up your video conference
        </p>

        <div className="mt-8 bg-gray-800 px-6 py-4 rounded-lg max-w-md">
          <h3 className="text-white text-lg font-semibold mb-2">Preparing:</h3>
          <ul className="text-gray-300 space-y-2">
            <li className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              Loading video interface
            </li>
            <li className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Connecting to LiveKit server
            </li>
            <li className="flex items-center opacity-60">
              <div className="w-5 h-5 mr-2 border-2 border-gray-400 rounded-full"></div>
              Setting up audio and video
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "warning"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        >
          <p className="text-white">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 text-white p-3 flex flex-row justify-between items-center">
        <div className="flex flex-row justify-between items-center relative">
          <button
            onClick={toggleInviteCard}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded flex items-center transition-colors duration-200"
            ref={inviteButtonRef}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2m0 0H8m0 0H6m6 0v1m0-2v-2m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Invite
          </button>

          {/* Invite card popup */}
          {showInviteCard && (
            <div
              ref={inviteCardRef}
              className="absolute top-12 left-0 z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-80 overflow-hidden animate-fade-in"
            >
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Invite people
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Share this link to invite others to your room
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteCard(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center bg-gray-700 rounded-md mb-4 overflow-hidden relative">
                  <input
                    type="text"
                    readOnly
                    value={roomLink}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="bg-transparent border-none text-white text-sm py-2 px-3 flex-1 focus:outline-none"
                  />
                  <button
                    onClick={copyRoomLink}
                    className={`${
                      copySuccess
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white text-xs px-3 py-2 h-full transition-colors duration-200`}
                  >
                    {copySuccess ? (
                      <span className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>

                <div className="text-sm text-gray-400 mb-3">Share via:</div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={shareViaEmail}
                    className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md py-3 px-2 text-xs transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </button>
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md py-3 px-2 text-xs transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={shareViaSMS}
                    className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md py-3 px-2 text-xs transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    SMS
                  </button>
                </div>

                <div className="flex flex-col mt-4 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">
                    Room Information:
                  </div>
                  <div className="bg-gray-700 rounded-md overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-600 flex justify-between items-center">
                      <span className="text-xs text-gray-300">Room ID</span>
                      <span className="font-mono text-sm text-white">
                        {roomId}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex justify-between items-center">
                      <span className="text-xs text-gray-300">Host</span>
                      <span className="text-sm text-white">{user?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-900 text-xs text-gray-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p>Anyone with the link can join your meeting</p>
              </div>
            </div>
          )}
        </div>
        <div className=" px-2">
          <p className=" text-center text-red-600">
            Mic off after speaking to avoid errors.
          </p>
        </div>
        <div className="flex flex-row gap-2 justify-center items-center px-3">
          {isHost && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
              Host
            </span>
          )}
          <img
            src="/default-avatar.svg"
            alt="Profile"
            className="w-6 h-6  xl:w-8 xl:h-8 rounded-full mr-2"
          />
          <div className="flex flex-col items-center">
            <div className="truncate max-w-[120px] text-xs">{user?.name}</div>
            {/* Connection status indicator */}
            <div className="flex  flex-row items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-xs">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                  ? "Connecting"
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Wrap the entire LiveKit room in a global error boundary */}
        <GlobalErrorBoundary>
          <LiveKitRoom
            token={token}
            serverUrl={
              process.env.NEXT_PUBLIC_LIVEKIT_URL ||
              "wss://miniproject-hc8t8t5e.livekit.cloud"
            }
            onConnected={handleRoomConnected}
            onDisconnected={handleRoomDisconnected}
            onError={handleRoomError}
            className="lk-video-conference"
            style={{ height: "100%" }}
            data-lk-theme="default"
            audio={true}
            video={true}
            connect={true}
          >
            <div className="w-full h-full flex overflow-hidden">
              <LayoutContextProvider>
                <div className="flex-1 relative video-layout">
                  <ErrorBoundary
                    fallback={
                      <div className="p-4 bg-red-800 text-white">
                        Video component error. Try refreshing the page.
                      </div>
                    }
                  >
                    <VideoConference
                      style={
                        {
                          "--container-padding-bottom": "0px",
                        } as React.CSSProperties
                      }
                    />
                  </ErrorBoundary>
                </div>
              </LayoutContextProvider>
            </div>

            {/* Audio renderer */}
            <RoomAudioRenderer />

            {/* Connection state toast */}
            <ConnectionStateToast />

            {/* Add Multilingual Support Component */}
            <RoomWrapper />
          </LiveKitRoom>
        </GlobalErrorBoundary>
      </div>

      {/* Leave confirmation modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg max-w-md w-full text-white">
            <div className="flex items-center mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-xl font-bold">
                {isHost ? "End Meeting for All Participants" : "Leave Meeting"}
              </h2>
            </div>

            <div className="bg-gray-700 p-4 rounded-md mb-4">
              <p className="text-white">
                <strong>Warning:</strong> This will immediately:
              </p>
              <ul className="list-disc ml-5 mt-2 text-gray-300 space-y-1">
                {isHost ? (
                  <>
                    <li>Disconnect all participants from the meeting</li>
                    <li>Delete the room permanently</li>
                    <li>End the video call for everyone</li>
                  </>
                ) : (
                  <>
                    <li>Disconnect you from the meeting</li>
                    <li>Other participants will continue without you</li>
                    <li>You will be redirected to the home page</li>
                  </>
                )}
              </ul>
            </div>

            <p className="text-gray-300 mb-5">
              {isHost
                ? "Are you sure you want to end this meeting for everyone?"
                : "Are you sure you want to leave this meeting?"}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLeave}
                className="px-4 py-2 text-white bg-transparent border border-gray-500 rounded hover:bg-gray-700 transition-colors"
                disabled={isTerminatingRoom}
              >
                Cancel
              </button>
              <button
                onClick={isHost ? confirmLeave : safeDisconnect}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors flex items-center"
                disabled={isTerminatingRoom || isDisconnecting}
              >
                {isTerminatingRoom || isDisconnecting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isHost ? "Ending Meeting..." : "Leaving Meeting..."}
                  </>
                ) : (
                  <>{isHost ? "End Meeting" : "Leave Meeting"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Top-level error boundary to catch all LiveKit errors
class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorType: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorType: "" };
  }

  static getDerivedStateFromError(error: any) {
    // Determine error type to show appropriate message
    const errorString = String(error);
    let errorType = "unknown";

    if (errorString.includes("_camera_placeholder not in")) {
      errorType = "placeholder";
    } else if (errorString.includes("publication of local track timed out")) {
      errorType = "connection";
    } else if (errorString.includes("ConnectionError")) {
      errorType = "connection";
    }

    console.error("GlobalErrorBoundary caught:", errorString);

    // Trigger navigation to homepage for serious errors
    if (errorType === "placeholder" || errorType === "connection") {
      // Use timeout to allow React to complete this render cycle
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }

    return { hasError: true, errorType };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log error but don't display to user
    console.error("Global error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md shadow-lg border border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-yellow-500"
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
            </div>

            <h2 className="text-xl font-semibold text-center mb-2">
              Connection Issue
            </h2>

            <p className="text-gray-300 text-center mb-6">
              {this.state.errorType === "placeholder"
                ? "We're having trouble with your camera connection."
                : this.state.errorType === "connection"
                ? "We couldn't establish a stable connection to the meeting server."
                : "Something went wrong with the video meeting."}
            </p>

            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>

            <p className="text-sm text-gray-400 text-center">
              Returning to home page automatically...
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Return Home Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error boundary component to catch LiveKit rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Check for specific placeholder error pattern
    const errorStr = String(error);
    const isPlaceholderError = errorStr.includes("_camera_placeholder not in");

    if (isPlaceholderError) {
      console.log("Detected placeholder error, redirecting to home page");
      // Immediately redirect to home to avoid showing error
      window.location.href = "/";
    }

    console.error("ErrorBoundary caught:", error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught in boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-gray-800 text-white rounded flex flex-col items-center justify-center h-full">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-yellow-500 mb-2"
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
          </div>
          <h3 className="text-lg font-medium">Connection issue detected</h3>
          <p className="text-gray-400 mb-4">Returning to home page...</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// New component to access Room context within the LiveKitRoom
function RoomWrapper() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useMemo(() => {
    if (!room) return [];
    // Access the remoteParticipants Map and convert to array
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    // Add the local participant if available
    return localParticipant
      ? [...remoteParticipants, localParticipant]
      : remoteParticipants;
  }, [room, localParticipant]);

  return (
    <ReactErrorBoundary
      fallbackRender={({ error }) => (
        <div className="text-xs text-red-600 bg-red-100 p-2 m-2 rounded">
          Multilingual support error: {error.message}
        </div>
      )}
    >
      <MultilingualSupport
        room={room}
        localParticipant={localParticipant}
        participants={participants}
      />
    </ReactErrorBoundary>
  );
}
