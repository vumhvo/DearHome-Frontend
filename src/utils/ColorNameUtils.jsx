// Function to convert hex to RGB
const hexToRgb = (hex) => {
    // Remove the hash if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 2), 16);
    const b = parseInt(hex.substring(4, 2), 16);
    
    return { r, g, b };
};

// Basic color map with RGB ranges
const colorRanges = [
    { name: 'Red', r: [150, 255], g: [0, 100], b: [0, 100] },
    { name: 'Green', r: [0, 100], g: [150, 255], b: [0, 100] },
    { name: 'Blue', r: [0, 100], g: [0, 100], b: [150, 255] },
    { name: 'Yellow', r: [200, 255], g: [200, 255], b: [0, 100] },
    { name: 'Purple', r: [128, 255], g: [0, 100], b: [128, 255] },
    { name: 'Orange', r: [255, 255], g: [127, 200], b: [0, 100] },
    { name: 'Brown', r: [139, 165], g: [69, 110], b: [19, 60] },
    { name: 'Pink', r: [255, 255], g: [192, 220], b: [203, 230] },
    { name: 'Gray', r: [128, 128], g: [128, 128], b: [128, 128] },
    { name: 'White', r: [245, 255], g: [245, 255], b: [245, 255] },
    { name: 'Black', r: [0, 30], g: [0, 30], b: [0, 30] },
    { name: 'Gold', r: [212, 255], g: [175, 215], b: [55, 95] },
    { name: 'Silver', r: [192, 220], g: [192, 220], b: [192, 220] },
    { name: 'Bronze', r: [205, 235], g: [127, 157], b: [50, 80] },
    { name: 'Beige', r: [245, 255], g: [245, 255], b: [220, 240] },
    { name: 'Navy', r: [0, 50], g: [0, 50], b: [128, 165] },
    { name: 'Teal', r: [0, 50], g: [128, 165], b: [128, 165] },
    { name: 'Maroon', r: [128, 165], g: [0, 50], b: [0, 50] },
    { name: 'Olive', r: [128, 165], g: [128, 165], b: [0, 50] }
];

// Function to determine brightness
const getBrightness = (r, g, b) => {
    return (r * 299 + g * 587 + b * 114) / 1000;
};

// Function to get saturation
const getSaturation = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
};

// Function to find the closest basic color name
const getClosestBasicColor = (rgb) => {
    // Check if the color is close to gray
    const saturation = getSaturation(rgb.r, rgb.g, rgb.b);
    const brightness = getBrightness(rgb.r, rgb.g, rgb.b);
    
    // Handle grayscale colors
    if (saturation < 0.2) {
        if (brightness > 240) return 'White';
        if (brightness < 30) return 'Black';
        return 'Gray';
    }
    
    // Find the closest matching color from our ranges
    let closestColor = null;
    let smallestDifference = Number.MAX_VALUE;
    
    colorRanges.forEach(color => {
        if (rgb.r >= color.r[0] && rgb.r <= color.r[1] &&
            rgb.g >= color.g[0] && rgb.g <= color.g[1] &&
            rgb.b >= color.b[0] && rgb.b <= color.b[1]) {
            
            const difference = Math.abs(rgb.r - ((color.r[0] + color.r[1]) / 2)) +
                             Math.abs(rgb.g - ((color.g[0] + color.g[1]) / 2)) +
                             Math.abs(rgb.b - ((color.b[0] + color.b[1]) / 2));
            
            if (difference < smallestDifference) {
                smallestDifference = difference;
                closestColor = color.name;
            }
        }
    });
    
    return closestColor || 'Unknown';
};

// Function to add modifiers based on brightness and saturation
const addColorModifier = (baseColor, rgb) => {
    const brightness = getBrightness(rgb.r, rgb.g, rgb.b);
    const saturation = getSaturation(rgb.r, rgb.g, rgb.b);
    
    if (baseColor === 'Unknown') return baseColor;
    
    let modifier = '';
    if (brightness < 60) modifier = 'Dark ';
    else if (brightness > 220) modifier = 'Light ';
    
    if (saturation < 0.3 && baseColor !== 'Gray' && baseColor !== 'White' && baseColor !== 'Black') {
        modifier += 'Pale ';
    } else if (saturation > 0.8) {
        modifier += 'Vibrant ';
    }
    
    return modifier + baseColor;
};

// Main function to get color name from hex
export const getColorName = (hexColor) => {
    try {
        if (!hexColor || typeof hexColor !== 'string') {
            return 'Invalid Color';
        }

        const rgb = hexToRgb(hexColor);
        const baseColor = getClosestBasicColor(rgb);
        return addColorModifier(baseColor, rgb);
    } catch (error) {
        console.error('Error parsing color:', error);
        return 'Invalid Color';
    }
};

// Export other utility functions if needed
export const isValidHexColor = (hexColor) => {
    const regex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return regex.test(hexColor);
};
