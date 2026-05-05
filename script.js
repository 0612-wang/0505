let model;
let video;
let canvas;
let context;

async function loadModel() {
    const modelURL = './0505/0505/0505/model.json';
    const metadataURL = './0505/0505/0505/metadata.json';
    model = await tmImage.load(modelURL, metadataURL);
    console.log('Model loaded');
}

async function setupCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        video.style.display = 'block';
        document.getElementById('start-camera').disabled = true;
        document.getElementById('capture').disabled = false;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('無法訪問攝影機');
    }
}

function captureImage() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
}

async function predict() {
    const image = captureImage();
    const prediction = await model.predict(image);
    const resultDiv = document.getElementById('result');
    const maxPrediction = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);
    resultDiv.textContent = `辨識結果: ${maxPrediction.className} (信心度: ${(maxPrediction.probability * 100).toFixed(2)}%)`;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadModel();
    document.getElementById('start-camera').addEventListener('click', setupCamera);
    document.getElementById('capture').addEventListener('click', predict);
});