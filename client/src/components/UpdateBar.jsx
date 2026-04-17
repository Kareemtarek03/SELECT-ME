import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, Button, HStack, Icon, Spinner } from "@chakra-ui/react";
import { FiDownload, FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

// ---------------------------------------------------------------------------
// UpdateBar
//
// Shows auto-update progress in a thin top banner. When the user clicks
// "Restart Now" the main process sends status="installing" and we replace the
// entire viewport with a polished full-screen splash so the user never sees a
// white flash or disappearing window while NSIS takes over.
//
// Implementation notes (fixes for the prod white-screen):
//  - Single merged state object -> one React commit per IPC message.
//  - No <Progress isAnimated hasStripe> - that Chakra combo uses a GPU keyframe
//    animation that was causing stalls in packaged builds during the flood of
//    download-progress events. We render a lightweight CSS-transition bar.
//  - onUpdateStatus returns an unsubscribe function (new preload contract) so
//    the listener can never be registered twice or leak across remounts.
//  - Component is wrapped in React.memo to avoid re-renders triggered by
//    parent context churn.
// ---------------------------------------------------------------------------

const INITIAL_STATE = {
  status: null,
  visible: false,
  percent: 0,
  version: "",
  speedMBs: 0,
  isRestarting: false,
  errorMessage: "",
};

function UpdateBarImpl() {
  const [state, setState] = useState(INITIAL_STATE);
  const hideTimeoutRef = useRef(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay) => {
      clearHideTimeout();
      hideTimeoutRef.current = setTimeout(() => {
        setState((s) => ({ ...INITIAL_STATE, isRestarting: s.isRestarting }));
      }, delay);
    },
    [clearHideTimeout]
  );

  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.onUpdateStatus) {
      return;
    }

    const handleUpdateStatus = (data) => {
      if (!data || !data.status) return;
      clearHideTimeout();

      // Build the *entire* next state in one object and commit once. This
      // matters during the "downloading" flood - previously we called
      // setState 3 times per event which tripled React's reconciliation work.
      setState((prev) => {
        const next = { ...prev, status: data.status, visible: true };

        switch (data.status) {
          case "checking":
            break;
          case "available":
            next.version = data.version || "";
            next.percent = 0;
            break;
          case "downloading": {
            const p = typeof data.percent === "number" ? data.percent : prev.percent;
            // Ignore no-op percent changes to avoid needless commits.
            if (p === prev.percent && prev.status === "downloading") {
              const bps = data.bytesPerSecond || 0;
              const speedMBs = Math.round((bps / 1024 / 1024) * 10) / 10;
              if (speedMBs === prev.speedMBs) return prev;
              return { ...prev, speedMBs };
            }
            next.percent = p;
            next.speedMBs = data.bytesPerSecond
              ? Math.round((data.bytesPerSecond / 1024 / 1024) * 10) / 10
              : prev.speedMBs;
            break;
          }
          case "downloaded":
            next.version = data.version || prev.version;
            next.percent = 100;
            next.speedMBs = 0;
            break;
          case "not-available":
            // handled by scheduleHide below
            break;
          case "installing":
            next.version = data.version || prev.version;
            next.isRestarting = true;
            break;
          case "error":
            next.errorMessage = data.message || "Update check failed";
            next.isRestarting = false;
            break;
          default:
            break;
        }
        return next;
      });

      if (data.status === "not-available") scheduleHide(2000);
      else if (data.status === "error") scheduleHide(6000);
    };

    // New contract: onUpdateStatus returns an unsubscribe function.
    // Fall back to legacy removeUpdateListener if running an older preload.
    const unsubscribe = window.electronAPI.onUpdateStatus(handleUpdateStatus);

    return () => {
      clearHideTimeout();
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else if (window.electronAPI.removeUpdateListener) {
        window.electronAPI.removeUpdateListener();
      }
    };
  }, [clearHideTimeout, scheduleHide]);

  const handleRestart = useCallback(() => {
    setState((prev) => {
      if (prev.isRestarting) return prev;
      return { ...prev, isRestarting: true };
    });
    // Defer the IPC by one frame so the "Restarting..." label paints first.
    requestAnimationFrame(() => {
      if (window.electronAPI && window.electronAPI.restartApp) {
        window.electronAPI.restartApp();
      }
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  if (!state.visible) return null;

  // ---------------------------------------------------------------------
  // Full-screen "Installing update..." splash.
  // Rendered as an overlay that covers the whole viewport so the user sees
  // a clear, professional message right up until the NSIS installer takes
  // over. This replaces the old behaviour of hiding the window and showing
  // nothing for 500ms+ (which looked like a crash).
  // ---------------------------------------------------------------------
  if (state.status === "installing") {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)"
        color="white"
        zIndex={99999}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box textAlign="center" maxW="480px" px={6}>
          <Spinner size="xl" thickness="4px" speed="0.8s" color="blue.300" mb={6} />
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Installing update{state.version ? ` v${state.version}` : ""}
          </Text>
          <Text fontSize="md" color="whiteAlpha.800" mb={4}>
            The installer is starting. The app will restart automatically when
            installation is complete.
          </Text>
          <Text fontSize="sm" color="whiteAlpha.600">
            Please don't close this window.
          </Text>
        </Box>
      </Box>
    );
  }

  const renderBar = () => {
    switch (state.status) {
      case "checking":
        return (
          <HStack spacing={3}>
            <Spinner size="sm" />
            <Text fontSize="sm">Checking for updates...</Text>
          </HStack>
        );

      case "available":
        return (
          <HStack spacing={3}>
            <Spinner size="sm" />
            <Text fontSize="sm">
              Update v{state.version} found. Starting download...
            </Text>
          </HStack>
        );

      case "downloading":
        return (
          <HStack spacing={3} flex={1} w="100%">
            <Icon as={FiDownload} flexShrink={0} />
            <Text fontSize="sm" minW="130px" flexShrink={0}>
              Downloading... {state.percent}%
            </Text>
            {/* Lightweight CSS-transition progress bar instead of Chakra's
                striped/animated variant, which was causing GPU stalls. */}
            <Box
              flex={1}
              h="6px"
              borderRadius="full"
              bg="whiteAlpha.300"
              overflow="hidden"
              position="relative"
            >
              <Box
                h="100%"
                bg="blue.300"
                borderRadius="full"
                style={{
                  width: `${Math.max(0, Math.min(100, state.percent))}%`,
                  transition: "width 400ms ease-out",
                  willChange: "width",
                }}
              />
            </Box>
            {state.speedMBs > 0 && (
              <Text fontSize="xs" color="whiteAlpha.800" flexShrink={0}>
                {state.speedMBs} MB/s
              </Text>
            )}
          </HStack>
        );

      case "downloaded":
        return (
          <HStack spacing={3} justify="space-between" flex={1} w="100%">
            <HStack spacing={2}>
              <Icon as={FiCheck} color="green.300" />
              <Text fontSize="sm">
                Update v{state.version} ready to install
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={state.isRestarting ? <Spinner size="xs" /> : <FiRefreshCw />}
                onClick={handleRestart}
                isDisabled={state.isRestarting}
              >
                {state.isRestarting ? "Restarting..." : "Restart Now"}
              </Button>
              {!state.isRestarting && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={handleDismiss}
                >
                  Later
                </Button>
              )}
            </HStack>
          </HStack>
        );

      case "not-available":
        return (
          <HStack spacing={3}>
            <Icon as={FiCheck} color="green.300" />
            <Text fontSize="sm">App is up to date</Text>
          </HStack>
        );

      case "error":
        return (
          <HStack spacing={3} justify="space-between" flex={1}>
            <HStack spacing={2}>
              <Icon as={FiX} color="red.300" />
              <Text fontSize="sm">
                {state.errorMessage || "Update check failed"}
              </Text>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          </HStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg="linear-gradient(90deg, #1a365d 0%, #2c5282 100%)"
      color="white"
      px={4}
      py={2}
      zIndex={9999}
      boxShadow="0 2px 10px rgba(0,0,0,0.3)"
    >
      <HStack justify="center" align="center" maxW="900px" mx="auto" w="100%">
        {renderBar()}
      </HStack>
    </Box>
  );
}

const UpdateBar = React.memo(UpdateBarImpl);
export default UpdateBar;
