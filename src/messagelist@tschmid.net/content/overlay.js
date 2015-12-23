

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
  
  function onContextMenu(event) {
  	var elm = iframe.contentWindow.document.elementFromPoint(event.clientX, event.clientY);
  	
  	while (elm !== null) {
  	  if (elm.classList.contains("row"))
  	    break;
  	  
  	  elm = elm.parentNode;
  	}
  	
  	
  	if (!elm) {
  		event.preventDefault();
  	  return false;
  	}
  	
  	gFolderDisplay.view.dbView.selectMsgByKey(elm.id.substr(3));
  }
  
  iframe.addEventListener("contextmenu", onContextMenu, true);

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