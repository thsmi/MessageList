

var msgListPopulate = function() {
  
  var iframe = document.getElementById("RichtListView").contentWindow;
  iframe.dbView = gFolderDisplay.view.dbView;
  
  iframe.reload();
    
  var count = gFolderDisplay.view.dbView.rowCount;
  Components.utils.reportError("Number of rows"+count);
};

var msgListInitialized = false;

var msgListInject = function() {

	if (msgListInitialized)
	  return;
	  
	msgListInitialized = true;

	var old = gFolderDisplay.show;
  
	// hijack into the folder show action
  gFolderDisplay.show = function(folder) {
    old.call(gFolderDisplay, folder);
    
    if (folder == null)
      return;
      
    msgListPopulate();
  };

  msgListPopulate();

  // attach a context menu listener...
  var iframe = document.getElementById("RichtListView");

  function getRowAt(x,y) {

  	var elm = iframe.contentWindow.document.elementFromPoint(x, y);
    
    while (elm !== null) {
      if (elm.classList && elm.classList.contains("row"))
        break;
      
      elm = elm.parentNode;
    }
    
    return elm;
  }
  
  function getIdxAt(x, y) {
  	
  	var elm = getRowAt(x, y);
  	
  	if (!elm)
  	  return null;
  	  
  	return elm.id.substr(3);
  }
  
  function onContextMenu(event) {

  	var idx = getIdxAt(event.clientX, event.clientY);
  	
  	if (idx === null) {
  		event.preventDefault();
  	  return false;
  	}
  	
  	var view = gFolderDisplay.view.dbView;
  	var key = view.getKeyAt(idx);
  	
  	view.selectMsgByKey(key);
  }
  
  iframe.addEventListener("contextmenu", onContextMenu, true);

  function onDragStart(event) {
  	
  	Components.utils.reportError("dragstart");
  	var elm = getRowAt(event.clientX, event.clientY);
  	if (!elm) {
  		Components.utils.reportError("no such element");
  	  return;
  	}
  	  
  	var dummy = {
  		originalTarget : {
  		  localName : "treechildren"
  		},
  		dataTransfer : {
  			
  			mozSetDataAt : function(a, b, c) {
  		    event.dataTransfer.mozSetDataAt(a,b,c);
  		  },
  		  
        effectAllowed : null,
        addElement:function (a) {
        	// add here the line
          //event.dataTransfer.addElement(a);
        }
  		}
  	};
  	  	
  	ThreadPaneOnDragStart(dummy);
  	
  	if (dummy.dataTransfer.effectAllowed !== null)
  	  event.dataTransfer.effectAllowed = dummy.dataTransfer.effectAllowed;
  }
  
  iframe.addEventListener("dragstart", onDragStart, true);
  iframe.addEventListener("dragover", ThreadPaneOnDragOver, true);
  iframe.addEventListener("drop", ThreadPaneOnDrop, true);
  
  function onDoubleClick(event) {
    var idx = getIdxAt(event.clientX, event.clientY);
    
    if (idx === null) {
      event.preventDefault();
      return false;
    }
    
    var view = gFolderDisplay.view.dbView;
    var key = view.getKeyAt(idx);
    
    view.selectMsgByKey(key);
  	
  	ThreadPaneDoubleClick();
  }
  
  iframe.addEventListener("dblclick", onDoubleClick, true);
  
  function onKeydown(event) {
  	
  	if (event.defaultPrevented)
  	  return;
  	
  	Components.utils.reportError(" Keydown ");
  	
  	if (event.key === "ArrowDown") {
  		event.stopPropagation();
  		event.preventDefault();
  		return false;
  	}
  	
  	if (event.key === "ArrowUp") {
  		event.stopPropagation();
  		event.preventDefault();
  		return false;
  	}
  	
    if ((event.key === "ArrowRight") || (event.key === "ArrowLeft")) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }  	
    
    if (event.key === "Enter") {
      // open the selected element...
    	
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    
    Components.utils.reportError(" Keydown 2"+event.keyCode+" "+event.key);
  }
  
  iframe.addEventListener("keydown", onKeydown, true);
  
};




  document.addEventListener("DOMContentLoaded", function(event) {
   
  	//Components.utils.reportError("DOMContentLoaded");
    /*var old = gFolderDisplay.show;

    gFolderDisplay.show = function(params) { 
      old(params);
  
      treeviewpopulate();
  };*/ });

//gFolderDisplay.show(folders.length ? folders[0] : null);

/*var show = gFolderDisplay.show;

gFolderFisplay.show = function (folder) {
	
	show(folder);
	
	gFolderDisplay.view;
}*/

/*treeviewpopulate = function() {
	
	//FolderDisplayWidget

	gFolderDisplay.view
	
	 nsIMsgDBView
	//viewIndexForFirstSelectedMsg
	var current = gFolderDisplay.view.currentlyDisplayedMessage;

	nsMsgKey = view.getKeyAt(current);
	nsIMsgDbHdr = view.getMsgHdrAt(current);
	
	
	
	aFolder.messages;
	
	// Folder display Widget
	// view = DBViewWrapper(this)
}*/