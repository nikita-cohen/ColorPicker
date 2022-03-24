
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


