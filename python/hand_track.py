import cv2
import mediapipe as mp
import math
import asyncio
import threading
import websockets
import json

# ============================================================
# WEBSOCKET
# ============================================================

clients = set()
loop = asyncio.new_event_loop()


async def websocket_handler(websocket):
    clients.add(websocket)
    print("Browser connected!")

    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)
        print("Browser disconnected!")


async def send_gesture(gesture):
    if clients:
        message = json.dumps({"gesture": gesture})

        await asyncio.gather(
            *(client.send(message) for client in clients),
            return_exceptions=True
        )


def start_websocket_server():
    asyncio.set_event_loop(loop)

    async def server():
        async with websockets.serve(
            websocket_handler,
            "localhost",
            8765
        ):
            print("WebSocket server running on port 8765")
            await asyncio.Future()

    loop.run_until_complete(server())


threading.Thread(
    target=start_websocket_server,
    daemon=True
).start()


# ============================================================
# CAMERA
# ============================================================

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("Camera could not be opened")
    exit()


# ============================================================
# MEDIAPIPE HAND LANDMARKER - MODERN API
# ============================================================

BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions

options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path="hand_landmarker.task"
    ),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.7,
    min_hand_presence_confidence=0.7,
    min_tracking_confidence=0.7
)

landmarker = HandLandmarker.create_from_options(options)


# ============================================================
# GESTURE FUNCTIONS
# ============================================================

def distance(point1, point2):
    return math.hypot(
        point1.x - point2.x,
        point1.y - point2.y
    )


def is_open_palm(hand_landmarks):

    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    wrist = hand_landmarks[0]

    extended = 0

    for tip, pip in zip(tips, pips):

        if distance(
            hand_landmarks[tip],
            wrist
        ) > distance(
            hand_landmarks[pip],
            wrist
        ):
            extended += 1

    return extended >= 4


def is_fist(hand_landmarks):

    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    wrist = hand_landmarks[0]

    folded = 0

    for tip, pip in zip(tips, pips):

        if distance(
            hand_landmarks[tip],
            wrist
        ) < distance(
            hand_landmarks[pip],
            wrist
        ):
            folded += 1

    return folded >= 4


def is_pointing(hand_landmarks):

    wrist = hand_landmarks[0]

    index_extended = distance(
        hand_landmarks[8],
        wrist
    ) > distance(
        hand_landmarks[6],
        wrist
    )

    other_tips = [12, 16, 20]
    other_pips = [10, 14, 18]

    other_fingers_folded = 0

    for tip, pip in zip(
        other_tips,
        other_pips
    ):

        if distance(
            hand_landmarks[tip],
            wrist
        ) < distance(
            hand_landmarks[pip],
            wrist
        ):
            other_fingers_folded += 1

    return (
        index_extended
        and other_fingers_folded >= 3
    )


# ============================================================
# MAIN LOOP
# ============================================================

last_gesture = ""

while True:

    success, frame = cap.read()

    if not success:
        print("Could not receive video")
        break

    # OpenCV BGR -> RGB
    frame_rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    # Create MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=frame_rgb
    )

    # Detect hands
    results = landmarker.detect(mp_image)

    gesture = "No Hand"

    # ========================================================
    # HAND DETECTED
    # ========================================================

    if results.hand_landmarks:

        hand_landmarks = results.hand_landmarks[0]

        # Draw landmarks manually
        for connection in mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS:

            start = hand_landmarks[connection.start]
            end = hand_landmarks[connection.end]

            start_point = (
                int(start.x * frame.shape[1]),
                int(start.y * frame.shape[0])
            )

            end_point = (
                int(end.x * frame.shape[1]),
                int(end.y * frame.shape[0])
            )

            cv2.line(
                frame,
                start_point,
                end_point,
                (0, 255, 0),
                2
            )

        # Draw landmark points
        for landmark in hand_landmarks:

            x = int(
                landmark.x * frame.shape[1]
            )

            y = int(
                landmark.y * frame.shape[0]
            )

            cv2.circle(
                frame,
                (x, y),
                4,
                (0, 0, 255),
                -1
            )

        # ====================================================
        # GESTURE DETECTION
        # ====================================================

        if is_pointing(hand_landmarks):

            gesture = "POINT"

        elif is_open_palm(hand_landmarks):

            gesture = "OPEN PALM"

        elif is_fist(hand_landmarks):

            gesture = "FIST"

        else:

            gesture = "UNKNOWN"


    # ========================================================
    # SEND ONLY WHEN GESTURE CHANGES
    # ========================================================

    if gesture != last_gesture:

        asyncio.run_coroutine_threadsafe(
            send_gesture(gesture),
            loop
        )

        last_gesture = gesture

        print("Gesture:", gesture)


    # ========================================================
    # DISPLAY GESTURE
    # ========================================================

    cv2.putText(
        frame,
        gesture,
        (30, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (0, 255, 0),
        3
    )

    cv2.imshow(
        "Gesture Recognition",
        frame
    )


    # ========================================================
    # QUIT
    # ========================================================

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()

landmarker.close()