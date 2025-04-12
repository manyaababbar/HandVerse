document.addEventListener("DOMContentLoaded", function () {
    let video = document.getElementById("video");
    let canvas = document.getElementById("canvas");
    let captureButton = document.getElementById("capture");
    let resultText = document.getElementById("result");
    let isDetecting = false;
    let isProcessing = false; // Flag to prevent overlapping requests
    let captureTimeout; // Using timeout instead of interval
    let activeTabId = null; // Store the active tab ID
    const CAPTURE_INTERVAL = 2000; // Capture every 2 seconds

    // Store the active tab ID when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs.length > 0) {
            activeTabId = tabs[0].id;
            console.log("Active tab ID stored:", activeTabId);
        }
    });

    // Open camera
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 320 }, // Reduce camera resolution
            height: { ideal: 320 },
            frameRate: { ideal: 15 } // Lower framerate
        } 
    })
    .then(stream => video.srcObject = stream)
    .catch(error => console.error("Error accessing camera:", error));

    // Function to capture frame and detect gesture
    function captureAndDetect() {
        if (isProcessing || !isDetecting) return;
        
        isProcessing = true; // Set processing flag
        
        let context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            let formData = new FormData();
            formData.append("image", blob, "frame.jpg");

            fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                resultText.textContent = "Gesture: " + data.gesture;
                
                // Only send valid gestures to the content script
                if (["Play", "Pause", "10s later"].includes(data.gesture)) {
                    // Use stored tab ID to ensure we're sending to the right tab
                    if (activeTabId) {
                        console.log("Sending gesture to tab:", activeTabId, "Gesture:", data.gesture);
                        chrome.tabs.sendMessage(
                            activeTabId, 
                            {gesture: data.gesture}, 
                            function(response) {
                                if (chrome.runtime.lastError) {
                                    console.error("Error sending message:", chrome.runtime.lastError);
                                } else {
                                    console.log("Response from content script:", response || "No response");
                                }
                            }
                        );
                    } else {
                        console.error("No active tab ID stored");
                    }
                }
            })
            .catch(error => console.error("Error:", error))
            .finally(() => {
                // Clear processing flag
                isProcessing = false;
                
                // Schedule next capture only if detection is still active
                if (isDetecting) {
                    captureTimeout = setTimeout(captureAndDetect, CAPTURE_INTERVAL);
                }
            });
        }, "image/jpeg", 0.7); // Lower JPEG quality for faster processing
    }

    // Toggle continuous detection on/off
    captureButton.addEventListener("click", function () {
        if (!isDetecting) {
            // Start continuous detection
            isDetecting = true;
            captureButton.textContent = "Stop Detection";
            captureButton.style.backgroundColor = "#dc3545"; // Red button for stop
            
            // Re-check active tab ID before starting
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs && tabs.length > 0) {
                    activeTabId = tabs[0].id;
                    console.log("Active tab ID updated:", activeTabId);
                    
                    // Start detection cycle
                    captureAndDetect();
                }
            });
        } else {
            // Stop continuous detection
            isDetecting = false;
            captureButton.textContent = "Start Detection";
            captureButton.style.backgroundColor = "#007bff"; // Blue button for start
            
            // Clear the scheduled timeout if exists
            if (captureTimeout) {
                clearTimeout(captureTimeout);
            }
        }
    });
    
    // Clean up when popup closes
    window.addEventListener('beforeunload', function() {
        isDetecting = false;
        if (captureTimeout) {
            clearTimeout(captureTimeout);
        }
        
        // Stop the camera stream
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    });
});