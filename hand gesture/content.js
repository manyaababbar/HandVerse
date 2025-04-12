// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.gesture) {
      console.log("Gesture received in content script:", message.gesture);
      executeGestureAction(message.gesture);
      sendResponse({success: true, message: "Gesture executed: " + message.gesture});
    }
    return true; // Required to use sendResponse asynchronously
  });
  
  // Map gestures to keyboard actions
  function executeGestureAction(gesture) {
    console.log("Executing gesture:", gesture);
    
    // Find video element - check for YouTube, Netflix, and generic video players
    let videoElement = document.querySelector('video');
    
    // Special case for YouTube
    const isYouTube = window.location.hostname.includes('youtube.com');
    
    if (!videoElement) {
      console.log("No video element found on the page");
      return;
    }
    
    try {
      switch (gesture) {
        case "Play":
          console.log("Attempting to play video");
          if (videoElement.paused) {
            videoElement.play()
              .then(() => console.log("Video played successfully"))
              .catch(err => {
                console.error("Error playing video:", err);
                // Fallback to key press
                simulateKeyPress("k");
              });
          }
          break;
        
        case "Pause":
          console.log("Attempting to pause video");
          if (!videoElement.paused) {
            videoElement.pause();
            console.log("Video paused");
          }
          // Always simulate key press for more reliable behavior
          simulateKeyPress("k");
          break;
        
        case "10s later":
          console.log("Attempting to skip forward");
          videoElement.currentTime += 20;
          // For YouTube and other sites that use L for skip forward
          simulateKeyPress("l");
          simulateKeyPress("l");
          break;
          
        default:
          console.log("Unknown gesture:", gesture);
      }
    } catch (error) {
      console.error("Error executing gesture:", error);
    }
  }
  
  // Improved key press simulation
  function simulateKeyPress(key) {
    console.log("Simulating key press:", key);
    
    try {
      // Try both document and video element as targets
      const targets = [document, document.querySelector('video')];
      
      targets.forEach(target => {
        if (target) {
          const keyEvent = new KeyboardEvent('keydown', {
            key: key,
            code: 'Key' + key.toUpperCase(),
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          target.dispatchEvent(keyEvent);
        }
      });
      
      // For YouTube-specific controls
      if (window.location.hostname.includes('youtube.com')) {
        document.querySelector('.html5-video-container')?.focus();
      }
    } catch (error) {
      console.error("Error simulating key press:", error);
    }
  }