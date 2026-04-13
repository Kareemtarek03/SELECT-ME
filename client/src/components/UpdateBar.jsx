import React, { useState, useEffect } from "react";
import { Box, Progress, Text, Button, HStack, Icon } from "@chakra-ui/react";
import { FiDownload, FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

const UpdateBar = () => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [newVersion, setNewVersion] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if running in Electron with electronAPI available
    if (window.electronAPI && window.electronAPI.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data) => {
        console.log("Update status:", data);
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
            break;
          case "downloaded":
            setVisible(true);
            setNewVersion(data.version || "");
            setDownloadPercent(100);
            break;
          case "not-available":
            // Hide after 2 seconds if no update
            setTimeout(() => setVisible(false), 2000);
            break;
          case "error":
            // Hide after 3 seconds on error
            setTimeout(() => setVisible(false), 3000);
            break;
          default:
            break;
        }
      });
    }
  }, []);

  const handleRestart = () => {
    if (window.electronAPI && window.electronAPI.restartApp) {
      window.electronAPI.restartApp();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  const getStatusContent = () => {
    switch (updateStatus) {
      case "checking":
        return (
          <HStack spacing={3}>
            <Icon as={FiDownload} />
            <Text fontSize="sm">Checking for updates...</Text>
          </HStack>
        );

      case "available":
        return (
          <HStack spacing={3}>
            <Icon as={FiDownload} />
            <Text fontSize="sm">
              Update v{newVersion} available. Downloading...
            </Text>
          </HStack>
        );

      case "downloading":
        return (
          <HStack spacing={3} flex={1}>
            <Icon as={FiDownload} />
            <Text fontSize="sm" minW="180px">
              Downloading update... {downloadPercent}%
            </Text>
            <Progress
              value={downloadPercent}
              size="sm"
              colorScheme="blue"
              flex={1}
              borderRadius="full"
              bg="whiteAlpha.300"
            />
          </HStack>
        );

      case "downloaded":
        return (
          <HStack spacing={3} justify="space-between" flex={1}>
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
                leftIcon={<FiRefreshCw />}
                onClick={handleRestart}
              >
                Restart Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={handleDismiss}
              >
                Later
              </Button>
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
          <HStack spacing={3}>
            <Icon as={FiX} color="red.300" />
            <Text fontSize="sm">Update check failed</Text>
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
      <HStack justify="center" align="center" maxW="800px" mx="auto">
        {getStatusContent()}
      </HStack>
    </Box>
  );
};

export default UpdateBar;
