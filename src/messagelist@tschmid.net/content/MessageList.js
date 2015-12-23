/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/MessageListn/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */


"use strict";

/* global window */

Components.utils.import("resource:///modules/gloda/mimemsg.js");

(function(exports) {
	
	/* global document */
	/* global Components */
	/* global Intl */
	/* global dbView */

	function UrlListener(header) { this.header = header;}
	
	UrlListener.prototype.OnStartRunningUrl = function (aUrl) {};

	UrlListener.prototype.OnStopRunningUrl = function (aUrl, aExitCode) {
	
      Components.utils.reportError("Callback"+this.header.getProperty("preview"));
	};
	

	
	
	function getTemplate() {
		var elm = document.getElementById("template");
		return elm.children[0].cloneNode(true);
	}
	
	function getVisibleRowCount() {
    var content = document.getElementById("content");
    // all elements have the same size as the first element...
    return Math.ceil(window.innerHeight  / content.children[0].offsetHeight);
	}
	

	function fill(template, name, value) {
		
    var elms = template.getElementsByClassName(name);
    for(var i = 0; i < elms.length; i++) {
      elms[i].textContent = value;
    }
	}
	
	function localizeSize(size) {
   
		var formatter = new Intl.NumberFormat([], { 
		minimumFractionDigits: 1, 
		maximumFractionDigits: 1 });
  
    if ((size / (1024*1024*1024)) > 1)
      return ""+ formatter.format((size / (1024*1024*1024))) + "\u00A0GB";
      
    if ((size / (1024*1024)) > 1)
      return ""+formatter.format(size / (1024*1024))+ "\u00A0MB";
      
    return ""+formatter.format(size / (1024))+ "\u00A0KB";	
	}
	
	
	var queue = [];
	var pumps = 10;
	

	function fillMimeMessageAsync(idx) {
		
		if (queue.indexOf(idx) !== -1)
		  return;
		  
		queue.push(idx);
		pump();
	}
	
	function pump() {

  //  Components.utils.reportError("pump");

    if (queue.length === 0)
      return;

    if (pumps === 0)
      return;
      
    pumps--;
      		
		var idx = queue.pop();
		
    var hdr = dbView.getMsgHdrAt(idx);
    
 
    var callback = function( hdr, message ) {
 
//  	  Components.utils.reportError("pump callback");

    	pumps++;
    	window.setTimeout(function() {pump();}, 0);
    	
    	if (message === null)
    	  return;
    	  
      var body = message.coerceBodyToPlaintext(hdr.folder);
      
      var elm = document.getElementById("msg"+hdr.messageKey);
      
      if (elm)
        fill(elm, "message", body);   
    };
		
    try {
      MsgHdrToMimeMessage(hdr, null, callback , false, {saneBodySize: true}) ;
    } catch (ex) {
      Components.utils.reportError(ex);
      
      window.setTimeout(function() {pump();}, 0);
      pumps++;
    }
	}

	
	function createMessage(idx) {

		var hdr = dbView.getMsgHdrAt(idx);

    var template = getTemplate();
    template.id = "msg"+hdr.messageKey;
    
    fill(template, "from", hdr.mime2DecodedAuthor);
    fill(template, "subject", hdr.mime2DecodedSubject);
    
    /*var callback = function(hdr, message) {
      
      if (message === null)  
        return;
        
      var body = message.coerceBodyToPlaintext(hdr.folder);
      
      fill(template, "message", body);
      //if (meta.author)
      //  authorNode.textContent = meta.author;
    };
    
    try {
      MsgHdrToMimeMessage(hdr, null, callback , false, {saneBodySize: true});
    } catch (ex) {
      Components.utils.reportError(ex);
      fill(template, "message", "...");
    }*/
    
    fillMimeMessageAsync(idx);
    
    // hdr.folder.fetchMsgPreviewText([hdr.messageKey], 1, true, new UrlListener(hdr));
    //fill(template, "message", hdr.getProperty("preview"));
      
    fill(template, "date", new Date(hdr.date/1000).toLocaleDateString());
    
    fill(template, "time", new Date(hdr.date/1000).toLocaleTimeString());
    
    if (hdr.isRead === false)
      template.setAttribute("msg-unread", "true");
    
    if (hdr.isFlagged === true)
      template.setAttribute("msg-stared", "true");
           
      
    fill(template, "size", localizeSize(hdr.messageSize) );
        
    fill(template, "priority", hdr.priority);
    
    
    //if (hdr.threadId)
    //  template.style.marginLeft = "20px";
  //  Components.utils.reportError("Thread id"+hdr.threadId);
    
    
    //Components.utils.reportError("Level "+dbView.getLevel(idx));
    //if(hdr.threadParent !== 4294967295 )
    template.children[0].style.paddingLeft = ""+10*((dbView.getLevel(idx))+1)+"px";
    //template.children[0].style.marginLeft = ""+((15*dbView.getLevel(idx) > 0)?15:0)+"px";
    // wenn == 4294967295 dann ist es ein root node
    //Components.utils.reportError("Threadparent"+hdr.threadParent);   
		
    return template;
	}
	
	function createCaption(idx) {

    var hdr = dbView.getMsgHdrAt(idx);

    var template = getTemplate();
    // TODO load and unload need to be aware of dummies elements
    // otherwise we'll leak
    template.id = "msg"+hdr.messageKey+"dummy";
    
    fill(template, "from", "Dummy");
    fill(template, "subject", "");
    fill(template, "message", "");
    fill(template, "time", "");
    fill(template, "day", "");

    return template;
  }
	
	function createElement(idx, content) {
		
		var template = null;
		
    var flags = dbView.getFlagsAt(idx);

    if (flags & 0x20000000)
      template = createCaption(idx);
    else
      template = createMessage(idx);
         
    content.appendChild(template);
       
    template.style.top = ""+idx*msgList.getRowHeight()+"px";
     
    return template;
	}
		
	
	
	// 1. Implement double buffering
	// 2. Add/Remove Element onstead rebuilding the whole content
	// [      [   ]     ]

	
	function MessageList() {
		this.range = null;
	}
	
	// TODO end should be optional
	/**
	 * Loads the given Range into the ui
	 * NOTE: It does not track or update the buffers rage. Use the adjust method instead.
	 */
  MessageList.prototype._loadItems
      = function (start, end) {
      	      	
    var content = document.getElementById("content");
    
    for (var idx=start; idx<end; idx++)
      createElement(idx, content);
  };
	
  /**
   * Removes the given range from the ui
   * NOTE:  does not track or update the buffer's range. Use the adjust method instead.
   */
	MessageList.prototype._unloadItems
	    = function (start, end) {
    
    for (var idx=start; idx<end; idx++) {
      
      var item = this.getItem(idx);  

      if (!item)
        continue;
        
      item.parentNode.removeChild(item);  
        
    }	    	  
	};
	
  /**
   * Clears the messagelist, which means it drops all elements, resets the size
   * and range.
   */
  MessageList.prototype.clear
      = function () {
  
    var content = document.getElementById("content");
    
    while (content.children.length)
      content.removeChild(content.children[0]);
      
    this.range = null;
    
    //content.style.height = "0px";
  };	
	
	MessageList.prototype.getItem
	    = function (idx) {
	    	
	  var hdr = dbView.getMsgHdrAt(idx);
	 
	  var item = document.getElementById("msg"+hdr.messageKey);
	  
	  if (!item)
      Components.utils.reportError("No elm for "+hdr.messageKey);
      
    return item;
	};
	
	MessageList.prototype.count
	    = function () {
	    	
    var content = document.getElementById("content");
    return content.children.length;
  };
  
  MessageList.prototype.getRowHeight
      = function() {
    return document.getElementById("template").children[0].offsetHeight;     	
  };
  
  MessageList.prototype.getFirstVisibleElement
      = function() {
    
    var rowHeight = this.getRowHeight();
    
    // 0 means no visible elements...
    if (rowHeight === 0)
      return 0;
    
    var scroll = document.getElementById("scroll");
    return  Math.floor(scroll.scrollTop/rowHeight); 	
  };

  MessageList.prototype.adjustView
      = function (idx) {
      	
    if (typeof(idx) === "undefined")
      idx = this.getFirstVisibleElement();
    // Adjust the buffers...
    
    this.adjust(idx-15, idx+15);

    // Then update the scroll height
    // FIXME: we should only reset the size when it changed.
    document.getElementById("content").style.height 
      = ""+(this.getRowHeight() * dbView.rowCount)+"px";
  
    //document.getElementById("scrollpos").style.top = "0px";
    //document.getElementById("scrollpos").style.right = "0px";
    //Components.utils.reportError("Children"+this.count());
         	
  };
  
	MessageList.prototype.adjust
	    = function (start, end) {

	  var newRange = {};
    newRange.start  = Math.max( start, 0);
    newRange.end    = Math.min( end, dbView.rowCount);

    if ((newRange.end - newRange.start) > 40)
      Components.utils.reportError(" Range to lage "+(newRange.end - newRange.start));
    
    // A short cut in case we are uninitialized
    if ( !this.range ) {
      this._loadItems(newRange.start, newRange.end);
      this.range = newRange;
      return;
    }
    
    var oldRange = this.range;
       
    // (====[####
    if (oldRange.start > newRange.start)
      this._loadItems(newRange.start, oldRange.start);
      
    // ####]===)
    if (oldRange.end < newRange.end)
      this._loadItems(oldRange.end, newRange.end);
    
    // [####(===
    if (oldRange.start < newRange.start)
      this._unloadItems(oldRange.start, newRange.start);     
      
    // ====]###)
    if (oldRange.end > newRange.end)
      this._unloadItems(newRange.end, oldRange.end);
      
    this.range = newRange;
	};
	
	var msgList = new MessageList();

	// idx = top element
	function reload2(idx) {

		if (!dbView) {
      Components.utils.reportError("No Dbview element");
		  return;
		}
		
    if (typeof(idx) === "undefined") { 
      //Calculate the number of elements to position
      idx = 0;
      try {
        idx = dbView.viewIndexForFirstSelectedMsg;
      } catch (ex) {
        // do nothing...
      }
    }
    
    msgList.clear();
    // TODO we should ensure that idx is visible....
    document.getElementById("scroll").scrollTop = 0;
    
    msgList.adjustView(idx);
    
    document.getElementById("content").style.height 
      = ""+(msgList.getRowHeight() * dbView.rowCount)+"px";

    
 }
 
 /*
      <handler event="keydown" keycode="VK_UP" modifiers="accel any">
877         <![CDATA[
878           if (this._editingColumn)
879             return;
880           _moveByOffset(-1, 0, event);
881         ]]>
882       </handler>
883       <handler event="keydown" keycode="VK_DOWN" modifiers="accel any">
884         <![CDATA[
885           if (this._editingColumn)
886             return;
887           _moveByOffset(1, this.view.rowCount - 1, event);
888         ]]>
889       </handler>
890       <handler event="keydown" keycode="VK_UP" modifiers="accel any, shift">
891         <![CDATA[
892           if (this._editingColumn)
893             return;
894           _moveByOffsetShift(-1, 0, event);
895         ]]>
896       </handler>
897       <handler event="keydown" keycode="VK_DOWN" modifiers="accel any, shift">
898         <![CDATA[
899           if (this._editingColumn)
900             return;
901           _moveByOffsetShift(1, this.view.rowCount - 1, event);
902         ]]>
903       </handler>
904       <handler event="keydown" keycode="VK_PAGE_UP" modifiers="accel any">
905         <![CDATA[
906           if (this._editingColumn)
907             return;
908           _moveByPage(-1, 0, event);
909         ]]>
910       </handler>
911       <handler event="keydown" keycode="VK_PAGE_DOWN" modifiers="accel any">
912         <![CDATA[
913           if (this._editingColumn)
914             return;
915           _moveByPage(1, this.view.rowCount - 1, event);
916         ]]>
917       </handler>
918       <handler event="keydown" keycode="VK_PAGE_UP" modifiers="accel any, shift">
919         <![CDATA[
920           if (this._editingColumn)
921             return;
922           _moveByPageShift(-1, 0, event);
923         ]]>
924       </handler>
925       <handler event="keydown" keycode="VK_PAGE_DOWN" modifiers="accel any, shift">
926         <![CDATA[
927           if (this._editingColumn)
928             return;
929           _moveByPageShift(1, this.view.rowCount - 1, event);
930         ]]>
931       </handler>
932       <handler event="keydown" keycode="VK_HOME" modifiers="accel any">
933         <![CDATA[
934           if (this._editingColumn)
935             return;
936           _moveToEdge(0, event);
937         ]]>
938       </handler>
939       <handler event="keydown" keycode="VK_END" modifiers="accel any">
940         <![CDATA[
941           if (this._editingColumn)
942             return;
943           _moveToEdge(this.view.rowCount - 1, event);
944         ]]>
945       </handler>
946       <handler event="keydown" keycode="VK_HOME" modifiers="accel any, shift">
947         <![CDATA[
948           if (this._editingColumn)
949             return;
950           _moveToEdgeShift(0, event);
951         ]]>
952       </handler>
953       <handler event="keydown" keycode="VK_END" modifiers="accel any, shift">
954         <![CDATA[
955           if (this._editingColumn)
956             return;
957           _moveToEdgeShift(this.view.rowCount - 1, event);
958         ]]>
959       </handler>

toggle select... event.charCode == ' '.charCodeAt(0)

*/

  
  // Copied from https://developer.mozilla.org/en-US/docs/Web/Events/scroll
  function throttle () {
  	
  	var scroll = document.getElementById("scroll");
  	
  	var running = false;
    var func = function() {
    	
    	//Components.utils.reportError("on Scroll");
    	
      if (running)
        return;
      
      running = true;
      requestAnimationFrame( function() {
        scroll.dispatchEvent(new CustomEvent("optimizedScroll"));
        running = false;
      });
    };
    
    scroll.addEventListener("scroll", func);
  }
  
  //TODO https://developer.mozilla.org/en-US/docs/Web/Events/scroll
        
  document.addEventListener("DOMContentLoaded", function(event) {
    Components.utils.reportError("Dom Fully loaded and parsed messaglist ");

    throttle ();

  
    document.getElementById("scroll").addEventListener("optimizedScroll", function() {    
   	  msgList.adjustView();
    });


  });
  
  exports.reload = reload2;
})(window);
