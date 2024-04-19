// Imports
import chalk from 'chalk';
import promptsync from 'prompt-sync'
import sharp from 'sharp';
import gifenc from 'gifenc'

// Consts
const prompt = promptsync();
const { GIFEncoder, quantize, applyPalette } = gifenc;
const gif = GIFEncoder();
const MAX_FRAMES = 64;

console.log(chalk.green(`
    MinecraftCapes CapeGifTools
                by james090500
`))

var fileName = prompt("Please enter the file name: ")

// Load the image
const sharpImage = await sharp(fileName, { animated: true })
const imageMeta = await sharpImage.metadata()
const { width, pages, pageHeight, heightAllPages } = imageMeta
const height = pageHeight || (heightAllPages / pages)

// Default Cape is
// W = 22
// H = 17
// Formula for new size = gif.width / default.width = scale. scale * template.width = new template size
const capeMap = await sharp(await sharpImage.png().toBuffer())

// Loop through each image and make a new map
var frameHeight = (32 * (height / 17))
for(let i = 0; i < pages; i++) {
    if(i > MAX_FRAMES) break;

    console.log(chalk.blue(`Processing Frame #${i}`))

    //Create each frame
    var frame = await sharp('elytra.png').resize({
        kernel: sharp.kernel.nearest,
        width: MAX_FRAMES * (width / 22),
        height: frameHeight,
    }).composite([{
        input: await capeMap.clone().extract({
            left: 0,
            top: height * i,
            width: width,
            height: height
        }).png().toBuffer(),
        top: 0,
        left: 0,
    }]);

    //Convert data to a raw rgba
    var { data } = await frame.raw().toBuffer({ resolveWithObject: true });
    var pixelArray = new Uint8ClampedArray(data.buffer);

    // Quantize your colors to a 256-color RGB palette palette
    const palette = quantize(pixelArray, 256);

    // Get an indexed bitmap by reducing each pixel to the nearest color palette
    const index = applyPalette(pixelArray, palette);

    //Write the frame
    gif.writeFrame(index, MAX_FRAMES * (width / 22), frameHeight, { palette, transparent: true })
}

console.log(chalk.blue(`Layer Manipulation Finished`))

// Write end-of-stream character
gif.finish();

// Get the Uint8Array output of your binary GIF file
await sharp(gif.bytes(), { animated: true }).toFile('out.gif');

console.log(chalk.green(`Finished`))