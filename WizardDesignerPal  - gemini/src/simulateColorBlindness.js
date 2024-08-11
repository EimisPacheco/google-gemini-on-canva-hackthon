const simulateColorBlindness = async (type, url) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = "Anonymous"; // Add this line to enable CORS
    image.src = url; // Replace with your image URL

    return new Promise((resolve, reject) => {
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const red = data[i];
                const green = data[i + 1];
                const blue = data[i + 2];

                let newRed = red;
                let newGreen = green;
                let newBlue = blue;

                switch (type) {
                    case 'protanopia':
                    case 'deuteranopia':
                        newRed = 0.567 * red + 0.433 * green;
                        newGreen = 0.558 * green + 0.442 * blue;
                        newBlue = 0.242 * red + 0.758 * blue;
                        break;
                    case 'protanomaly':
                    case 'deuteranomaly':
                        newRed = 0.817 * red + 0.183 * green;
                        newGreen = 0.333 * green + 0.667 * blue;
                        newBlue = 0.125 * red + 0.875 * blue;
                        break;
                    case 'tritanopia':
                        newRed = 0.95 * red + 0.05 * green;
                        newGreen = 0.433 * green + 0.567 * blue;
                        newBlue = 0.475 * red + 0.525 * blue;
                        break;
                    case 'tritanomaly':
                        newRed = 0.967 * red + 0.033 * green;
                        newGreen = 0.733 * green + 0.267 * blue;
                        newBlue = 0.125 * red + 0.875 * blue;
                        break;
                    case 'achromatopsia':
                        newRed = newGreen = newBlue = 0.299 * red + 0.587 * green + 0.114 * blue;
                        break;
                    case 'achromatomaly':
                        newRed = 0.618 * red + 0.282 * green + 0.100 * blue;
                        newGreen = 0.163 * red + 0.775 * green + 0.062 * blue;
                        newBlue = 0.063 * red + 0.137 * green + 0.800 * blue;
                        break;
                }

                data[i] = newRed;      // Red channel
                data[i + 1] = newGreen; // Green channel
                data[i + 2] = newBlue;  // Blue channel
            }

            ctx.putImageData(imageData, 0, 0);
            // Return the modified image as a Base64 string
            const modifiedImage = canvas.toDataURL('image/png');
            resolve(modifiedImage);
        };

        image.onerror = () => {
            reject(new Error("Image could not be loaded"));
        };
    });
}

export default simulateColorBlindness;
