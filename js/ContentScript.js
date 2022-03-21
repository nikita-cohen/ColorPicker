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
        console.log(response)
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
    if(timer !== null) {
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

function createCanvas(strDataURI){
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    globalCtx = ctx;
    let img = new Image;

    img.onload = function(){
        canvas.setAttribute('width', img.width);
        canvas.setAttribute('height', img.height);
        ctx.drawImage(img, 0, 0, window.innerWidth,window.innerHeight)
        document.body.style.cursor = "crosshair";
    };
    img.src = strDataURI;

    window.addEventListener('mousemove', bindMouseEvent);
    addOnScroll()
    addOnResize()
    addOnClickListener();
}

function removeListener() {
    deletePicker();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', bindMouseEvent);
    window.removeEventListener('scroll', onScroll);
}

function addOnClickListener() {
    window.addEventListener('click', (event) => {
       if (globalCtx !== null) {
           removeListener();
           globalCtx = null;
       }
    }, {once : true})
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.type === "set_canvas") {
        if (document.getElementById('ourPicker') === null ||
            document.getElementById('ourPicker') === undefined ){
            createPicker();
        }
        createCanvas(request.canvas);
    }

    return true;
})

function init() {
    createPicker();
}

init();
