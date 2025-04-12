import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from model_utils import detect_hand, preprocess_image, predict_gesture
from flask_cors import CORS  # You'll need to install this

app = Flask(__name__)
CORS(app)  # Enable CORS to prevent issues with cross-origin requests

# Configure TensorFlow threading BEFORE initializing anything
tf.config.threading.set_intra_op_parallelism_threads(4)
tf.config.threading.set_inter_op_parallelism_threads(2)

# Load the model during startup, not during request
print("Loading model...")
model = tf.keras.models.load_model("gesture_model.h5")

# Configure TensorFlow to be more efficient
physical_devices = tf.config.list_physical_devices('GPU')
if physical_devices:
    try:
        # Use GPU if available
        for device in physical_devices:
            tf.config.experimental.set_memory_growth(device, True)
        print("GPU acceleration enabled")
    except:
        print("GPU optimization failed")
else:
    print("CPU optimization enabled")

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["image"]
    img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    
    # Step 1: Detect Hand
    if not detect_hand(img):
        return jsonify({"gesture": "No hand detected"})

    # Step 2: Preprocess and Predict Gesture
    processed_img = preprocess_image(img)
    gesture = predict_gesture(model, processed_img)

    return jsonify({"gesture": gesture})

if __name__ == "__main__":
    app.run(debug=False, threaded=True)  # Turn off debug mode for production
