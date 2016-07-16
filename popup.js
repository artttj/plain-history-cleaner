var nextEndTimeToUse = 0;

var allItems = [];
var itemIdToIndex = {};
var searchTerm = '';

function getMoreHistory(callback) {
    var params = {text: searchTerm, maxResults:500};
    params.startTime = 0;
    if (nextEndTimeToUse > 0)
        params.endTime = nextEndTimeToUse;
    chrome.history.search(params, function(items) {     
        var newCount = 0;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.id in itemIdToIndex)
                continue;
            newCount += 1;
            allItems.push(item);
            itemIdToIndex[item.id] = allItems.length - 1;
        }
        if (items && items.length > 0) {
            nextEndTimeToUse = items[items.length-1].lastVisitTime;
        }
        callback(newCount);
    });
}

function find(clbk) {
    getMoreHistory(function(cnt) { 
        if (cnt > 0)
          find();
        if(clbk)
            clbk(allItems);
    });

}

document.addEventListener('DOMContentLoaded', function() {
    var mainBlock = document.getElementById('main');
    var searchField = document.getElementById('search');
    var results = document.querySelector('.js-results-total');
    var list = document.querySelector('.js-list'); 
    var fadeOut = document.querySelector('.js-fadeout');    
    var deleteBtn = document.getElementById('delete');
    var cancelBtn =  document.getElementById('cancel');
    var confirmBtn =  document.getElementById('confirm');    
    var confirmBlock = document.querySelector('.js-confirm-block');
    var notifyBlock = document.querySelector('.js-notify-block'); 
    var errorMsg = document.getElementById('error');
    var successMsg = document.getElementById('success');    
    var showNotification = function(msg, success) {
        notifyBlock.style.display = 'block';
        if(success) {
            return successMsg.innerText = msg;
        }
        return errorMsg.innerText = msg;
    }
    var showList = function(pages) {
        list.innerHTML = '';
        pages.forEach(function(page){
            var title = page.title ? page.title : page.url;
            list.innerHTML += '<li title="' + page.url + '">' + title + '</li>'         
        });
            list.innerHTML += '<li class="empty"></li>';           
        fadeOut.style.display = 'block';
    }
    var closeList = function() {
        list.innerHTML = '';
        fadeOut.style.display = 'none';        
    }
    var hideNotification = function() {
        notifyBlock.style.display = 'none';
        errorMsg.innerText = '';
        successMsg.innerText = '';      
    }
    results.innerText = 'Found: ' + 0;
    var throttle;
    searchField.addEventListener('input', function(e) {
        clearTimeout(throttle);
        throttle = setTimeout(function(){
            searchTerm = e.target.value;
            if(searchTerm == '') {
                closeList();
                return results.innerText = 'Found: ' + 0;
            };         
            nextEndTimeToUse = 0;
            allItems = [];
            itemIdToIndex = {};
            find(function(pages){
                if(searchTerm == '') return;
                hideNotification();
                results.innerText = 'Found: ' + pages.length;
                if (pages.length == 0) return closeList(pages);
                showList(pages);
            });   
        }, 500);
     
    });
    deleteBtn.addEventListener('click', function(e){
        if(searchField.value == '') {
            return showNotification('No items found');
        };
        confirmBlock.style.display = 'block';        
    });
    confirmBtn.addEventListener('click', function() {
        count = 0;
        function check(count){
            if(count == allItems.length) {
                searchField.value = '';
                searchTerm = '';    
                results.innerText = 'Found: ' + 0;
                closeList();
                showNotification('Items were deleted!', 'success');
                confirmBlock.style.display = 'none';
            }
        }
        allItems.forEach(function(page){
            chrome.history.deleteUrl({url: page.url}, function(){
                count++;
                check(count);
            });    
        });
    });
    cancelBtn.addEventListener('click', function(){
        confirmBlock.style.display = 'none';
    });
    mainBlock.addEventListener('click', function(e) {
        if(e.target.id == 'main' ||  e.target.id == 'search' ||  (e.target.nodeName=='DIV' && !e.target.classList.contains('js-confirm-block'))) {
            confirmBlock.style.display = 'none';
            hideNotification();
        }
    });
});
