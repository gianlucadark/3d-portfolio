const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src/assets');

function getFiles(dir, files_ = []) {
    const files = fs.readdirSync(dir);
    for (const i in files) {
        const name = path.join(dir, files[i]);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

async function optimize() {
    const files = getFiles(assetsDir);
    const images = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

    console.log(`Found ${images.length} images to optimize.`);

    for (const image of images) {
        const webpPath = image.replace(/\.(png|jpg|jpeg)$/, '.webp');

        // Skip if webp already exists and is newer (optional, but good for speed)
        // if (fs.existsSync(webpPath)) continue;

        try {
            await sharp(image)
                .webp({ quality: 80 })
                .toFile(webpPath);

            const oldSize = fs.statSync(image).size;
            const newSize = fs.statSync(webpPath).size;
            const savings = ((oldSize - newSize) / oldSize * 100).toFixed(2);

            console.log(`Optimized: ${path.basename(image)} -> ${path.basename(webpPath)} (${savings}% saved)`);
        } catch (err) {
            console.error(`Failed to optimize ${image}:`, err.message);
        }
    }
}

optimize();
