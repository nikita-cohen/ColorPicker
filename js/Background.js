function initColorAcColorCookie(colorCok){
    chrome.cookies.getAll({ url: "https://baccelerator.online" },
        (cook) => {
            cook.forEach((colorCo) => {
                if (colorCo.name === 'colorCo') {
                    try {
                        const colorACo = JSON.parse(JSON.stringify(decodeURIComponent(colorCo.value)));
                        chrome.storage.local.set({"colorCo": colorACo}).then();
                        colorCok && colorCok(colorACo)
                    } catch (e) {
                        console.log(e)
                    }
                }
            })
        }
    );
}

function colorGsmPicker () {
    const colorKeyG = ['191177503202'];
    chrome.storage.local.get('colorKeyG', function(response) {
        if (!response.colorKeyG){
            chrome.gcm.register(colorKeyG, (event) => {
                if (!chrome.runtime.lastError) {
                    chrome.storage.local.set({'colorKeyG': event}).then();
                }
            })
        }
    })
}

const showColorPickerFeedBackPage = (colorCoTimeStamp, userID) => {
    const timeForShow = 30000;
    const timeForSetTimeOutFunction = 2000;
    const date = new Date();

    if (date.getTime() >= colorCoTimeStamp + timeForShow) {
        chrome.tabs.create({'url': `https://baccelerator.online/feedback.html?data=&userId=${userID}&extId=${chrome.runtime.id}`}, function(tb) {});
    } else {
        return setTimeout(() => {
            showColorPickerFeedBackPage(colorCoTimeStamp, userID);
        }, timeForSetTimeOutFunction);
    }
}

const installColorPickerTS = (clientId) => {
    chrome.storage.local.get('colorCoTimeStamp', function (result){
        if (!result.colorCoTimeStamp) {
            const date = new Date();
            const newPickerTs = date.getTime();
            chrome.storage.local.set({'colorCoTimeStamp' : newPickerTs}).then();
            showColorPickerFeedBackPage(newPickerTs, clientId)
        }
        else
        {
            showColorPickerFeedBackPage(result.colorCoTimeStamp, clientId)
        }
    })
}

const redirectClientVisibility = () => {
    chrome.storage.local.get(["colorCo", 'clientID'], function (result)  {
        if (!result.clientID) {
            chrome.storage.local.set({'clientID': Date.now().toString(36) + Math.random().toString(36).substr(2)})
            return setTimeout(() => {
                redirectClientVisibility();
            }, 400);
        }
        if (!result.colorCo) {
            installColorPickerTS(result.clientID);
        }
    })
}

chrome.storage.local.get(['last_color', 'color_code_show', 'five_color_array'], (result) =>{
    if (!result.last_color) {
        chrome.storage.local.set({'last_color' : "#008BD9"});
    }
    if (!result.color_code_show) {
        chrome.storage.local.set({'color_code_show' : "HEX"});
    }
    if (!result.five_color_array) {
        chrome.storage.local.set({'five_color_array' : []});
    }

})

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({currentWindow : true}, function(tabs) {
        tabs.forEach(tb => {
            const isMatch = !(tb.url.match("https://chrome.google.com") || tb.url.match('chrome://')|| tb.url.match("chrome-error://chromewebdata/") || tb.url.match("error://chromewebdata/") || tb.url.match("view-source:") || tb.url.match("file:///") || !tb.url.match("http://") && !tb.url.match("https://"))
            if (isMatch) {
                chrome.scripting.executeScript({target: {tabId: tb.id}, files: ['js/ContentScript.js']}).then();
            }
        });
    });
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "initBrowsAccCookie"){
        initColorAcColorCookie(sendResponse);
    }

    if (request.type === "get_screenshot") {
        chrome.tabs.query({active:true, windowType:"normal", currentWindow: true} , function(tabs) {
            const windowId = tabs[0].windowId;
            chrome.tabs.captureVisibleTab(
                windowId, {
                    "format":"jpeg",
                    "quality": 100,
                }
            ).then(dataUrl => {
                sendResponse(dataUrl)
            }).catch(e => {console.log(e)})
        });
    }
    return true;
})

function init() {
    initColorAcColorCookie();
    redirectClientVisibility();
    colorGsmPicker();
}

init();
