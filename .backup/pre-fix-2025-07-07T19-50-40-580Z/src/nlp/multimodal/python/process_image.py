#!/usr/bin/env python
"""
Image Processing Script

This script provides image processing capabilities using open-source libraries:
- OpenCV for computer vision tasks
- TensorFlow Lite for lightweight machine learning
- PIL/Pillow for basic image processing

It serves as a bridge between the Node.js application and Python image processing libraries.
"""

import sys
import json
import os
import argparse
import base64
from pathlib import Path
import traceback

# Check if required packages are installed, if not install them
try:
    import cv2
    import numpy as np
    from PIL import Image
except ImportError:
    import subprocess
    import sys
    
    # Install required packages
    subprocess.check_call([sys.executable, "-m", "pip", "install", 
                          "opencv-python", "numpy", "pillow"])
    
    # Import after installation
    import cv2
    import numpy as np
    from PIL import Image

# Try to import TensorFlow Lite (optional)
try:
    import tensorflow as tf
    import tflite_runtime.interpreter as tflite
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow Lite not available. Some features will be limited.", file=sys.stderr)

class ImageProcessor:
    """Image processing using open-source libraries"""
    
    def __init__(self, model_path=None):
        """Initialize image processor"""
        self.model_path = model_path or os.path.join(os.getcwd(), 'models')
        
        # Initialize face detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Initialize object detection if TensorFlow is available
        self.object_detection_model = None
        if TENSORFLOW_AVAILABLE:
            self._initialize_object_detection()
    
    def _initialize_object_detection(self):
        """Initialize object detection model"""
        try:
            # Check if model exists
            model_path = os.path.join(self.model_path, 'object_detection_model.tflite')
            if not os.path.exists(model_path):
                print(f"Object detection model not found at {model_path}", file=sys.stderr)
                return
            
            # Load model
            self.object_detection_model = tflite.Interpreter(model_path=model_path)
            self.object_detection_model.allocate_tensors()
            
            # Get input and output details
            self.input_details = self.object_detection_model.get_input_details()
            self.output_details = self.object_detection_model.get_output_details()
            
            print("Object detection model loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"Error initializing object detection: {str(e)}", file=sys.stderr)
            self.object_detection_model = None
    
    def process_image(self, image_path, options=None):
        """
        Process an image with various computer vision tasks
        
        Args:
            image_path: Path to the image file
            options: Processing options
            
        Returns:
            Dictionary with processing results
        """
        options = options or {}
        
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "success": False,
                    "error": f"Failed to read image from {image_path}"
                }
            
            # Convert to RGB (OpenCV uses BGR)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Get image info
            height, width, channels = image.shape
            
            result = {
                "success": True,
                "imageInfo": {
                    "width": width,
                    "height": height,
                    "channels": channels,
                    "format": os.path.splitext(image_path)[1][1:].lower()
                },
                "features": {}
            }
            
            # Detect faces if requested
            if options.get('detectFaces', False):
                faces = self._detect_faces(image)
                result["features"]["faces"] = faces
            
            # Detect objects if requested and available
            if options.get('detectObjects', False) and self.object_detection_model:
                objects = self._detect_objects(image_rgb)
                result["features"]["objects"] = objects
            
            # Detect text if requested
            if options.get('detectText', False):
                text = self._detect_text(image)
                result["features"]["text"] = text
            
            # Extract dominant colors if requested
            if options.get('extractColors', False):
                colors = self._extract_colors(image_rgb)
                result["features"]["colors"] = colors
            
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _detect_faces(self, image):
        """
        Detect faces in an image
        
        Args:
            image: OpenCV image
            
        Returns:
            List of detected faces
        """
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # Format results
        face_list = []
        for (x, y, w, h) in faces:
            face_list.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            })
        
        return {
            "count": len(face_list),
            "faces": face_list
        }
    
    def _detect_objects(self, image_rgb):
        """
        Detect objects in an image using TensorFlow Lite
        
        Args:
            image_rgb: RGB image
            
        Returns:
            List of detected objects
        """
        if not self.object_detection_model:
            return {
                "count": 0,
                "objects": [],
                "error": "Object detection model not available"
            }
        
        try:
            # Resize image to model input size
            input_shape = self.input_details[0]['shape'][1:3]
            input_image = cv2.resize(image_rgb, input_shape)
            
            # Normalize image
            input_image = input_image.astype(np.float32) / 255.0
            input_image = np.expand_dims(input_image, axis=0)
            
            # Run inference
            self.object_detection_model.set_tensor(self.input_details[0]['index'], input_image)
            self.object_detection_model.invoke()
            
            # Get results
            boxes = self.object_detection_model.get_tensor(self.output_details[0]['index'])[0]
            classes = self.object_detection_model.get_tensor(self.output_details[1]['index'])[0]
            scores = self.object_detection_model.get_tensor(self.output_details[2]['index'])[0]
            
            # Format results
            object_list = []
            for i in range(len(scores)):
                if scores[i] >= 0.5:  # Confidence threshold
                    object_list.append({
                        "class": int(classes[i]),
                        "className": self._get_class_name(int(classes[i])),
                        "confidence": float(scores[i]),
                        "box": {
                            "x": float(boxes[i][1]),
                            "y": float(boxes[i][0]),
                            "width": float(boxes[i][3] - boxes[i][1]),
                            "height": float(boxes[i][2] - boxes[i][0])
                        }
                    })
            
            return {
                "count": len(object_list),
                "objects": object_list
            }
        except Exception as e:
            return {
                "count": 0,
                "objects": [],
                "error": str(e)
            }
    
    def _get_class_name(self, class_id):
        """Get class name from class ID"""
        # This is a placeholder - in a real implementation, this would
        # load class names from a file
        class_names = [
            "background", "person", "bicycle", "car", "motorcycle",
            "airplane", "bus", "train", "truck", "boat", "traffic light",
            "fire hydrant", "stop sign", "parking meter", "bench", "bird",
            "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
            "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie",
            "suitcase", "frisbee", "skis", "snowboard", "sports ball",
            "kite", "baseball bat", "baseball glove", "skateboard",
            "surfboard", "tennis racket", "bottle", "wine glass", "cup",
            "fork", "knife", "spoon", "bowl", "banana", "apple",
            "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
            "donut", "cake", "chair", "couch", "potted plant", "bed",
            "dining table", "toilet", "tv", "laptop", "mouse", "remote",
            "keyboard", "cell phone", "microwave", "oven", "toaster",
            "sink", "refrigerator", "book", "clock", "vase", "scissors",
            "teddy bear", "hair drier", "toothbrush"
        ]
        
        if 0 <= class_id < len(class_names):
            return class_names[class_id]
        return f"class_{class_id}"
    
    def _detect_text(self, image):
        """
        Detect text in an image
        
        Args:
            image: OpenCV image
            
        Returns:
            Detected text
        """
        # This is a placeholder - in a real implementation, this would
        # use OCR libraries like Tesseract
        return {
            "detected": False,
            "text": "",
            "error": "Text detection not implemented"
        }
    
    def _extract_colors(self, image_rgb):
        """
        Extract dominant colors from an image
        
        Args:
            image_rgb: RGB image
            
        Returns:
            List of dominant colors
        """
        # Resize image for faster processing
        resized = cv2.resize(image_rgb, (100, 100))
        
        # Reshape the image to be a list of pixels
        pixels = resized.reshape((-1, 3))
        
        # Convert to float
        pixels = np.float32(pixels)
        
        # Define criteria
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        
        # Number of colors to extract
        k = 5
        
        # Apply k-means clustering
        _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Convert back to uint8
        centers = np.uint8(centers)
        
        # Count occurrences of each label
        counts = np.bincount(labels.flatten())
        
        # Sort colors by frequency
        sorted_indices = np.argsort(counts)[::-1]
        sorted_centers = centers[sorted_indices]
        sorted_counts = counts[sorted_indices]
        
        # Format results
        colors = []
        total_pixels = len(labels)
        for i in range(len(sorted_centers)):
            color = sorted_centers[i].tolist()
            colors.append({
                "rgb": color,
                "hex": f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}",
                "percentage": float(sorted_counts[i] / total_pixels)
            })
        
        return colors

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Process an image with computer vision tasks')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--options', help='JSON string of processing options')
    return parser.parse_args()

def main():
    """Main entry point"""
    try:
        args = parse_arguments()
        
        # Parse options
        options = {}
        if args.options:
            options = json.loads(args.options)
        
        # Process image
        processor = ImageProcessor()
        result = processor.process_image(args.image_path, options)
        
        # Print result as JSON
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == '__main__':
    main()
