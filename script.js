let model;
let video;
let canvas;
let context;

async function loadModel() {
    try {
        const modelURL = './0505/0505/model.json';
        const metadataURL = './0505/0505/metadata.json';
        
        console.log('Loading model from:', modelURL);
        model = await tmImage.load(modelURL, metadataURL);
        
        console.log('Model loaded successfully');
        document.getElementById('result').textContent = '模型已加載，點擊開啟攝影機';
        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        document.getElementById('result').textContent = '模型加載失敗：' + error.message;
        alert('模型加載失敗，請檢查模型文件路徑');
        return false;
    }
}

async function setupCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 224 },
                height: { ideal: 224 }
            }
        });

        video.srcObject = stream;
        video.style.display = 'block';

        await waitForVideoReady();

        document.getElementById('start-camera').disabled = true;
        document.getElementById('capture').disabled = false;
        document.getElementById('result').textContent = '攝影機已啟動，對準垃圾拍照';
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('無法訪問攝影機：' + error.message);
        document.getElementById('result').textContent = '攝影機訪問被拒絕';
    }
}

function captureImage() {
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('攝影機尚未準備完成，請稍候再試');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
}

async function predict() {
    if (!model) {
        alert('模型尚未加載');
        return;
    }
    
    try {
        document.getElementById('result').textContent = '正在辨識...';
        
        const image = captureImage();
        const prediction = await model.predict(image);
        
        console.log('Prediction results:', prediction);
        
        if (!prediction || prediction.length === 0) {
            document.getElementById('result').textContent = '辨識失敗';
            return;
        }
        
        let resultHTML = '<div class="result-container">';
        let maxConfidence = 0;
        let topClass = '';
        
        prediction.forEach(p => {
            const confidence = (p.probability * 100).toFixed(2);
            if (p.probability > maxConfidence) {
                maxConfidence = p.probability;
                topClass = p.className;
            }
            resultHTML += `<div class="prediction-item"><strong>${p.className}</strong>: ${confidence}%</div>`;
        });
        
        resultHTML += '</div>';
        resultHTML = `<div class="top-result">🎯 主要分類: <strong>${topClass}</strong> (${(maxConfidence * 100).toFixed(2)}%)</div>` + resultHTML;
        
        document.getElementById('result').innerHTML = resultHTML;
    } catch (error) {
        console.error('Error during prediction:', error);
        document.getElementById('result').textContent = '辨識出錯：' + error.message;
    }
}

function waitForVideoReady() {
    return new Promise((resolve, reject) => {
        if (!video) {
            reject(new Error('video 元素不存在'));
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('攝影機啟動超時，請重新嘗試'));
        }, 8000);

        const onLoaded = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                clearTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoaded);
                resolve();
            }
        };

        video.addEventListener('loadedmetadata', onLoaded);
        if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('start-camera');
    const captureButton = document.getElementById('capture');

    startButton.addEventListener('click', setupCamera);
    captureButton.addEventListener('click', predict);
    captureButton.disabled = true;

    document.getElementById('result').textContent = '正在加載模型...';
    const modelLoaded = await loadModel();
    if (!modelLoaded) {
        startButton.disabled = true;
        captureButton.disabled = true;
    }
});