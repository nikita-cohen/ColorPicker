const pickerContainer = document.getElementById('color-container')
const circlePreview = document.getElementById('circle-color-preview');
const colorCodePreview = document.getElementById('color-code');
const upArrow = document.getElementById('up');
const downArrow = document.getElementById('down');
const whichCodeTxt = document.getElementById("which-code-txt");
const pickerBtn = document.getElementById('pick-color-btn');
const selector = document.getElementById('selector');
const dominantOption = document.getElementById('dominant');
const cantAccessText = document.getElementById('cant-access-page');

let globalPicker = null;

function checkIfCanChooseAColor() {
    chrome.tabs.query({currentWindow : true, active : true}, function(tb) {
        const isMatch = !(tb[0].url.match("https://chrome.google.com") || tb[0].url.match('chrome://')|| tb[0].url.match("chrome-error://chromewebdata/") || tb[0].url.match("error://chromewebdata/") ||tb[0].url.match("view-source:") ||tb[0].url.match("file:///") || !tb[0].url.match("http://") && !tb[0].url.match("https://"));
        if (!isMatch){
            pickerBtn.style.display = 'none';
            cantAccessText.style.display = 'block';
        }
    });
}



function getRightCube(index) {
    switch (index) {
        case 0 :
            return document.getElementById('cube-one');
        case 1 :
            return document.getElementById('cube-two');
        case 2 :
            return document.getElementById('cube-three');
        case 3 :
            return document.getElementById('cube-four');
        case 4 :
            return document.getElementById('cube-five');
    }
}

chrome.storage.local.get(['five_color_array'], (result) => {
    if (result.five_color_array) {
        if (result.five_color_array.length > 0) {
            result.five_color_array.reverse().forEach((color, index) => {
                const cube = getRightCube(index);
                cube.addEventListener('click', (event) => {
                    chrome.storage.local.set({'last_color' : color});
                    globalPicker.setColor(color);
                })
                cube.style.cursor = 'pointer';
                cube.style.background = color;
            })
        }
    }
})


function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function setDominantColor(imageElement) {
    // Create the canvas element
    var canvas
            = document.createElement('canvas'),

        // Get the 2D context of the canvas
        context
            = canvas.getContext &&
            canvas.getContext('2d'),
        imgData, width, height,
        length,

        // Define variables for storing
        // the individual red, blue and
        // green colors
        rgb = { r: 0, g: 0, b: 0 },

        // Define variable for the
        // total number of colors
        count = 0;

    // Set the height and width equal
    // to that of the canvas and the image
    height = canvas.height =
        imageElement.naturalHeight ||
        imageElement.offsetHeight ||
        imageElement.height;
    width = canvas.width =
        imageElement.naturalWidth ||
        imageElement.offsetWidth ||
        imageElement.width;

    // Draw the image to the canvas
    context.drawImage(imageElement, 0, 0);

    // Get the data of the image
    imgData = context.getImageData(
        0, 0, width, height);

    // Get the length of image data object
    length = imgData.data.length;

    for (var i = 0; i < length; i += 4) {

        // Sum all values of red colour
        rgb.r += imgData.data[i];

        // Sum all values of green colour
        rgb.g += imgData.data[i + 1];

        // Sum all values of blue colour
        rgb.b += imgData.data[i + 2];

        // Increment the total number of
        // values of rgb colours
        count++;
    }

    // Find the average of red
    rgb.r
        = Math.floor(rgb.r / count);

    // Find the average of green
    rgb.g
        = Math.floor(rgb.g / count);

    // Find the average of blue
    rgb.b
        = Math.floor(rgb.b / count);
   return  "#" + ("000000" + rgbToHex(rgb.r, rgb.g, rgb.b)).slice(-6);
}

function createCanvas(strDataURI) {
    chrome.tabs.query({active:true, windowType:"normal", currentWindow: true} , function(tabs) {
        console.log("on send", tabs[0]);
        chrome.tabs.sendMessage(tabs[0].id, {"type" : "set_canvas" , "canvas" : strDataURI}, (response) => {
            console.log(response)
        });
    });

}

function getScreenShootForDominant() {
    chrome.tabs.query({active:true, windowType:"normal", currentWindow: true} , function(tabs) {
        const windowId = tabs[0].windowId;
        chrome.tabs.captureVisibleTab(
            windowId, {
                "format":"jpeg",
                "quality": 100,
            }
        ).then(dataUrl => {
            let image = new Image;
            image.onload = function () {
                const hex = setDominantColor(image);
                chrome.storage.local.set({'last_color' : hex});
                globalPicker.setColor(hex)
            }
            image.src = dataUrl;
        }).catch(e => {console.log(e)})
    });
}

function setOnChange() {
    selector.addEventListener('change' ,(event) => {
        if (event.target.value === "Dominant Color") {
            getScreenShootForDominant();
        } else {
            chrome.storage.local.get(['five_color_array'], (result) => {
                if (result.five_color_array) {
                    if (result.five_color_array.length > 0) {
                        chrome.storage.local.set({'last_color' : result.five_color_array[result.five_color_array.length -1]});
                        globalPicker.setColor(result.five_color_array[result.five_color_array.length -1])
                    }
                }
            })
        }
    })
}

function setOnClick() {

    dominantOption.addEventListener('click', (e) => {
        getScreenShootForDominant();
    })

    pickerBtn.addEventListener('click', (e) => {
        chrome.tabs.query({active:true, windowType : "normal", currentWindow: true} , function(tabs) {
            console.log("on click", tabs[0])
            const windowId = tabs[0].windowId;
                chrome.tabs.captureVisibleTab(
                    windowId, {
                        "format":"jpeg",
                        "quality": 100,
                    },
                ).then(dataUrl => {
                    createCanvas(dataUrl);
                }).catch(e => console.log("error capture tab", e))
        });
    })


    upArrow.addEventListener('click', (event) => {
        const txt = document.getElementById("which-code-txt");
        switch (txt.innerHTML) {
            case "HEX" :
                chrome.storage.local.set({'color_code_show' : "RGB"})
                txt.innerHTML = "RGB";
                break;
            case "RGB" :
                chrome.storage.local.set({'color_code_show' : "HSL"})
                txt.innerHTML = "HSL";
                break;
            case "HSL" :
                chrome.storage.local.set({'color_code_show' : "HEX"})
                txt.innerHTML = "HEX";
                break
        }
    })

    downArrow.addEventListener('click', (event) => {
        const txt = document.getElementById("which-code-txt");
        switch (txt.innerHTML) {
            case "HEX" :
                chrome.storage.local.set({'color_code_show' : "HSL"})
                txt.innerHTML = "HSL";
                break;
            case "RGB" :
                chrome.storage.local.set({'color_code_show' : "HEX"})
                txt.innerHTML = "HEX";
                break;
            case "HSL" :
                chrome.storage.local.set({'color_code_show' : "RGB"})
                txt.innerHTML = "RGB";
                break
        }
    })
}

function getLastColor() {
    return new Promise((resolve, reject) =>  {
        chrome.storage.local.get('last_color', (result) => {
            if (result.last_color) {
                resolve(result.last_color);
            }
            resolve("");
        })
    })
}

async function createColorPicker() {
    let color = await getLastColor();

    const picker = new Pickr({
        el: '.color-container',
        default: color, // default color
        useAsButton: true,
        components: {

            // Main components
            preview: true,
            opacity: false,
            hue: true,

            // Input / output Options
            interaction: {
                hex: true,
                rgba: true,
                hsla: true,
                hsva: true,
                cmyk: true,
                input: true,
                clear: true,
                save: true
            }
        },
        container : pickerContainer,
        showAlways: true,

    });

    picker.setColor(color);

    return picker;
}

function getColorCodeForShow(){
    return new Promise((resolve, reject) =>  {
        chrome.storage.local.get('color_code_show', (result) => {
            if (result.color_code_show) {
                resolve(result.color_code_show);
            }
            resolve("");
        })
    })
}

function getColorByCode(color, key) {
    if (key === "HEX") {
        return color.toHEXA().toString();
    }
    if (key === "RGB") {
        return color.toRGBA().toString(3);
    }
    if (key === "HSL") {
        return color.toHSLA().toString(3);
    }
}

function getColorByCodePicker(picker, key) {
    if (key === "HEX") {
        return picker.getColor().toHEXA().toString();
    }
    if (key === "RGB") {
        return picker.getColor().toRGBA().toString(3);
    }
    if (key === "HSL") {
        return picker.getColor().toHSLA().toString(3);
    }
}

async function setOnChangeColor(picker) {

    const colorCode = await getColorCodeForShow();

    picker.on('change', (color, instanse) => {
        circlePreview.style.background = getColorByCode(color, colorCode);
        colorCodePreview.innerHTML = getColorByCode(color, colorCode);
    })

    picker.on('changestop', (source, instanse) => {
        chrome.storage.local.set({'last_color' : getColorByCodePicker(picker, colorCode)})
    })

    circlePreview.style.background = picker.getColor().toHEXA().toString();
    colorCodePreview.innerHTML = getColorByCodePicker(picker, colorCode);
}

async function init() {
    checkIfCanChooseAColor();
    setOnChange();
    whichCodeTxt.innerHTML = await getColorCodeForShow();
    const picker = await createColorPicker();
    globalPicker = picker;
    await setOnChangeColor(picker);
    setOnClick();
    return true;
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        if (key === 'color_code_show') {
            if (newValue === 'RGB') {
                globalPicker.off('change', (color, instanse) => {

                })
                setOnChangeColor(globalPicker).then()
            } else if (newValue === 'HSL') {
                globalPicker.off('change', (color, instanse) => {

                })
                setOnChangeColor(globalPicker).then()

            } else if (newValue === "HEX"){
                globalPicker.off('change', (color, instanse) => {

                })
                setOnChangeColor(globalPicker).then()
            }
        }
    }
})

init().then();



