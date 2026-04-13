import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Progress, Text, Button, HStack, Icon, Spinner } from "@chakra-ui/react";
import { FiDownload, FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

const UpdateBar = () => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [newVersion, setNewVersion] = useState("");
  const [visible, setVisible] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const hideTimeoutRef = useRef(null);

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Schedule hiding the bar
  const scheduleHide = useCallback((delay) => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setUpdateStatus(null);
    }, delay);
  }, [clearHideTimeout]);

  useEffect(() => {
    // Check if running in Electron with electronAPI available
    if (!window.electronAPI || !window.electronAPI.onUpdateStatus) {
      console.log("UpdateBar: Not running in Electron or API not available");
      return;
    }

    console.log("UpdateBar: Setting up update listener");

    const handleUpdateStatus = (data) => {
      console.log("UpdateBar: Received status:", data);
      clearHideTimeout();
      setUpdateStatus(data.status);

      switch (data.status) {
        case "checking":
          setVisible(true);
          break;
        case "available":
          setVisible(true);
          setNewVersion(data.version || "");
          break;
        case "downloading":
          setVisible(true);
          setDownloadPercent(data.percent || 0);
          if (data.bytesPerSecond) {
            setDownloadSpeed(Math.round(data.bytesPerSecond / 1024 / 1024 * 10) / 10); // MB/s
          }
          break;
        case "downloaded":
          setVisible(true);
          setNewVersion(data.version || "");
          setDownloadPercent(100);
          setDownloadSpeed(0);
          break;
        case "not-available":
          setVisible(true);
          scheduleHide(2000);
          break;
        case "error":
          setVisible(true);
          setIsRestarting(false);
          scheduleHide(5000);
          break;
        default:
          break;
      }
    };

    window.electronAPI.onUpdateStatus(handleUpdateStatus);

    // Cleanup listener on unmount
    return () => {
      clearHideTimeout();
      if (window.electronAPI.removeUpdateListener) {
        window.electronAPI.removeUpdateListener();
      }
    };
  }, [clearHideTimeout, scheduleHide]);

  const handleRestart = useCallback(() => {
    if (isRestarting) return;
    
    console.log("UpdateBar: User clicked restart");
    setIsRestarting(true);
    
    if (window.electronAPI && window.electronAPI.restartApp) {
      // Small delay to show the "Restarting..." state
      setTimeout(() => {
        window.electronAPI.restartApp();
      }, 300);
    }
  }, [isRestarting]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusContent = () => {
    switch (updateStatus) {
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
              Update v{newVersion} found. Starting download...
            </Text>
          </HStack>
        );

      case "downloading":
        return (
          <HStack spacing={3} flex={1} w="100%">
            <Icon as={FiDownload} flexShrink={0} />
            <Text fontSize="sm" minW="120px" flexShrink={0}>
              Downloading... {downloadPercent}%
            </Text>
            <Progress
              value={downloadPercent}
              size="sm"
              colorScheme="blue"
              flex={1}
              borderRadius="full"
              bg="whiteAlpha.300"
              hasStripe
              isAnimated
            />
            {downloadSpeed > 0 && (
              <Text fontSize="xs" color="whiteAlpha.800" flexShrink={0}>
                {downloadSpeed} MB/s
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
                Update v{newVersion} ready to install
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={isRestarting ? <Spinner size="xs" /> : <FiRefreshCw />}
                onClick={handleRestart}
                isDisabled={isRestarting}
              >
                {isRestarting ? "Restarting..." : "Restart Now"}
              </Button>
              {!isRestarting && (
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
              <Text fontSize="sm">Update check failed</Text>
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
        {getStatusContent()}
      </HStack>
    </Box>
  );
};

export default UpdateBar;
