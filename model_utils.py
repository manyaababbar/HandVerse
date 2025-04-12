import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf

# Define gesture classes based on model training
GESTURE_CLASSES = ["10s later", "Pause", "Play"]

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.7)

def detect_hand(img):
    """Check if a hand is detected in the image using MediaPipe."""
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result = hands.process(img_rgb)

    return result.multi_hand_landmarks is not None  # True if hand is detected

def preprocess_image(img):
    """Resize and normalize image for model input."""
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert to RGB
    img = cv2.resize(img, (256, 256))  # Resize to match model input
    img = img / 255.0  # Normalize
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    return img

def predict_gesture(model, img):
    """Predict the gesture using the trained model."""
    predictions = model.predict(img)
    class_index = np.argmax(predictions)
    return GESTURE_CLASSES[class_index]
