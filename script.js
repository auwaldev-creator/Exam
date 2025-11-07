// Wait for DOM and face-api to load
window.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('webcam');
    const overlay = document.getElementById('overlay');
    const status = document.getElementById('status-text');
    const ctx = overlay.getContext('2d');

    // Load face-api.js models (you must host these in 'public/face-api/' or use CDN)
    await faceapi.nets.tinyFaceDetector.loadFromUri('/face-api');
    // Start camera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        alert('Camera access is required for exam proctoring.');
        status.textContent = "Camera not accessible.";
        return;
    }

    // Draw results
    async function detectFace() {
        if (video.readyState !== 4) {
            requestAnimationFrame(detectFace);
            return;
        }
        const options = new faceapi.TinyFaceDetectorOptions();
        const result = await faceapi.detectSingleFace(video, options);

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (result) {
            status.textContent = "Face detected. Exam session active.";
            status.style.color = "#056839";
            // Draw box
            const { x, y, width, height } = result.box;
            ctx.strokeStyle = '#056839';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
        } else {
            status.textContent = "No face detected! Please stay in view.";
            status.style.color = "#c0392b";
        }
        setTimeout(detectFace, 1500);
    }
    detectFace();

    // Screen presence (Page/tab switch)
    ["blur", "visibilitychange"].forEach(event => {
        window.addEventListener(event, function() {
            if (document.hidden || event === "blur") {
                fetch('/api/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'Page left', timestamp: new Date().toISOString() })
                });
            }
        });
    });

    // Send webcam snapshot & face detection status every 60 seconds
    setInterval(async () => {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.drawImage(video, 0, 0, overlay.width, overlay.height);

        // Optionally: annotate with detected face
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
        if (detections) {
            const { x, y, width, height } = detections.box;
            ctx.strokeStyle = "#056839";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        const dataURL = overlay.toDataURL('image/jpeg');
        fetch('/api/snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataURL, withFace: !!detections })
        });
    }, 60000);
});
