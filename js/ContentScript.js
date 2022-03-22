var globalCtx = null;
let timer = null;
let hex = null;

function createCubeElement() {
    const pickerDiv = document.createElement('div');
    pickerDiv.id = "ourPicker";
    pickerDiv.style.width = '15px';
    pickerDiv.style.height = '15px';
    pickerDiv.style.position = 'fixed';
    pickerDiv.style.zIndex = '999999999999999999999999999999';
    pickerDiv.style.border = '2px solid black';
    pickerDiv.style.display = 'none';
    window.document.body.insertAdjacentElement('afterbegin', pickerDiv);
}

function createElementDivForFreezeEvents() {
    const canvasDiv = document.createElement('div');
    canvasDiv.id = 'canvasDivUi';
    canvasDiv.style.width = '100%';
    canvasDiv.style.height = '100vh';
    canvasDiv.style.zIndex = '9999999999999999999999999999999';
    canvasDiv.style.position = 'fixed';
    canvasDiv.style.display = "flex";
    canvasDiv.style.alignItems = 'flex-end';
    canvasDiv.style.cursor = 'crosshair';
    window.document.body.insertAdjacentElement('afterbegin', canvasDiv);
}

function createPicker() {
    if (window.document.body) {
        createCubeElement();
    } else {
        setTimeout(() => {
            createCubeElement();
        }, 1000)
    }
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function drawStyle (e, colorPixel) {
    hex = "#" + ("000000" + rgbToHex(colorPixel[0], colorPixel[1], colorPixel[2])).slice(-6);
    document.getElementById('ourPicker').style.backgroundColor = "#" + ("000000" + rgbToHex(colorPixel[0], colorPixel[1], colorPixel[2])).slice(-6);
    document.getElementById('ourPicker').style.top = (e.clientY + 15) + "px";
    document.getElementById('ourPicker').style.left = (e.clientX - 20) + "px";
    document.getElementById('small-box').style.backgroundColor = hex;
    document.getElementById('hex-box').innerHTML = hex;

}

function bindMouseEvent(e){
    let colorPixel = globalCtx.getImageData(e.clientX, e.clientY, 1, 1).data;
    if (document.getElementById('ourPicker').style.display === 'none') {
        document.getElementById('ourPicker').style.display = 'block';
        drawStyle(e,colorPixel);
    } else {
        drawStyle(e, colorPixel)
    }
}

function sendMessageToScreenShoot() {
    chrome.runtime.sendMessage({type : "get_screenshot"}, (response) => {
        if (response) {
            createPicker()
            createCanvas(response);
        }
    })
}

function deletePicker() {
    if (document.getElementById('ourPicker')){
        window.document.body.removeChild(document.getElementById('ourPicker'));
    }
    if (document.getElementById('canvasDivUi')) {
        window.document.body.removeChild(document.getElementById('canvasDivUi'));
    }
}

function onResize() {
    window.removeEventListener('mousemove', bindMouseEvent);
    if(timer !== null) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        deletePicker();
        sendMessageToScreenShoot();
    }, 500);
}

function onScroll() {
    window.removeEventListener('mousemove', bindMouseEvent);
    if (timer !== null) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        deletePicker();
        sendMessageToScreenShoot();
    }, 500);
}

function addOnResize() {
    window.addEventListener('resize', onResize);
}

function addOnScroll() {
    window.addEventListener('scroll', onScroll)
}

function createSmallPopUpForDisplayHex() {
    const popupDiv = document.createElement('div');
    popupDiv.id = 'popupColorPickerDiv';
    popupDiv.style.position = 'fixed';
    popupDiv.style.width = '190px';
    popupDiv.style.height = '50px'
    popupDiv.style.display = 'flex';
    popupDiv.style.background = 'black';
    popupDiv.style.border = "2px solid white"
    popupDiv.style.alignItems = 'center';
    popupDiv.innerHTML = `
             <div id="hex-box"  style="margin-right: 10px; color: #f1f3f4; font-size: 30px;"></div>
             <div id="small-box" style="width: 25px; justify-self: end; height: 25px; margin-right: 20px;"></div>
    `
    if (document.getElementById('canvasDivUi')){
        document.getElementById('canvasDivUi').appendChild(popupDiv);
    }
}

function createCanvas(strDataURI){
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    globalCtx = ctx;
    let img = new Image;

    img.onload = function(){
        canvas.setAttribute('width', img.width);
        canvas.setAttribute('height', img.height);
        ctx.drawImage(img, 0, 0, window.innerWidth,window.innerHeight);
    };
    img.src = strDataURI;

    createElementDivForFreezeEvents();
    createSmallPopUpForDisplayHex();
    window.addEventListener('mousemove', bindMouseEvent);
    addOnScroll();
    addOnResize();
    addOnClickListener();
}

function removeListener() {
    deletePicker();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', bindMouseEvent);
    window.removeEventListener('scroll', onScroll);
}

function addOnClickListener() {
    window.document.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
       if (globalCtx !== null) {
           chrome.storage.local.get('five_color_array', (result) => {
               chrome.storage.local.set({'last_color' : hex});
               if (result.five_color_array){
                   if (result.five_color_array.length < 5) {
                       const newArray = result.five_color_array;
                       newArray.push(hex);
                       chrome.storage.local.set({'five_color_array' : newArray});
                       removeListener();
                   } else {
                       const newArray = result.five_color_array;
                       newArray.splice(0, 1);
                       newArray.push(hex)
                       chrome.storage.local.set({'five_color_array' : newArray});
                       removeListener();
                   }
               }
           })
           globalCtx = null;

       }
    } , {once : true})
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "set_canvas") {
        if (document.getElementById('ourPicker') === null ||
            document.getElementById('ourPicker') === undefined ){
            createPicker();
        }
        createCanvas(request.canvas);
        sendResponse("");
    }

    return true;
})

function init() {
    createPicker();
}

init();
