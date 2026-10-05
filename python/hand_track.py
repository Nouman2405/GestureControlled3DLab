
import cv2
import mediapipe as mp
import math
import asyncio
import threading
import websockets
import json

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


cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("Camera could not be opened")
    exit()


mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)


def distance(point1, point2):
    return math.hypot(
        point1.x - point2.x,
        point1.y - point2.y
    )


def is_open_palm(hand_landmarks):
    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    wrist = hand_landmarks.landmark[0]
    extended = 0

    for tip, pip in zip(tips, pips):
        if distance(
            hand_landmarks.landmark[tip], wrist
        ) > distance(
            hand_landmarks.landmark[pip], wrist
        ):
            extended += 1

    return extended >= 4


def is_fist(hand_landmarks):
    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    wrist = hand_landmarks.landmark[0]
    folded = 0

    for tip, pip in zip(tips, pips):
        if distance(
            hand_landmarks.landmark[tip], wrist
        ) < distance(
            hand_landmarks.landmark[pip], wrist
        ):
            folded += 1

    return folded >= 4


def is_pointing(hand_landmarks):
    wrist = hand_landmarks.landmark[0]

    index_extended = distance(
        hand_landmarks.landmark[8], wrist
    ) > distance(
        hand_landmarks.landmark[6], wrist
    )

    other_tips = [12, 16, 20]
    other_pips = [10, 14, 18]

    other_fingers_folded = 0

    for tip, pip in zip(other_tips, other_pips):
        if distance(
            hand_landmarks.landmark[tip], wrist
        ) < distance(
            hand_landmarks.landmark[pip], wrist
        ):
            other_fingers_folded += 1

    return index_extended and other_fingers_folded >= 3


last_gesture = ""

while True:
    success, frame = cap.read()

    if not success:
        print("Could not receive video")
        break

    frame_rgb = cv2.cvtColor(
        frame, cv2.COLOR_BGR2RGB
    )

    results = hands.process(frame_rgb)

    gesture = "No Hand"

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:

            mp_draw.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )

            if is_pointing(hand_landmarks):
                gesture = "POINT"

            elif is_open_palm(hand_landmarks):
                gesture = "OPEN PALM"

            elif is_fist(hand_landmarks):
                gesture = "FIST"

            else:
                gesture = "UNKNOWN"

    if gesture != last_gesture:
        asyncio.run_coroutine_threadsafe(
            send_gesture(gesture),
            loop
        )

        last_gesture = gesture
        print("Gesture:", gesture)

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

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()
hands.close()