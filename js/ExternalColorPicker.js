const pickerContainer = document.getElementById('color-container')
const circlePreview = document.getElementById('circle-color-preview');
const colorCodePreview = document.getElementById('color-code');
const upArrow = document.getElementById('up');
const downArrow = document.getElementById('down');
const whichCodeTxt = document.getElementById("which-code-txt");
const pickerBtn = document.getElementById('pick-color-btn');
let globalPicker = null;

function createCanvas(strDataURI) {
    chrome.tabs.query({active:true, windowType:"normal", currentWindow: true} , function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {"type" : "set_canvas" , "canvas" : strDataURI});
    });

}

function setOnClick() {
    pickerBtn.addEventListener('click', (e) => {
        chrome.tabs.query({active:true, windowType:"normal", currentWindow: true} , function(tabs) {
            const windowId = tabs[0].windowId;
            chrome.tabs.captureVisibleTab(
                windowId, {
                    "format":"jpeg",
                    "quality": 100,
                },
                (dataUrl) => {
                    createCanvas(dataUrl)
                    console.log(dataUrl)
                }
            )
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



