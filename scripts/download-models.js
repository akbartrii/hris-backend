const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS = [
  'ssd_mobilenet_v1_model-weights_manifest.json',
  'ssd_mobilenet_v1_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

const targetDir = path.join(__dirname, '../assets/models');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function download(file) {
  const dest = path.join(targetDir, file);
  const fileStream = fs.createWriteStream(dest);
  
  return new Promise((resolve, reject) => {
    https.get(MODEL_URL + file, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded ${file}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading AI models...');
  for (const model of MODELS) {
    try {
      await download(model);
    } catch (err) {
      console.error(`Failed to download ${model}: ${err.message}`);
    }
  }
  console.log('All models downloaded successfully!');
}

main();
