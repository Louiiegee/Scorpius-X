#!/bin/bash
echo "Starting Scorpius X Backend..."

# Start the FastAPI server in the background
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
API_PID=$!
echo "FastAPI server started with PID $API_PID"

# Give the API server a moment to start
sleep 2

# Start the WebSocket server
echo "Starting WebSocket server..."
python websocket_server.py &
WS_PID=$!
echo "WebSocket server started with PID $WS_PID"

# Wait for either process to exit
wait $API_PID $WS_PID

# If we get here, one of the servers has exited
echo "A server process exited. Shutting down..."
kill $API_PID $WS_PID 2>/dev/null
exit 1
