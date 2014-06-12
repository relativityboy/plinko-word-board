/*
 * Projekt Orange - Orange-J -
 * Orange Extension for jQuery
 * Bringing even more advanced coding laziness to the developer
 * Version 2.4.2 - beta
 * author: Donovan Walker
 */

/**
 * The snippet library manager.
 * You must use the manager if you wish to use the include function for the snippets.
 */
function SnippetLib(inSnippets){
   this.snippets       = {};
   this.isSnippetLib   = true;
   this.reg = {};
   this.reg.tagOpen = /\{#snippet name="([a-z]|[A-Z]|[0-9]|_)+" *\}/;
   if(typeof inSnippets == "object" || typeof inSnippets == "string") this.add(inSnippets);
}

SnippetLib.prototype.has = function(inName) {
   if(this.snippets.hasOwnProperty(inName))
      return (this.snippets[inName]);
   return(false);
}


SnippetLib.prototype.add = function(inNameOrObj, inStr) {
   if(typeof inNameOrObj == "object") {
      for(var i in inNameOrObj) if(inNameOrObj.hasOwnProperty(i)) {
         this.snippets[i] = new Snippet(inNameOrObj[i], this);
      }
   } else if (typeof inStr == "string") {
      this.snippets[inNameOrObj] = new Snippet(inStr, this);
   } else {
      var snippets = inNameOrObj;
      while(true) {
         var match = this.reg.tagOpen.exec(snippets);
         if(match == null) break;

         var name = match[0].substring(16, match[0].length - 2); //get the clean tag with no whitespace or opening {
         snippets = snippets.substring(snippets.indexOf(match[0]) + match[0].length)
         this.snippets[name] = new Snippet(snippets.substring(0, snippets.indexOf("{/snippet}")), this);
         snippets = snippets.substring(snippets.indexOf("{/snippet}") + "{/snippet}".length);
      }
   }
};


SnippetLib.prototype.fill = function(inName, inObj, inConfig) {
   if(!this.snippets.hasOwnProperty(inName)) {
      var msg = "SnippetLib Error: snippet '" + inName + "' not set";
      jQuery.log(msg);
      return(false);
   }
   if(typeof inConfig == "object") {
      if(inConfig.hasOwnProperty("parent")) { //supporting 'include' function
         this.snippets[inName].parent = inConfig.parent;
         var html = this.snippets[inName].fill(inObj);
         this.snippets[inName].parent = false;
         return(html);

      }

   }
   return(this.snippets[inName].fill(inObj));
};


SnippetLib.prototype.fillString = function(inTPLString, inObj) {
   var snippet = new Snippet(inTPLString, this);
   var retString = snippet.fill(inObj);
   delete(snippet);
   return(retString);
};



///the snippet class!  required for templating functionality
function Snippet(inString, inLib, inParent) {
   var snippet, match;
   //defaults
   this.isSnippet      = true;
   this.config         = {
      caseConvert:false,
      chopTo:false, // = maxlen - maxchop initialized by maxlen
      collapsewhite:false,
      dateFormat:false,
      htmlentities:false,
      maxend:"",
      maxchop:0,
      maxlen:false,
      maxnohtml:false,
      maxwords:false,
      numberFormat:false
   };
   this.cycleInc       = 0;
   this.cycleName      = false;
   this.cycleValues    = [];
   this.defaultVal     = "";
   this.includeSnippet = false;
   this.inputString    = inString; //full input string
   this.key            = null;     //this snippets key
   this.listInc        = 0;        //list increment.. changes
   this.listPos        = 0;
   this.parent         = false;
   this.sLib           = false;
   this.tag            = null;     //full tag
   this.type           = "";
   this.elements       = []; //placed here for easier display in $.log when debugging

   //this.snippets 	= new Array();
   if(typeof(inParent) == "object" && inParent.isSnippet)
      this.parent = inParent;
   if(typeof(inLib) == "object" && inLib.isSnippetLib)
      this.sLib = inLib;

   //find my tag (always at the beginning of instring)
   match = this.tagOpen.exec(inString);
   if(!this.parent) { //if I have no parent, I'm the root snippet and don't need to find my tag (because it's implied)
      this.tag = "root{}";
      this.type = this.tagType(this.tag);
   } else {
      if(match === null) throw "Snippet Error: bad open tag";
      this.tag = match[0].substring(1, match[0].length - 1); //get the clean tag with no whitespace or opening {
      this.type = this.tagType(this.tag);
      inString = inString.substring(match[0].length-1)
      switch(this.type) {
         case "if" : //we do nothing here because we need the if's 'config' expression for the child.. or do we?
            break;
         case "function" :
            if(this.tag == "#func")
               this.parseConfig(inString.substring(1));
            else
               this.parseConfig(inString.substring(1, inString.indexOf("}}")));
            inString = inString.substring(inString.indexOf("}}") + 2);
            break;
         default :
            this.parseConfig(inString.substring(1, inString.indexOf("}")));
            inString = inString.substring(inString.indexOf("}") + 1);
      }
   }

   //get the data element key  (to fill the snippet)

   //if this is an object, array, or root snippet (an object) look through the 'inString' for child-snippets
   if(this.type == "if") { //if elements and thier else/elseif children have a unique construction
      this.key = "";
      this.constructIf(inString);
   } else if(this.type == "elseif") {
   //since the elseif is built by the parent 'if' we don't need to do anything here.
   } else if(this.type == "object" || this.type == "array" || this.type == "function") {
      if(this.type == "#func") return (this);
      this.key =  this.tag.substring(0, this.tag.length - 2); //trim off the [] or {}
      var tagType = null;
      var matchString = null;
      var working = inString;
      var closeTag = null;
      var z = 0;



      while(true) {
         match = this.tagOpen.exec(working);
         if(match == null) break; //this will break us out of the loop when there are no more matches
         this.elements.push(working.substring(0, match.index)); //adding any static string before the match to the list of child elements
         working = working.substring(match.index);

         matchString = match[0];
         var tag = matchString.substring(1, matchString.length -1);
         //if the child is an object or array snippet, we need to find the end tag and give it all the characters in-between
         tagType = this.tagType(tag);

         switch(tagType) {
            case "object" :
            case "array" :
            case "function" :
            case "if" :
               closeTag = this.getCloseTag(tag);

               var newMatchIndex = working.indexOf(matchString, matchString.length);
               var matchCloseIndex = working.indexOf(closeTag);
               if(matchCloseIndex == -1) throw "Snippet Error: no close for '" + this.tagType(tag) + "' " + tag;
               //because there may be nested tags of the same type/name
               var i = 0; //for debugging the snippets
               while(newMatchIndex < matchCloseIndex && newMatchIndex > -1) {
                  newMatchIndex = working.indexOf(matchString, newMatchIndex + matchString.length);
                  matchCloseIndex = working.indexOf(closeTag, matchCloseIndex + closeTag.length);
                  if(matchCloseIndex == -1 && newMatchIndex == -1) throw "Snippet Error, no close for '" + this.tagType(tag) + " " + tag + "' iteration:" + i;
                  i++;
               }
               //we've found the closing tag for our new object or array Snippet now create it
               snippet = new Snippet(this.rework(tag, tagType, working, matchCloseIndex), this.sLib, this);
               this.elements.push(snippet);
               working = working.substring(matchCloseIndex + closeTag.length);
               break;
            case "literal" :
               closeTag = "{/lit}";
               matchCloseIndex = working.indexOf(closeTag);
               if(matchCloseIndex == -1) throw "Snippet Error: no close for '" + this.tagType(tag) + "'";
               this.elements.push(working.substring(6, matchCloseIndex));
               working = working.substring(matchCloseIndex + closeTag.length);
               matchCloseIndex = working.indexOf(closeTag, matchCloseIndex + closeTag.length);
               break;
            default : //if tag is a value
               matchCloseIndex = working.indexOf("}");
               if(matchCloseIndex == -1) throw "Snippet Error: no close for '" + tag + "' near '" +inString.substring(0, 10) + "...'";
               snippet = new Snippet(this.rework(tag, tagType, working,  matchCloseIndex + 1), this.sLib, this);

               this.elements.push(snippet);
               working = working.substring(matchCloseIndex + 1);
         }
         z++;
      }
      this.elements.push(working);
   } else {
      this.key = this.tag;
   }
   return(this);
}

Snippet.prototype.getCloseTag = function(inTag) {
   var key, closeTag, tagSuffix;
   if(inTag.indexOf("#") == 0) {
      key = inTag.substring(1);
      if(inTag == "#func") {
         closeTag = "}}";
      } else {
         closeTag = "{/" + key + "}";
      }
   } else {
      tagSuffix = inTag.substring(inTag.length - 2);
      key 	= inTag.substring(0, inTag.length - 2);

      closeTag = "{" + tagSuffix + key + "}";
   }
   delete key, tagSuffix;
   return closeTag;
}


Snippet.prototype.listLength = function() {
   return this.getObjValue('listLen');
}


Snippet.prototype.listPos = function() {
   return this.getObjValue('listPos');
}


Snippet.prototype.listIndex = function() {
   return this.getObjValue('listInc');
}


Snippet.prototype.arrayIndex = function() {
   return this.getObjValue('arrayInc');
}

/**
 * Analyses the opening tag and 'reworks' the working input string to expand '.' syntax tags into supported {object{}} tags
 */
Snippet.prototype.rework = function(tag, tagType, working, matchCloseIndex) {
   var closeTags = "", openTags = "";
   var outStr = working.substring(0, matchCloseIndex);
   var tagList = tag.split('.');
   if(tag.indexOf(".") > 0) {
      switch(tagType) {
         case "value" :
            working = outStr.split(".");
            outStr = working.shift() + "{}}";
            outStr += "{" + working.join(".");
            break;
         case "object" :
         case "array" :
            //we remove the opening tag from the output string EXCEPT for the last '}' This allows us to use attributes
            outStr = outStr.substring(tag.length + 1);
            openTags += "{" + tagList.shift() + "{}}";
            while(tagList.length > 1) {
               closeTags = "{{}" + tagList[0] + "}" + closeTags;
               openTags += "{" + tagList.shift() + "{}}";
            }
            outStr = openTags + "{" + tagList[0] + "" + outStr + this.getCloseTag(tagList[0]) +closeTags;
      }

   }
   return outStr;
}

Snippet.prototype.reg = {
   htmltag:/<(?:.|\s)*?>/
   , 
   whitespaceG:/\s+/g
   , 
   nbspG:/&nbsp;/g
//,tagOpen: /{(#template |#lit\}|#func |#if |#elseif |#else|#include |([0-9]|[a-z]|[A-Z]|_)+(\.([0-9]|[a-z]|[A-Z]|_)+)*((\{\})|(\[\]|\(\)))*( |\}))/ //added support for '.' and vars that begin with numbers
//,tagOpenCloseBrace: /(^|[^\\])}/  //not yet used
}

Snippet.prototype.collapseWhite = function(inString) {
   inString = inString.replace(this.reg.nbspG, " ");
   return inString.replace(this.reg.whitespaceG, " ");
}


Snippet.prototype.constructIf = function(inString) {
   var element = new Snippet("{#elseif" + inString.substring(0, inString.indexOf("}") +1), this.sLib, this.parent);
   var tag = null;
   var tagSuffix = null;
   var tagType = null;
   var match   = null;
   var matchString = null;
   var working = inString.substring(inString.indexOf("}") + 1);
   var key = null;
   var closeTag = null;
   var z = 0;
   while(true) { //we loop over the root if's working string.
      match = this.tagOpen.exec(working);
      if(match == null) break; //this will break us out of the loop when there are no more matches
      element.elements.push(working.substring(0, match.index)); //adding any static string before the match to the list of child elements
      working = working.substring(match.index);

      matchString = match[0];
      if(matchString == "{#else")
         tag = matchString.substring(1);
      else
         tag = matchString.substring(1, matchString.length -1);
      //if the child is an object or array snippet, we need to find the end tag and give it all the characters in-between
      tagType = this.tagType(tag);
      switch(tagType) {
         case "elseif" :
            this.elements.push(element);
            element = new Snippet(working.substring(0, working.indexOf("}") + 1), this.sLib, this.parent);
            working = working.substring(working.indexOf("}") + 1);
            break;
         case "else" :
            this.elements.push(element);
            element = new Snippet("{#elseif true}", this.sLib, this.parent);
            working = working.substring(working.indexOf("}") + 1);
            break;
         case "object" :
         case "array" :
         case "function" :
         case "if" :
            closeTag = this.getCloseTag(tag);

            //var newMatchIndex = working.indexOf(matchString, match.index + matchString.length);
            var newMatchIndex = working.indexOf(matchString, matchString.length);
            var matchCloseIndex = working.indexOf(closeTag);
            if(matchCloseIndex == -1) throw "Snippet Error: no close for " + this.tagType(tag) + " " + tag;
            //because there may be nested tags of the same type/name
            var i = 0; //for debugging the snippets
            while(newMatchIndex < matchCloseIndex && newMatchIndex > -1) {
               newMatchIndex = working.indexOf(matchString, newMatchIndex + matchString.length);
               matchCloseIndex = working.indexOf(closeTag, matchCloseIndex + closeTag.length);
               if(matchCloseIndex == -1 && newMatchIndex == -1) throw("Snippet Error: no close for " + this.tagType(tag) + " " + tag + " iteration:" + i);
               i++;
            }
            //we've found the closing tag for our new object or array Snippet now create it
            var snippet = new Snippet(working.substring(0, matchCloseIndex), this.sLib, this);
            //snippet.pre = working.substring(0, match.index);
            element.elements.push(snippet);
            working = working.substring(matchCloseIndex + closeTag.length);
            break;
         default : //if tag is a value
            matchCloseIndex = working.indexOf("}");
            var snippetString = working.substring(0, matchCloseIndex + 1);
            if(tag != "#if") {
                
               //2.4.1
               //var snippet = new Snippet(snippetString, this.sLib, this);
               var snippet = new Snippet(this.rework(tag, tagType, working, matchCloseIndex +1), this.sLib, this);
            }
            //snippet.pre = working.substring(0, match.index);
            element.elements.push(snippet);
            working = working.substring(matchCloseIndex + 1);
      }
      z++;
   }
   element.elements.push(working);
   this.elements.push(element);
}


Snippet.prototype.tagOpen = /{(#template |#lit\}|#func |#if |#elseif |#else|#include |([0-9]|[a-z]|[A-Z]|_)+(\.([0-9]|[a-z]|[A-Z]|_)+)*((\{\})|(\[\]|\(\)))*( |\}))/; //added support for '.' and vars that begin with numbers
Snippet.prototype.tagOpenCloseBrace = /(^|[^\\])}/;  //not yet used


/**
* assumes tag has tag delimiters and any attributes removed
*/
Snippet.prototype.tagType = function(inTag) {
   var ret = "";
   if(inTag.substring((inTag.length - 2)) == "[]") {
      ret += "array";
   }
   else if(inTag.substring((inTag.length - 2)) == "{}") {
      ret += "object";
   } else if(inTag.substring((inTag.length - 2)) == "()") {
      ret += "function";
   } else if(inTag == "#func") {
      ret += "function";
   } else if(inTag == "#template") {
      ret += "template";
   } else if(inTag == "#if") {
      ret += "if";
   } else if(inTag == "#elseif") {
      ret += "elseif";
   } else if(inTag == "#else") {
      ret += "else";
   } else if(inTag == "#include") {
      ret += "include";
   } else if(inTag == "#func") {
      ret += "func";
   } else if(inTag == "#lit")  {
      ret += "literal";
   } else {
      ret += "value";
   }
   return ret;
}


Snippet.prototype.fill = function(obj) {
   var out = "";
   var myVal = "";
   var objType = typeof obj;

   this.obj = obj;
   if(objType == "undefined" || obj == null) {
      obj = this.getDefaultValue();
      objType = typeof obj;
   }

   switch (this.type) {
      case "value" :
         obj = (obj != null)? obj.toString() : ''; //2.4.1
         if(this.config.striphtml) {
            obj = this.stripHTML(obj);
         }

         if(this.config.maxlen && (obj.length > this.config.maxlen)) {
            if(this.config.maxwords) {
               var whiteIndex = obj.substring(0, (this.config.chopTo) + 1).lastIndexOf(" ");
               var nbspIndex = obj.substring(0, this.config.chopTo + 6).lastIndexOf("&nbsp;");
               if(whiteIndex == this.config.chopTo - 1 || nbspIndex == this.config.chopTo - 1) {
                  obj = obj.substring(0, this.config.chopTo);
               } else {
                  if(whiteIndex > nbspIndex && whiteIndex > 0) {
                     obj = obj.substring(0, whiteIndex);
                  }
                  else if(nbspIndex > 0) {
                     obj = obj.substring(0, nbspIndex);
                  }
                  else {
                     obj = obj.substring(0, this.config.chopTo);
                  }
               }
            } else {
               obj = obj.substring(0, this.config.chopTo);
            }
            /*we perform the htmlentities check and append 'maxend' AFTER because we don't want the maxend string to be transformed (there may be html in it)*/
            obj = (this.config.htmlentities)? this.htmlentities(obj) + this.config.maxend:obj + this.config.maxend;
         } else if(this.config.htmlentities) {
            obj = this.htmlentities(obj);
         }
         if(this.config.numberFormat) {
            obj = obj.toString().split('.');
            if(obj[0].charAt(0) == '-') {
               out = '-';
               obj[0] = obj[0].substring(1);
            }
            out += this.config.numberFormat.intMask.substring(0, (this.config.numberFormat.intMask.length - obj[0].length)) + obj[0];
            if(this.config.numberFormat.precisionMask) {
               if(obj.hasOwnProperty(1)) {
                  out += '.' + (obj[1].substring(0, this.config.numberFormat.precisionMask.length) + this.config.numberFormat.precisionMask).substring(0, this.config.numberFormat.precisionMask.length);
               } else {
                  out += '.' + this.config.numberFormat.precisionMask;
               }
            }
            obj = out;
         }

         if(this.config.dateFormat) {
            if(! isNaN (obj-0)) {
               this.dateConverter.setTime(obj);
            } else {
               this.dateConverter.setTime(Date.parse(obj));
            }
            obj = this.dateConverter.format(this.config.dateFormat);
         }

         if(typeof this.config.caseConvert == 'string') {
            switch(this.config.caseConvert) {
               case 'uppercase' :
                  obj = obj.toUpperCase();
                  break;
               case 'lowercase' :
                  obj = obj.toLowerCase()
                  break;
               case 'uppercaseFirst' :
                  obj = obj.substr(0,1).toUpperCase() + obj.substring(1);
                  break;
            }
         }
         if(this.config.collapsewhite) obj = this.collapseWhite(obj);
         return obj;
      case "include" :
         if(!this.sLib) {
            throw "Snippet Error: cannot use include when not using SnippetLib";
            return("");
         }
         return this.sLib.fill(this.includeSnippet, obj, {
            parent:this
         });
      case "function" :
         myVal = this.myFunction.call(this.parent, obj);
         if(this.tag == "#func" && typeof(myVal) != "undefined") {
            return myVal.toString();
         }
         if(typeof(myVal) == "undefined" || myVal === false) return "";
         if(typeof(myVal) == "string" || typeof(myVal) == "number") return(myVal);
         return this.fillSnippets(obj);
      case "if" : //we don't have a comparison call here because the elements store 'elseifs' and the root 'if' is an elseif that's in 1st position'
         for(var i = 0; i < this.elements.length; i++) {
            myVal = this.elements[i].fill(obj);
            if(typeof myVal == "string") {
               out += myVal;
               i = this.elements.length;
            }
         }
         break;
      case "elseif" :
         if(!this.myFunction.call(this.parent, obj)) return false;
         return this.fillSnippets(obj)
      case "object" :
         if(this.tag == "root{}") {
            //return this.fillSnippets(obj);
            if(objType == "number" || objType == "string")
               return this.fillSnippets({
                  "val":obj
               });
            else if(objType == "object" && !(obj instanceof Array))
               return this.fillSnippets(obj);
         } else {
            return this.fillSnippets(obj);
         }
      case "array" :
         //if(typeof(obj.length) == "undefined") { // old way assumed something MIGHT be numerically indexable if length exists... NOPE
         this.cycleInc = this.arrayInc = this.listInc = 0;
         this.listPos = 1;
         if(!(obj instanceof Array)) {
            if(typeof(obj) == "object") {
               this.listLen = jQuery.len(obj);
               for(var j in obj) if(obj.hasOwnProperty(j)) {
                  this.arrayInc = j;
                  if(this.cycleInc >= this.cycleValues.length) this.cycleInc = 0;
                  if(typeof(obj[j]) == "string" || typeof(obj[j]) == "boolean" || typeof(obj[j]) == "number") {
                     out += this.fillSnippets({
                        "val":obj[j]
                     });
                  } else {
                     out += this.fillSnippets(obj[j]);
                  }
                  this.listInc++;
                  this.listPos = this.listInc + 1;
                  this.cycleInc++;
               }
            } else { //assumed number/string/boolean - this does not currently support an element that is an array/list element that is actually a function
               return(out + obj); //2.4.1 obj was 'this.inner'
            }
         } else {
            this.listLen = obj.length;
            for(var j = 0; j < obj.length; j++) {
               if(!this.config.maxlen || this.config.maxlen > j) { //swapped < for > fixes maxlen for arrays
                  this.arrayInc = this.listInc = j;
                  this.listPos = this.listInc + 1;
                  if(this.cycleInc >= this.cycleValues.length) this.cycleInc = 0;
                  if(typeof(obj[j]) == "string" || typeof(obj[j]) == "boolean" || typeof(obj[j]) == "number") {
                     out += this.fillSnippets({
                        "val":obj[j]
                     });
                  } else {
                     out += this.fillSnippets(obj[j]);
                  }
                  this.cycleInc++;
               } else {
                  out += this.config.maxend;
                  j = obj.length;
               }
            }
         }
   }
   //}
   this.obj = null;
   delete(this.obj);
   return(out);
}

/**
 * Fills the child snippets of this snippet
 * If the item is a list, is called within an outer loop that sets cycleName, cycleInc, etc
 */
Snippet.prototype.fillSnippets = function(obj) {
   var out = "";
   var snippet = null;
   for(var i = 0; i < this.elements.length; i++) {
      snippet = this.elements[i];
      if(typeof(snippet) == "string") { //static bit of html
         out += snippet;
      } else { //is a real snippet
         if(this.cycleName && this.cycleName == snippet.tag) {
            out += snippet.fill(this.cycleValues[this.cycleInc]);
         } else {
            switch(snippet.type) {
               case "function" :
               case "if" :
               case "include" :
                  out += snippet.fill(obj); //we do this because ifs & functions operate in the parent namespace
                  break;
               default :
                  if(obj !== null) { //2.4.1 null check
                     if(typeof obj[snippet.key] == "function") {
                        out += snippet.fill(obj[snippet.key]());
                     } else {
                        out += snippet.fill(obj[snippet.key]);
                     }
                  }
            }
         }
      }
   }
   return(out);
}


Snippet.prototype.getDefaultValue = function() {
   if(this.defaultVal.length == 0 && this.parent) {
      return(this.parent.getObjValue(this.key));
   } else {
      return(this.defaultVal);
   }
}


Snippet.prototype.getObjValue = function(inKey) {
   if(typeof(this.obj) != "undefined") {
      if(this.type == "array") { //we check here for array because the current array's "current" obj is actually an element of the 'list' that is obj.
         if(this.obj.hasOwnProperty(this.arrayInc) && this.obj[this.arrayInc] !== null && this.obj[this.arrayInc].hasOwnProperty(inKey)) { //2.4.1 nullcheck
            return this.obj[this.arrayInc][inKey];
         }
      }
      if(this.obj != null && this.obj.hasOwnProperty(inKey)) {//2.4.1 nullcheck
         return(this.obj[inKey]);
      } else if(this.type == "array") {
         switch (inKey) {
            case "arrayInc" :
               return this.arrayInc;
            case "listInc" :
               return this.listInc;
            case "listPos" :
               return this.listPos;
            case "listLen" :
               return this.listLen;
            case this.cycleName :
               return this.cycleValues[this.cycleInc];
         }
      }

      return this.parentValue(inKey);
   }
   if(typeof this.parent != "undefined") { //I seem to remember deleting this if a while back. It may produce unexpected results in some situations.
      return this.parentValue(inKey);
   }
   return("");
}
/*
Snippet.prototype.getObjValue = function(inKey) {
   if(typeof(this.obj) != "undefined") {
      if(this.obj.hasOwnProperty(inKey)) {
         return(this.obj[inKey]);
      } else if(this.type == "array" && (inKey == "arrayInc" || inKey == "listInc")) {
         return this.arrayInc;
      }
      return this.parentValue(inKey);
   }
   if(typeof this.parent != "undefined") { //I seem to remember deleting this if a while back. It may produce unexpected results in some situations.
      return this.parentValue(inKey);
   }
   return("");
}
*/

/* fancy. We'll use it only if  we need it.
Snippet.prototype.htmlentities = function (inHTML){
    //by Micox - elmicoxcodes.blogspot.com - www.ievolutionweb.com
    var i,charCode,html='';
    for(i=0;i < inHTML.length;i++){
        charCode = inHTML[i].charCodeAt(0);
        if( (charCode > 47 && charCode < 58) || (charCode > 62 && charCode < 127) ){
            html += inHTML[i];
        }else{
            html += "&#" + charCode + ";";
        }
    }
    return html;
} */
Snippet.prototype.htmlentities = function (inHTML) {
   return inHTML.
   replace(/&/gmi, '&amp;').
   replace(/"/gmi, '&quot;').
   replace(/>/gmi, '&gt;').
   replace(/</gmi, '&lt;')
}


Snippet.prototype.parentValue = function(inKey, inValue) {
   if(this.parent) {
      if(typeof inValue == "undefined")
         return(this.parent.getObjValue(inKey));
      else {
         alert("snippet-setting parent value not implemented!");
         this.parent.setObjValue(inKey, inValue);
      }
   }
   return("");
}


Snippet.prototype.parseConfig = function(inString) {
   switch(this.type) {
      case "function" :
         inString = inString.substring(1);
         eval("this.myFunction = function(obj) {" + inString + "}");
         break;
      case "elseif" :
         eval("this.myFunction = function(obj) { return(" + inString + ");}");
         break;
      case "include" :
         inString = inString.substring(inString.indexOf("\"") + 1);
         this.includeSnippet = inString.substring(0, inString.indexOf("\""));
         break;
      default : /* value,list*/
         var temp = "";
         var index = inString.indexOf("default=\"");
         if(index > -1) {
            temp = inString.substring(index + 9);
            this.defaultVal = temp.substring(0, temp.indexOf("\""));
            inString = inString.replace("default=\"" + this.defaultVal + "\"", "");
         }
         index = inString.indexOf("maxend=\"");
         if(index > -1) {
            temp = inString.substring(index + 8);
            this.config.maxend = temp.substring(0, temp.indexOf("\""));
            inString = inString.replace("maxend=\"" + this.defaultVal + "\"", "");
         }
         index = inString.indexOf("cycleName=");
         if(index > -1) {
            temp = inString.substring(index + 10);
            this.cycleName = temp.substring(0, temp.indexOf(" "));
            temp = temp.substring(this.cycleName.length + 1);
            temp = temp.substring(0, (temp.indexOf(" ") > 0)? temp.indexOf(" "): temp.length);
            this.cycleValues = temp.split("|");
            inString = inString.replace("cycleName=" + this.cycleName + " " + temp + "", "");
         }
         //Number format not yet functional.
         index = inString.indexOf("numberFormat=\"");
         if(index > -1) {
            temp = inString.substring(index + 14);
            temp = temp.substring(0, temp.indexOf("\""));
            inString = inString.replace("numberFormat=" + temp, "");
            temp = temp.split(".");
            this.config.numberFormat = {
               intMask:temp[0], 
               precisionMask:false
            };
            if(temp.length > 1) {
               this.config.numberFormat.precisionMask = temp[1];
            }
         }

         index = inString.indexOf("dateFormat=\"");
         if(index > -1) {
            temp = inString.substring(index + 12);
            temp = temp.substring(0, temp.indexOf("\""));
            if(typeof Date.prototype.format == 'function') {
               this.config.dateFormat = temp;
               this.dateConverter = new Date();
            }
            inString = inString.replace("dateFormat=" + temp, "\"");
         }

         index = inString.indexOf("maxlen=");
         if(index > -1) {
            temp = inString.substring(index + 7);
            temp = temp.substring(0, (temp.indexOf(" ") > 0)? temp.indexOf(" "): temp.length);
            this.config.maxlen = parseInt(temp);
            this.config.chopTo = this.config.maxlen;
            inString = inString.replace("maxlen=" + temp, "");
         }

         index = inString.indexOf("maxwords");
         if(index > -1) {
            this.config.maxwords = true;

            inString = inString.replace("maxwords");
         }
         index = inString.indexOf("maxchop=");
         if(index > -1) {
            temp = inString.substring(index + 8);
            temp = temp.substring(0, (temp.indexOf(" ") > 0)? temp.indexOf(" "): temp.length);
            this.config.maxchop = parseInt(temp);
            if(this.config.maxlen)
               this.config.chopTo = this.config.maxlen - this.config.maxchop;
            inString = inString.replace("maxchop=" + temp, "");
         }
         index = inString.indexOf("htmlentities");
         if(index > -1) {
            temp = inString.substr(index, 12);
            this.config.htmlentities = true;
            inString = inString.replace("htmlentities", "");
         }
         index = inString.indexOf("striphtml");
         if(index > -1) {
            temp = inString.substr(index, 9);
            this.config.striphtml = true;
            inString = inString.replace("striphtml", "");
         }
         index = inString.indexOf("collapsewhite");
         if(index > -1) {
            temp = inString.substr(index, 13);
            this.config.collapsewhite = true;
            inString = inString.replace("collapsewhite", "");
         }
         index = inString.indexOf("maxnohtml");
         if(index > -1) {
            this.config.maxnohtml = true;
            inString = inString.replace("maxnohtml", "");
         }
         index = inString.indexOf("uppercaseFirst");
         if(index > -1) {
            this.config.caseConvert = 'uppercaseFirst';
            inString = inString.replace("uppercaseFirst", "");
         }
         index = inString.indexOf("uppercase");
         if(index > -1) {
            this.config.caseConvert = 'uppercase';
            inString = inString.replace("uppercase", "");
         }
         index = inString.indexOf("lowercase");
         if(index > -1) {
            this.config.caseConvert = 'lowercase';
            inString = inString.replace("lowercase", "");
         }

   }
}


Snippet.prototype.stripHTML = function (inHTML) {
   return inHTML.replace(/(<([^>]+)>)/ig,"");
}

/**
	*	Key event evaluation object (perform javascript on a keystroke event)
	*
	*	NOTE: binding the processKey event using jQuery or in areas where scope/context(namespace) may be ambiguous binding needs to be wrapped in a function
	*	example: $("#groups_display_label").keyup( function(e) {keyWatcher.processKey(e); } ); It may be easier to use Orange-J's 'listen' binding function
   *	which wraps the KeyListener class and assures appropriate context.
   *
   *	While there are quite a few options for configuring KeyListener, It's broken down to be as easy/modular as possible.
   *  The config object has only 4 main elements
   *  * keyCode
   *  * chars
   *  * regEx
   *  * element
   *  Each of these is optional, and they all have nearly identical settings. Master one, and you've mastered the rest.
	*
	* @param inConfig	-required-		//all are optional
	*	.keyCode = {}
	*	.keyCode.13. = (function) ||  (string)
   *	.keyCode.27, 13, *some key code* = (function) || (string) - to be called or evaluated
	*           //the integer number  of a Character keyCode.  Add as many as you want
	*           functions will be passed 2 arguments:
	*           1. The event that triggered the call
	*           2. The listener object (where config options including htmlID will be available off of .config[optName]
	*		duplicating this for an eval string would be the string 'somefunc(e, this)'
	*  .keyCode.onMatch
   *  .keyCode.onMatchDelay
   *  .keyCode.onMatchPreventDefault
   *  .keyCode.onFailed
   *  .keyCode.onFaildPreventDefault
   *
	* 	.element =(DOM Object) - required only for regex
	*           The DOM INPUT element to use for regex expressions.
	*
	* Additional information
	* 	If you want 'no action' performed on some keystrokes when a default action is specified, simply assign and
	*	empty string to that keycode, the same for the .invalidAction argument
        *       inConfig = {'defaultAction':'myfunction()', 27:"$('#somefield').val('')", 9:''}
	*
	*/
function KeyListener(inConfig){
   this.delayedAction = false;
   this.config = inConfig;
   if(!this.config.hasOwnProperty("keyCode") || !this.config.keyCode) {
      this.config.keyCode = false;
   } else {
      if(!this.config.keyCode.hasOwnProperty("onMatch"))                  this.config.keyCode.onMatch = false;
      if(!this.config.keyCode.hasOwnProperty("onMatchDelay"))             this.config.keyCode.onMatchDelay = false;
      if(!this.config.keyCode.hasOwnProperty("onMatchPreventDefault"))    this.config.keyCode.onMatchPreventDefault = false;
      if(!this.config.keyCode.hasOwnProperty("onFailed"))                 this.config.keyCode.onFailed = false;
      if(!this.config.keyCode.hasOwnProperty("onFailedPreventDefault"))   this.config.keyCode.onFailedPreventDefault = false;
   }
   if(!this.config.hasOwnProperty("chars") || !this.config.chars) {
      this.config.chars = false;
   } else {
      if(!this.config.chars.hasOwnProperty("onMatch"))                this.config.chars.onMatch = false;
      if(!this.config.chars.hasOwnProperty("onMatchDelay"))           this.config.chars.onMatchDelay = false;
      if(!this.config.chars.hasOwnProperty("onMatchPreventDefault"))  this.config.chars.onMatchPreventDefault = false;
      if(!this.config.chars.hasOwnProperty("onFailed"))               this.config.chars.onFailed = false;
      if(!this.config.chars.hasOwnProperty("onFailedPreventDefault")) this.config.chars.onFailedPreventDefault = false;
   }
   if(!this.config.hasOwnProperty("regEx") || !this.config.regEx) {
      this.config.regEx = false;
   } else {
      if(!this.config.regEx.hasOwnProperty("expr")) {
         alert("listener:ERROR: config.regEx.expr is missing. Regular expression actions disabled;");
         this.config.regEx = false;
      }
      if(!this.config.hasOwnProperty("element")) alert("listener:WARNING: config.regEx requires config.element be  the listened DOM element (use document.getElementById )")
      if(!this.config.regEx.hasOwnProperty("onMatch"))                this.config.regEx.onMatch = false;
      if(!this.config.regEx.hasOwnProperty("onMatchDelay"))           this.config.regEx.onMatchDelay = false;
      if(!this.config.regEx.hasOwnProperty("onMatchPreventDefault"))  this.config.regEx.onMatchPreventDefault = false;
      if(!this.config.regEx.hasOwnProperty("onFailed"))               this.config.regEx.onFailed = false;
      if(!this.config.regEx.hasOwnProperty("onFailedPreventDefault")) this.config.regEx.onFailedPreventDefault = false;
   }
   if(!this.config.hasOwnProperty("defaultAction") || !this.config.defaultAction) {
      this.config.defaultAction = false;
   }
/*
   if(!this.config.hasOwnProperty("defaults") || !this.config.defaults) {
      this.config.defaults = false;
   } else {
      if(!this.config.defaults.hasOwnProperty("expr")) {
         alert("listener:ERROR: config.regEx.expr is missing. Regular expression actions disabled;");
         this.config.regEx = false;
      }
      if(!this.config.defaults.hasOwnProperty("onMatch"))                this.config.defaults.onMatch = false;
      if(!this.config.defaults.hasOwnProperty("onMatchDelay"))           this.config.defaults.onMatchDelay = false;
      if(!this.config.defaults.hasOwnProperty("onMatchPreventDefault"))  this.config.defaults.onMatchPreventDefault = false;
      if(!this.config.defaults.hasOwnProperty("onFailed"))               this.config.defaults.onFailed = false;
      if(!this.config.defaults.hasOwnProperty("onFailedPreventDefault")) this.config.defaults.onFailedPreventDefault = false;
   }*/
}

KeyListener.prototype.executeAction = function(e, inAction) {
   switch(typeof(inAction)) {
      case "string" :
         eval(inAction);
         break;
      case "function" :
         inAction.call(this, e); // this is supposed to be the key listener instance
         break;
   }
}

/**
	* Processes the keyboard input key value passed to it.
	*
	* @param	e			Key event we are going to process
	**/
KeyListener.prototype.processKey = function( e ){
   clearTimeout(this.delayedAction);

   var action = false;
   var actionDelay = false;
   var keyCode = (e.keyCode)?e.keyCode:e.which;
   var character = String.fromCharCode(keyCode);
   var matched     = false;
   var preventDefault = false;
   if(this.config.keyCode) {
      if(this.config.keyCode.hasOwnProperty(keyCode)) {
         matched = true;
         if(this.config.keyCode.onMatch)
            action = this.config.keyCode.onMatch;
         switch(typeof this.config.keyCode[keyCode]) {
            case "string" :
            case "function" :
               action = this.config.keyCode[keyCode];
               break;
            case "boolean" :
               if(!this.config.keyCode[keyCode])
                  action = false;
         }

         actionDelay = this.config.keyCode.onMatchDelay;
         preventDefault = this.config.keyCode.onMatchPreventDefault;
      } else {
         action = this.config.keyCode.onFailed;
         preventDefault = this.config.keyCode.onFailedPreventDefault;
      }
   }

   if(!matched && this.config.chars) {
      if(this.config.chars.hasOwnProperty(character)) {
         matched = true;
         if(this.config.keyCode.onMatch)
            action = this.config.keyCode.onMatch;
         switch(typeof this.config.keyCode[keyCode]) {
            case "string" :
            case "function" :
               action = this.config.keyCode[keyCode];
               break;
            case "boolean" :
               if(!this.config.keyCode[keyCode])
                  action = false;
         }
         actionDelay = this.config.chars.onMatchDelay;
         preventDefault = this.config.chars.onMatchPreventDefault;
      } else {
         action = this.config.chars.onFailed;
         preventDefault = this.config.chars.onFailedPreventDefault;
      }
   }

   if(!matched && this.config.regEx) {
      var newval = this.config.element.value.substring(0, this.config.element.selectionStart);
      newval += character;
      newval += this.config.element.value.substring(this.config.element.selectionEnd);
      if(this.config.regEx.expr.test(newval) ) {
         action = this.config.regEx.onMatch;
         actionDelay = this.config.regEx.onMatchDelay;
         preventDefault = this.config.regEx.onMatchPreventDefault;
      } else {
         if(this.config.regEx.onFailed) action = this.config.regEx.onFailed;
         if(this.config.regEx.onFailedPreventDefault) preventDefault = this.config.regEx.onFailedPreventDefault;
      }
      delete newval;
   }

   if(!matched && this.config.defaultAction) {
      action = this.config.defaultAction;
   }

   if(preventDefault) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
   }

   if(action) {
      if(!actionDelay) {
         this.executeAction(e, action);
      } else {
         var listener = this;
         this.delayedAction = setTimeout(function() {
            listener.executeAction(e, action);
         }, actionDelay
         );
      }
   }
   delete matched, action,actionDelay,keyCode,character,preventDefault;
}

KeyListener.prototype.prevent = function(e, inPrevent) {
   switch(inPrevent) {
      case "both" :
      case "default" :
         if (e.preventDefault) e.preventDefault();
         if(inPrevent != "both") break;
      case "propagation" :
         if (e.stopPropagation) e.stopPropagation();
   }
}


//BEGIN: JQUERY INTEGRATION
if(typeof(jQuery) == "function") {
   //ORANGE-J NAMESPACE
   jQuery.oj = {
      //variables
      vars:{
         regex:{
            email: /^([A-Za-z0-9_\+\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/
         },
         slReady:false

      },
      //BEGIN jQuery TEMPLATE Functions
      sl:new SnippetLib(),

      snippet: function(inTPName, inElementHash) {
         return(jQuery.oj.sl.fill(inTPName, inElementHash));
      },

      snippetString: function(inSnippetString, inElementHash) {
         return(jQuery.oj.sl.fillString(inSnippetString, inElementHash));
      },

      hasSnippet: function(inName) {
         return(jQuery.oj.sl.has(inName));
      },

      snippetReady: function(inFunction) {
         if(jQuery.oj.vars.slReady) {
            inFunction();
         } else {
            setTimeout(function() {
               jQuery.snippetReady(inFunction);
            }, 250);
         }
      },

      setSnippetLib: function(inSnippets) {
         jQuery.oj.sl.add(inSnippets)
      },


      addSnippet: function(inName, inStr) {
         jQuery.oj.sl.add(inName, inStr)
      },


      /**
       * eval used in this function because closures make the value of 'i' the last value assigned for all return function calls (results in assigning templates to random names (or just the last name)
       */
      getSnippets: function(inSnippetURLs, getSnippetCB) {
         if(typeof inSnippetURLs == "object")
            for(var i in inSnippetURLs) {
               if(inSnippetURLs.hasOwnProperty(i)) {
                  eval("jQuery.ajax({type:'GET', url:inSnippetURLs[i], success: function(snippet) { jQuery.oj.sl.add(\"" + i + "\", snippet); if(typeof getSnippetCB == 'function') getSnippetCB(\"" + i + "\")}, error: function(XMLHttpRequest, textStatus, errorThrown){ if(typeof getSnippetCB == 'function') getSnippetCB(\"" + i + "\", false); jQuery.log('error:' + textStatus + ' ' + errorThrown);}});");
               }
            }
         else {
            jQuery.oj.vars.slReady = false;
            jQuery.ajax({
               type:'GET',
               url:inSnippetURLs,
               success: function(snippet) {
                  jQuery.oj.sl.add(snippet);
                  if(typeof getSnippetCB == 'function')
                     getSnippetCB()
               },
               error: function(XMLHttpRequest, textStatus, errorThrown){
                  if(typeof getSnippetCB == 'function') {
                     getSnippetCB(false);
                  }
                  jQuery.log('error:' + textStatus + ' ' + errorThrown);
               }
            });
         }
      },


      //END jQuery SNIPPET Functions

      //takes an object and returns a numerically indexed list
      attrList: function(inObj, inConfig) {
         var retList = [];
         for(var i in inObj) {
            if(inObj.hasOwnProperty(i)) {
               retList.push(i);
            }
         }
         delete i;
         return(retList);
      },


      //jQuery FORM Functions
      fillForm: function(inObj, inPrefix, inSuffix) {
         var prefix = (typeof(inPrefix) != "undefined")? inPrefix : "";
         var suffix = (typeof(inSuffix) != "undefined")? inSuffix : "";

         for(var i in inObj) {
            if(inObj.hasOwnProperty(i)) {
               jQuery("#" + prefix + i + suffix).val(inObj[i]);
            }
         }
         delete i, prefix;
      },

      /**
       *  inDOMPrefix/config
       *  {
       *    domPrefix:'',
       *    domSuffix:'',
       *    stripPrefix:(true)/false
       *    stripSuffix:(true)/false
       */
      objFromDom: function(inFormIDList, inDOMPrefix, inDOMSuffix) {
         var config = {
            DOMPrefix:'', 
            DOMSuffix:'', 
            stripPrefix:true, 
            stripSuffix:true
         };

         if(typeof inDOMPrefix == "object") {
            jQuery.extend(config, inDOMPrefix);
         } else {
            if(typeof inDOMPrefix == "string") config.DOMPrefix = inDOMPrefix;
            if(typeof inDOMSuffix == "string") config.DOMSuffix = inDOMSuffix;
         }

         //make this handle the object innput for 'inDOMPRefix'
         var obj = {};
         config.stripPrefix = (config.stripPrefix)? '' : config.DOMPrefix;
         config.stripSuffix = (config.stripSuffix)? '' : config.DOMSuffix;

         for(var i in inFormIDList) if(inFormIDList.hasOwnProperty(i)) {
            obj[config.stripPrefix + inFormIDList[i] + config.stripSuffix] = jQuery("#" + config.DOMPrefix + inFormIDList[i] + config.DOMSuffix).val();
         }
         return(obj);
      },


      ofd: function(inFormIDList, inDOMPrefix, inDOMSuffix) {
         return(jQuery.oj.objFromDom(inFormIDList, inDOMPrefix, inDOMSuffix));
      },

      //jQuery UTIL functions
      log: function() {
         if(typeof(console) != "undefined") {
            if(typeof(console.log) == "function") {
               for(var i = 0; i < arguments.length; i++) {
                  console.log(arguments[i]);
               }
               return true;
            }
         }
         return false;
      },

      urlParam: function(param, inDefault) {
         return this.urlArg(window.location.href, param, inDefault);
      },
      
      /**
       * Returns (in order of preference) 
       * 1. the requested url parameter's value
       * 2. inDefault
       * 3. false
       * 
       * url         - required -   url from which to extract the value
       * param       - optional -   the name of the parameter 
       *                            If param is not passed, returns a JS Object
       *                            representation of all the parameters in the url
       * inDefault   = optional -   default value if the parameter is not found
       *                            If in default is not passed and 'param' is
       */
      urlArg: function(url, param, inDefault) {
         url = jQuery.oj.urlParse(url);
         if(typeof param == "undefined") return url;
         if(url.hasOwnProperty(param)) return url[param];
         if(typeof inDefault != "undefined") return inDefault;
         return false;
      },
    
          
      /**
       * accepts a url string and de-serializes it. String does not need a 
       * domain or '?', but arguments may not have '?' 
       * array arguments are returned as arrays.
       * ex:
       * http://123.com?a=1&b=2&c[]=3&c[]=4&d=hello
       * response
       * {
       *  a:'1',
       *  b:'2',
       *  c:['3','4'],
       *  d:'hello'
       * }
       */
      urlParse : function(inURL) {
         var args, url = inURL.split('?');
         url.args = {};         
         if(url.length == 1) {
            url.shift('');
         }
         
         if(url[1].indexOf("#") > -1) {
            url.args['#'] = url[1].substring(url[1].indexOf("#") + 1);
            url[1] = url[1].slice(0, url[1].indexOf("#"));
         }         
         url.argList = url[1].split("&");
         for(var i in url.argList) if(url.argList.hasOwnProperty(i)) {
            url.argList[i] = url.argList[i].split("=");
            if(url.argList[i][0].indexOf("[]") == url.argList[i][0].length - 2 ) {
               args = url.argList[i][0].substring(0, url.argList[i][0].length - 2);
               if(!url.args.hasOwnProperty(args)) {
                  url.args[args] = [];
               }
               if(url.argList[i].length > 1) {
                  url.args[args].push(url.argList[i][1]);
               }
            } else {
               url.args[url.argList[i][0]] = '';
               if(url.argList[i].length > 1) {
                  url.args[url.argList[i][0]] = url.argList[i][1];
               }       
            }
         }
         return url.args;
      },

      /**
       * Counts the total number of properties for a given object
       *
       *
       * @param inObj the object to be 'counted'
       * @param inConfig -optional-
       * @return int|array
       */
      len: function(inObj, inConfig) {
         var config = jQuery.extend({
            all:false,
            getArray:false,
            filterOut:["function"]
         }, inConfig);
         var ret = [];

         var j, i, elType, count;
         for(i in inObj) if(config.all || inObj.hasOwnProperty(i)) {
            elType = typeof inObj[i];
            count = true;
            for(j = 0; j < config.filterOut.length; j++) {
               if(elType == config.filterOut[j]) {
                  count = false;
                  break;
               }
            }
            if(count) {
               ret.push(inObj[i]);
            }
         }
         if(config.getArray) return ret;
         return ret.length;

      },

      /**
       * creates a response object {ok:<boolean>, data:<data>,message:<string>}
       * all arguments optional. Defaults are {ok:true,data:'',message:''}.
       * can pass only 'data' argument ro(<data>).
       */
      ro: function(ok, data, message) {
         var resp = {
            ok:true,
            data:'',
            message:''
         };
         if(typeof message == 'string') {
            resp.message = message;
         }
         if(typeof data != 'undefined') {
            resp.data = data;
         }
         switch(typeof ok) {
            case 'undefined' :
               return resp;
            case 'boolean' :
               resp.ok = ok;
               return resp;
            default : //is some data
               resp.data = ok;
               return resp;
         }
      },

      
      //jQuery VALIDATE Functions
      /**
          * Adds a regular expression to the library, or tests a string on a regular expression already assigned to the library
          *
          * Add a regular expression
          * inReName = the name of the regular expression once added to the library
          * inRegex 	= the regular expression to be added
          *
          * Test a string
          * inReName = the name of the regular expression already in the library
          * inRegex  = the string to test against the regular expression
          *
          * returns boolean
          */
      validate: function(inReName, inRegex) {
         if(typeof(inRegex) == "string") {
            if(jQuery.oj.vars.regex.hasOwnProperty(inReName))
               return(jQuery.oj.vars.regex[inReName].test(inRegex));
         }
         if(typeof(inRegex) != "undefined" && inRegex.constructor == RegExp) {
            jQuery.oj.vars.regex[inReName] = inRegex;
            return(true);
         }
         return(false);
      }
   }
   /*
    * candidate for 2.4.3 - short-term for urlParse().attrName
   jQuery.fn.urlArg = function(param, inDefault) {
      url = jQuery.oj.urlParse(url);
      if(url.hasOwnProperty(param)) return url[param];
      if(typeof inDefault != "undefined") return inDefault;
      return false;
   }*/

   //BEGIN jQuery Methods (things that operate on the dom)
   jQuery.fn.urlParse = function(inAttr) {
      var url = window.location.href;
      if($(this).length > 0) {
         if(typeof attr === 'undefined') {
            url = $(this).attr("href");
         } else {
            url = $(this).attr(inAttr);
         }
      } else if(typeof this.selector == "string" && this.selector.length > 0) {
         url = this.selector;
      }
      return jQuery.oj.urlParse(url);
   }


   //jQuery KEYLISTENER Methods
   jQuery.fn.listen = function(inConfig) {
      /* if(this.selector.indexOf("#") == 0 && typeof(inConfig.htmlID) == "undefined") {
         inConfig.htmlID = this.selector.substring(1);
      } */
      if(!inConfig.hasOwnProperty("element")) {
         inConfig.element = this;
      }
      var keyListener = new KeyListener(inConfig);

      switch(inConfig.keystroke) {
         case "keydown" :
            this.keydown( function(e) {
               keyListener.processKey(e);
            });
            break;
         case "keyup" :
            this.keyup( function(e) {
               keyListener.processKey(e);
            });
            break;
         case "keypress" :
         default :
            this.keypress( function(e) {
               //keyListener.element = this;
               keyListener.processKey(e);
            });
      }
      return(this);
   }

   //jQuery VALIDATE Methods
   /**
       * tests the matched element against a regular expression in the library
       * inRe = the name of the regular expression
       *
       *  returns mixed - false on fail, the value of the element on success
       */
   jQuery.fn.validate = function(inRe) {
      if(typeof(inRe) == "string") {
         if(jQuery.oj.vars.regex.hasOwnProperty(inRe)) {
            if(jQuery.oj.vars.regex[inRe].test(this.val())) {
               return(this.val());
            }
         }
         return(false);
      }
      return(false);
   }

   //jQuery SNIPPET Methods
   jQuery.fn.addSnippet= function(inName) {
      this.each(function(i, item) {
         if(typeof inName == "string")
            jQuery.oj.sl.add(inName, item.innerHTML);
         else
            jQuery.oj.sl.add(item.innerHTML);
      });
      return(this);
   }

   jQuery.fn.snippet = function(inTPName, inElementHash) {
      var snippet = jQuery.oj.sl.fill(inTPName, inElementHash);
      this.each(function(i, item) {
         if(item.tagName.toLowerCase() == "input" || item.tagName.toLowerCase() == "textarea") item.value = snippet;
         else item.innerHTML = snippet;
      }
      );
      return(this);
   }


   jQuery.fn.snippetAfter = function(inTPName, inElementHash) {
      var snippet = jQuery.oj.sl.fill(inTPName, inElementHash);
      this.after(snippet);
      return(this);
   }


   jQuery.fn.snippetAppend = function(inTPName, inElementHash) {
      var snippet = jQuery.oj.sl.fill(inTPName, inElementHash);
      this.append(snippet);
      return(this);
   };

   jQuery.fn.snippetBefore = function(inTPName, inElementHash) {
      var snippet = jQuery.oj.sl.fill(inTPName, inElementHash);
      this.before(snippet);
      return(this);
   }

   jQuery.fn.snippetPrepend = function(inTPName, inElementHash) {
      var snippet = jQuery.oj.sl.fill(inTPName, inElementHash);
      this.prepend(snippet);
      return(this);
   };

   jQuery.fn.snippetString = function(inSnippetString, inElementHash) {
      this.html(jQuery.oj.sl.fillString(inSnippetString, inElementHash));
      return(this);
   };


   //enable depricated functionality
   for(var ojfunc in jQuery.oj) if(jQuery.oj.hasOwnProperty(ojfunc) && typeof(jQuery.oj[ojfunc]) == 'function') {
      if(jQuery.hasOwnProperty(ojfunc) && (ojfunc != 'serialize')) {
         jQuery.oj.log("jQuery already has function: " + ojfunc);
      } else {
         switch (ojfunc) {
            case 'serialize' :
               jQuery.serializeObj = jQuery.oj[ojfunc];
               break;
            default :
               jQuery[ojfunc] = jQuery.oj[ojfunc];
         }

      }
   }

} else {
   sl = new SnippetLib();
}

//

// Simulates PHP's date function. Credit to Jac Wright & contributors http://jacwright.com/projects/javascript/date_format
Date.prototype.format = function(format) {
   var returnStr = '';
   var replace = Date.replaceChars;
   for (var i = 0; i < format.length; i++) {
      var curChar = format.charAt(i);
      if (i - 1 >= 0 && format.charAt(i - 1) == "\\") {
         returnStr += curChar;
      }
      else if (replace[curChar]) {
         returnStr += replace[curChar].call(this);
      } else if (curChar != "\\"){
         returnStr += curChar;
      }
   }
   return returnStr;
};

Date.replaceChars = {
   shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
   shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

   // Day
   d: function() {
      return (this.getDate() < 10 ? '0' : '') + this.getDate();
   },
   D: function() {
      return Date.replaceChars.shortDays[this.getDay()];
   },
   j: function() {
      return this.getDate();
   },
   l: function() {
      return Date.replaceChars.longDays[this.getDay()];
   },
   N: function() {
      return this.getDay() + 1;
   },
   S: function() {
      return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th')));
   },
   w: function() {
      return this.getDay();
   },
   z: function() {
      var d = new Date(this.getFullYear(),0,1);
      return Math.ceil((this - d) / 86400000);
   }, // Fixed now
   // Week
   W: function() {
      var d = new Date(this.getFullYear(), 0, 1);
      return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7);
   }, // Fixed now
   // Month
   F: function() {
      return Date.replaceChars.longMonths[this.getMonth()];
   },
   m: function() {
      return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1);
   },
   M: function() {
      return Date.replaceChars.shortMonths[this.getMonth()];
   },
   n: function() {
      return this.getMonth() + 1;
   },
   t: function() {
      var d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 0).getDate()
   }, // Fixed now, gets #days of date
   // Year
   L: function() {
      var year = this.getFullYear();
      return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0));
   },	// Fixed now
   o: function() {
      var d  = new Date(this.valueOf());
      d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3);
      return d.getFullYear();
   }, //Fixed now
   Y: function() {
      return this.getFullYear();
   },
   y: function() {
      return ('' + this.getFullYear()).substr(2);
   },
   // Time
   a: function() {
      return this.getHours() < 12 ? 'am' : 'pm';
   },
   A: function() {
      return this.getHours() < 12 ? 'AM' : 'PM';
   },
   B: function() {
      return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24);
   }, // Fixed now
   g: function() {
      return this.getHours() % 12 || 12;
   },
   G: function() {
      return this.getHours();
   },
   h: function() {
      return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12);
   },
   H: function() {
      return (this.getHours() < 10 ? '0' : '') + this.getHours();
   },
   i: function() {
      return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes();
   },
   s: function() {
      return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds();
   },
   u: function() {
      var m = this.getMilliseconds();
      return (m < 10 ? '00' : (m < 100 ?
         '0' : '')) + m;
   },
   // Timezone
   e: function() {
      return "Not Yet Supported";
   },
   I: function() {
      return "Not Yet Supported";
   },
   O: function() {
      return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00';
   },
   P: function() {
      return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00';
   }, // Fixed now
   T: function() {
      var m = this.getMonth();
      this.setMonth(0);
      var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1');
      this.setMonth(m);
      return result;
   },
   Z: function() {
      return -this.getTimezoneOffset() * 60;
   },
   // Full Date/Time
   c: function() {
      return this.format("Y-m-d\\TH:i:sP");
   }, // Fixed now
   r: function() {
      return this.toString();
   },
   U: function() {
      return this.getTime() / 1000;
   }
};