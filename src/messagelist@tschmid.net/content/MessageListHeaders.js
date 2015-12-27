/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/messagelist/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */

/* global window */

Components.utils.import("resource:///modules/gloda/mimemsg.js");

(function(exports) {
	
	
	 function fill(template, name, value) {
    
    var elms = template.getElementsByClassName(name);
    for(var i = 0; i < elms.length; i++) {
      elms[i].textContent = value;
    }
  }

	
  
  function AbstractHeader(view) {
    this._view = view;
  }
    
  AbstractHeader.prototype.createTemplate
      = function() {
        
    var elm = document.getElementById("template-header");
    return elm.children[0].cloneNode(true);         
  };
  
  AbstractHeader.prototype.getView
      = function() {
    return this._view;    	
  };
  
  AbstractHeader.prototype.toElement
      = function(idx) {

    var template = this.createTemplate();

    var hdr = this.getView().getMsgHdrAt(idx);

    // TODO load and unload need to be aware of dummies elements
    // otherwise we'll leak

    template.id = "msg"+idx;

    fill(template, "caption", this._getText(idx, hdr));
    
    /*if (groupthread) {
      fill(template, "messages", this._getText(this._idx, hdr));
      fill(template, "unread", this._getText(this._idx, hdr));
    }*/
    
    return template;
  };
  
  //----------------------------------------------------

  function AbstractAgeHeader(view) {
    AbstractHeader.call(this, view);
  	this.now = new Date();
  }

  AbstractAgeHeader.prototype = Object.create(AbstractHeader.prototype);
  AbstractAgeHeader.prototype.constructor = AbstractAgeHeader;  
  
  /**
   * Calculates the days
   */
  AbstractAgeHeader.prototype.getDays
      = function(date, days) {
 	
 	  date = new Date(date.getTime());
 	
 	  date.setHours(0);
    date.setMinutes(0);
 	  date.setSeconds(0);
 	  date.setMilliseconds(0);
 	
 	  date.setDate(date.getDate() + days);
 	
 	  return date.getTime();
  };
 
  AbstractAgeHeader.prototype.getAge
      = function(date) {
             	
    if (date >= this.getDays( this.now, +1 ))
      return "Future";
  
    if (date >= this.getDays( this.now, 0 ))
      return "Today";
      
    if (date >= this.getDays( this.now, -1 ))
      return "Yesterday";
      
    if (date >= this.getDays( this.now, -7 ))
      return "Last Week";
      
    if (date >= this.getDays( this.now, -14 ))
      return "Two Weeks Ago";
      	
    return "Older";  
  };

  //--------------------------------------------
  
  function ReceviedHeader(view, idx) {
  	AbstractAgeHeader.call(this, view, idx);
  }

  ReceviedHeader.prototype = Object.create(AbstractAgeHeader.prototype);
  ReceviedHeader.prototype.constructor = ReceviedHeader;  
  
  ReceviedHeader.prototype._getText
      = function(idx, hdr) {
      	
    return this.getAge(hdr.date);
  };

  //---------------------------------------------
  
  function DateHeader(view, idx) {
  	AbstractAgeHeader.call(this, view, idx);
  }

  DateHeader.prototype = Object.create(AbstractAgeHeader.prototype);
  DateHeader.prototype.constructor = DateHeader;  
  
  DateHeader.prototype._getText
      = function(idx, hdr) {
    // the received date is in seconds and needs to be converted to javascrip time
    return this.getAge(hdr.getUint32Property("dateReceived")*1000);
  };
  
  //-----------------------------------
  
  function SubjectHeader(view) { 	
    AbstractHeader.call(this, view);
  }

  SubjectHeader.prototype = Object.create(AbstractHeader.prototype);
  SubjectHeader.prototype.constructor = SubjectHeader;  
  
  SubjectHeader.prototype._getText 
      = function(idx, hdr) {
    return hdr.mime2DecodedSubject;
  };
  
  //------------------------------
  
  function AuthorHeader(view) {
    AbstractHeader.call(this, view);
  }

  AuthorHeader.prototype = Object.create(AbstractHeader.prototype);
  AuthorHeader.prototype.constructor = AuthorHeader;  

  AuthorHeader.prototype._getText
      = function(idx, hdr) {    
    return ""+hdr.mime2DecodedAuthor;      	
  };
  
  //----------------------------------
  
  function StatusHeader(view) {
  	AbstractHeader.call(this, view);
  }
  
  StatusHeader.prototype = Object.create(AbstractHeader.prototype);
  StatusHeader.prototype.constructor = StatusHeader; 

  StatusHeader.prototype._getText
      = function(idx, hdr) {

    // Fetch status
    var Ci = Components.interfaces;
    
    var flags = hdr.getFlags();

    if (flags & Ci.nsMsgMessageFlags.Replied)
      return "Replied";
      
    if (flags & Ci.nsMsgMessageFlags.Forwarded)
      return "Forwarded";
    
    if (flags & Ci.nsMsgMessageFlags.New)
      return "New";
    
    if (flags & Ci.nsMsgMessageFlags.Read)
      return "Read";
      
      
    return "No Status";      
  };

  
  //----------------------------------
  
  function TagHeader(view) {
  	AbstractHeader.call(this, view);
  	//Fetchtags
  }

  TagHeader.prototype = Object.create(AbstractHeader.prototype);
  TagHeader.prototype.constructor = TagHeader; 
  
  //----------------------------------
  
  function PriorityHeader(view) {
  	AbstractHeader.call(this, view);
  }

  PriorityHeader.prototype = Object.create(AbstractHeader.prototype);
  PriorityHeader.prototype.constructor = PriorityHeader; 
  
  PriorityHeader.prototype._getText
      = function(idx, hdr) {
      	
    // Fetch Priority 
    var Ci = Components.interfaces;

    var priority = hdr.getPriority();
    
    if ( priority == Ci.nsMsgPriority.highest )
      return "highest";
      
    if ( priority == Ci.nsMsgPriority.high )
      return "high";

    if ( priority == Ci.nsMsgPriority.normal )
      return "normal";

    if ( priority == Ci.nsMsgPriority.low )
      return "low";

    if ( priority == Ci.nsMsgPriority.highest )
      return "lowest";

    return "No Priority";
  };
 
  //----------------------------------
  
  function AccountHeader(view) {
  	AbstractHeader.call(this, view);	
  }

  AccountHeader.prototype = Object.create(AbstractHeader.prototype);
  AccountHeader.prototype.constructor = AccountHeader; 

  AccountHeader.prototype._getText
      = function(idx, hdr) {

    // Fetch Account
    var Cc = Components.classes;
    var Ci = Components.interfaces;
  	    
    var manager = Cc['@mozilla.org/messenger/account-manager;1']
                .getService(Ci.nsIMsgAccountManager);    
    var account = manager.getAccount(hdr.accountKey);
    
    if (account)
      return account.incomingServer().prettyName;
    
    if (hdr.folder)
      return hdr.folder.server.prettyName;
      
    return accountkey;
  };
  
  //----------------------------------
  
  function ReceipientHeader(view) {
  	AbstractHeader.call(this, view);
  	//FetchRecipient
  }

  ReceipientHeader.prototype = Object.create(AbstractHeader.prototype);
  ReceipientHeader.prototype.constructor = ReceipientHeader; 

  /**
   * The unparsedString has following format
   * "version|displayname" 
   */
  ReceipientHeader.prototype.getCachedName
      = function(str, displayVersion)
  {
  	if (str === null)
  	  return null;
  	
  	var idx = str.indexOf("|");
  	
  	if (idx === -1)
  	  return null;
  	  
    var token = str.split("|",2);
       
    if (token[0] !== ""+displayVersion)
      return null;
      
    if (token.length != 2)
      return null;
      
      
    return token[1];
  };

  //  nsCOMArray<msgIAddressObject> EncodedHeader(const nsACString &aHeader,
  //                                              const char *aCharset)

  // EncodedHeader
  ReceipientHeader.prototype.encodedHeader
      = function(header, charset) {
      	
    var Cc = Components.classes;
    var Ci = Components.interfaces;
    
    if ((header === null) || (header === ""))
      return [];
      
    var parser = Cc["@mozilla.org/messenger/headerparser;1"]
                     .getService(Ci.nsIMsgHeaderParser);
    
    return parser.parseEncodedHeader(header, charset, false);
  };

  // void ExtractAllAddresses(const nsCOMArray<msgIAddressObject> &aHeader,
  //                          nsTArray<nsString> &names, nsTArray<nsString> &emails)
  ReceipientHeader.prototype.extractAllAddresses
      = function( header ) {
    
    var addresses = [];
    
    // we can bail out here in case the first header is empty
    if (header.length == 1)
      if (header[0].name === "" && header[0].email === "")
        return [];
    
    for (var i=0; i<header.length; i++) {
    	addresses.push( {
        "name" : header[i].name,
        "email" : header[i].email
    	});
    }
        	
    return addresses;
  };
  
 // static nsresult GetDisplayNameInAddressBook(const nsACString& emailAddress,
 //                                              nsAString& displayName)
  ReceipientHeader.prototype.getDisplayNameInAddressBook
     = function( email , fallback ) {
     	
    var cardForAddress = null;
     	
    var abManager = Components.classes["@mozilla.org/abmanager;1"]
      .getService(Components.interfaces.nsIAbManager);    

    var it = abManager.directories;
     	
    while (it.hasMoreElements()) {
    	var directory = it.getNext();

    	if (!directory)
        continue;
     		
    	directory.QueryInterface(Components.interfaces.nsIAbDirectory);
    		  
      card = directory.cardForEmailAddress(email);
      
      if (!card)
        continue;
        
     	try {  
        if (card.getPropertyAsBool("PreferDisplayName", true)) 
          return card.getDisplayName;
     	}
     	catch (ex) {	}
     	  
      return email;
    }
     	
    return fallback;
  }; 

  ReceipientHeader.prototype._getText
      = function( idx, hdr ) {
      	
    var currentDisplayNameVersion = 551;
    var showCondensedAddresses = false;
    
/*    nsCOMPtr<nsIPrefBranch> prefs(do_GetService(NS_PREFSERVICE_CONTRACTID));
 
    prefs->GetIntPref("mail.displayname.version", &currentDisplayNameVersion);
    prefs->GetBoolPref("mail.showCondensedAddresses", &showCondensedAddresses);*/
    
    var recipients = hdr.getStringProperty("recipient_names");
    recipients = this.getCachedName(recipients, currentDisplayNameVersion);	
      
    if (recipients !== null)
      return recipients;

    
    var addresses = this.encodedHeader(hdr.recipients, hdr.effectiveCharset);
    addresses = this.extractAllAddresses(addresses);
    
    recipients = "";
 
    Components.utils.reportError(" "+addresses);
    var self = this;
    addresses.forEach(function(item) {
      
    	var recipient = item.email
    	
    	if( item.name !== null || item.name !== "")
    	  recipient = item.name;  
    	
      if (!showCondensedAddresses)  
        recipient = self.getDisplayNameInAddressBook(item.email, recipient);
        
      recipients += (recipients.length?", ":"") + recipient;
    });  

    //UpdateCachedName(aHdr, "recipient_names", aRecipientsString);
 
    return recipients;      
  }; 
  
//----------------------------------
  
  function AttachmentHeader(view) {
  	AbstractHeader.call(this, view);
  	//return flags && flags::Attachment? attachments : no attchments
  }

  AttachmentHeader.prototype = Object.create(AbstractHeader.prototype);
  AttachmentHeader.prototype.constructor = AttachmentHeader; 

  //----------------------------------

  function StaredHeader(view) {
  	AbstractHeader.call(this, view);
    //return flags && flags::Marked? flagged : notflagged;	
  }

  StaredHeader.prototype = Object.create(AbstractHeader.prototype);
  StaredHeader.prototype.constructor = StaredHeader; 
  
  //----------------------------------

  function CorrespondentHeader(view) {
  	AbstractHeader.call(this, view);
  }

  CorrespondentHeader.prototype = Object.create(AbstractHeader.prototype);
  CorrespondentHeader.prototype.constructor = CorrespondentHeader; 
  
  //----------------------------------

  function LocationHeader(view) {
  	AbstractHeader.call(this, view);
  }

  LocationHeader.prototype = Object.create(AbstractHeader.prototype);
  LocationHeader.prototype.constructor = LocationHeader; 
  
  //----------------------------------

  function CustomHeader(view) {
  	AbstractHeader.call(this, view);

/*  	
888           nsIMsgCustomColumnHandler* colHandler = GetCurColumnHandler();
889           if (colHandler)
890           {
891             bool isString;
892             colHandler->IsString(&isString);
893             if (isString)
894               rv = colHandler->GetSortStringForRow(msgHdr.get(), aValue);
895             else
896             {
897               uint32_t intKey;
898               rv = colHandler->GetSortLongForRow(msgHdr.get(), &intKey);
899               aValue.AppendInt(intKey);
900             }
*/
  }
  
  CustomHeader.prototype = Object.create(AbstractHeader.prototype);
  CustomHeader.prototype.constructor = CustomHeader; 

  //-------------------------------
  
  function LegacyHeader(view) {
    AbstractHeader.call(this, view);
  }

  LegacyHeader.prototype = Object.create(AbstractHeader.prototype);
  LegacyHeader.prototype.constructor = LegacyHeader; 

  LegacyHeader.prototype._getText
      = function( idx, hdr ) {
    return this.getView().cellTextForColumn(idx, "subject");
  }
  
  //----------------------------------
  
  if (!exports.org)
    exports.org = {};
    
  if (!exports.org.mozilla)
    exports.org.mozilla = {};
    
  if (!exports.org.mozilla.thunderbird)
    exports.org.mozilla.thunderbird = {};
    
  if (!exports.org.mozilla.thunderbird.msglist)
    exports.org.mozilla.thunderbird.msglist = {};

  if (!exports.org.mozilla.thunderbird.msglist.header)
    exports.org.mozilla.thunderbird.msglist.header = {};
    
  exports.org.mozilla.thunderbird.msglist.header.Date = DateHeader;
  exports.org.mozilla.thunderbird.msglist.header.Recevied = ReceviedHeader;
  exports.org.mozilla.thunderbird.msglist.header.Author = AuthorHeader;
  exports.org.mozilla.thunderbird.msglist.header.Subject = SubjectHeader;
  
  exports.org.mozilla.thunderbird.msglist.header.PriorityHeader = PriorityHeader;
  exports.org.mozilla.thunderbird.msglist.header.AccountHeader = AccountHeader;
  exports.org.mozilla.thunderbird.msglist.header.ReceipientHeader = ReceipientHeader;

  exports.org.mozilla.thunderbird.msglist.header.LegacyHeader = LegacyHeader
})(window);
  