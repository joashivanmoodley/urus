//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfOverlayMgr.js
//! include /ui/juic/js/components/sfCommandButton.js
//! include /ui/juic/js/components/sfSimpleLink.js

function SFShowSWF(swfUrl       /* string */,
                   swfId        /* string */,
                   swfWidth     /* integer */,
                   swfHeight    /* integer */,
                   flashVars    /* string */,
                   requiredMajorVersion,
                   requiredMinorVersion,
                   requiredRevision
        ) {
    this.register();
    assert(swfUrl, "URL to SWF is required");
    assert(swfId, "SWF ID is required");
    this._swfUrl = swfUrl;
    this._swfId = swfId;
    this._swfWidth = swfWidth;
    this._swfHeight = swfHeight;
    if (flashVars) this._flashVars = flashVars;
    this._requiredMajorVersion = requiredMajorVersion;
    this._requiredMinorVersion = requiredMinorVersion;
    this._requiredRevision = requiredRevision;
}

SFShowSWF.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<div id=\"" + this.id + "\" style=\"width:" + this._swfWidth + "px;height:" + this._swfHeight + ";\">");
            h.push("<OBJECT classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" " +
                   "codebase=\"https://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version="
                    + this._requiredMajorVersion + ',' + this._requiredMinorVersion + ',' + this._requiredRevision + ',0"   ' +
                   "width=\"" + this._swfWidth + "\" " +
                   "height=\"" + this._swfHeight + "\" " +
                   "id=\"" + this._swfId + "\">" +
                   "<param name=movie value=\"" + this._swfUrl + "\" />" +
                   "<param name=flashVars value=\"" + this._flashVars + "\" />" +
                   "<param name=quality value=high />" +
                   "<embed src=\"" + this._swfUrl + "\"" +
                   "quality=high " +
                   "flashVars=\"" + this._flashVars + "\" " +
                   "width=\"" + this._swfWidth + "\" " +
                   "height=\"" + this._swfHeight + "\" " +
                   "name=\"" + this._swfId + "\" " +
                   "type=\"application/x-shockwave-flash\">" +
                   "</embed></object></div>");
        },
        /**
         * Private method. Not supposed to be called externally.
         * @param obj The SWF object emcompassed by the OBJECT tag.
         */
        removeObjectFromIE : function(obj) {
            if (obj) {
                for (var ii in obj) {
                    if (typeof obj[ii] == "function") {
                        obj[ii] = null;
                    }
                }
                obj.parentNode.removeChild(obj);
            }
        },
        /**
         * This method detaches the SWF object from the DOM completely and is especially needed to safely
         * and completely remove a SWF in Internet Explorer.
         */
        hide : function() {
            var obj = $(this._swfId);
            if (obj && (obj.nodeName == "OBJECT" || obj.nodeName == "EMBED")) {
                if (Util.browserInfo.ie) {
                    if (obj.readyState == 4) {
                        this.removeObjectFromIE(obj);
                    } else {
                        window.attachEevent("onload", function() {
                            this.removeObjectFromIE(obj);
                        });
                    }
                }
            } else {
                obj.parentNode.removeChild(obj);
            }
            this.dispatch("hide");
        }
    });
})();

function SFAnchorButton(label, sEvent) {
    this.register();
    this._label = label;
    this._event = sEvent;
}

SFAnchorButton.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<button style=\"border:0;background:transparent;color:blue;cursor:pointer;margin:0;padding:0;\" onmouseover=\"this.style.color='#002655'\" onmouseout=\"this.style.color='blue'\" onclick=\"" + this.fireCode("eventHandler", this._event) + "\">" + escapeHTML(this._label) + "</button>");
        },
        eventHandler : function(sEvent) {
            this.dispatch(sEvent);
        }
    });
})();

/**
 * Utility component that produces paragraphs of lorem ipsum. Very useful
 * for testing out how text will display in a container.
 * To use, instantiate the component like this:
 *
 * this.lorem = new SFLoremIpsum();
 *
 * Then, in your renderHTML, you can do something like this:
 *
 * h.push(this.lorem.getLines(20));
 *
 * to get 20 lines of lorem ipsum text.
 */
function SFLoremIpsum(numLines) {
    this._numLines = numLines;
    this._paragraphs = [];
    this.init();
}

SFLoremIpsum.prototype = (function() {
    return set(new Component(), {
        /**
         * Loads the paragraphs array with 10 paragraphs of lorem ipsum
         */
        init : function() {
            this._paragraphs.push("Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nulla vulputate dictum pede. Duis viverra aliquam pede. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Sed tristique venenatis metus. Cras et est. Mauris ultrices. Nulla interdum. Vivamus fermentum, elit nec dictum malesuada, libero nisi fringilla neque, eu fermentum purus dui eu sapien. Ut laoreet arcu eget augue. Curabitur egestas auctor ante. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam suscipit semper metus. Curabitur bibendum arcu in est.");
            this._paragraphs.push("Proin semper, sapien nec lacinia vehicula, massa orci ornare urna, in cursus libero massa in arcu. Aenean rhoncus eleifend mi. Mauris lacus nunc, fringilla ac, bibendum eget, semper vel, metus. Mauris consequat. Praesent elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aliquam tempor tellus. Praesent ullamcorper cursus enim. Ut magna augue, commodo ac, fermentum sed, adipiscing cursus, erat. Nulla quis quam tempus libero sagittis dictum. Quisque dignissim eros non risus.");
            this._paragraphs.push("Mauris bibendum dictum arcu. In mollis, dui vitae interdum ultrices, sem sapien aliquet risus, semper pulvinar urna leo sit amet arcu. Mauris non sapien. Aliquam aliquet mi eu urna. Phasellus ac nibh ac magna gravida malesuada. Ut id dolor. Duis vitae lectus a lectus mollis lacinia. Duis id erat et tortor iaculis viverra. Integer porttitor, eros quis tempor vulputate, lectus erat fermentum lorem, sollicitudin faucibus tortor ante at nisl. Maecenas id risus ut nibh pharetra sollicitudin. Nam arcu lorem, tempus et, dictum at, vulputate vel, nunc. Aliquam ante. Integer aliquet, mi sit amet imperdiet rutrum, lectus felis imperdiet est, nec condimentum lorem arcu in nunc. Suspendisse eleifend dignissim nisi. Aliquam gravida. Aliquam nec leo. Suspendisse laoreet. Donec id urna. Quisque aliquam pulvinar ante.");
            this._paragraphs.push("Nunc imperdiet, urna vitae tristique mattis, arcu turpis scelerisque orci, non convallis lorem magna sit amet magna. Quisque turpis lacus, aliquet aliquet, gravida ac, varius in, orci. Duis vel sapien ac elit porttitor faucibus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed odio arcu, malesuada non, tristique eu, facilisis malesuada, nisi. Cras hendrerit lorem vitae augue. Nam at magna sed leo suscipit vulputate. Etiam nisl. Aenean pretium pretium sem. Donec nec tortor sed ligula auctor faucibus. Curabitur tincidunt imperdiet eros.");
            this._paragraphs.push("Proin mollis. Phasellus hendrerit lacinia sem. Nullam vestibulum rutrum tellus. Etiam in dui. Vestibulum interdum libero ac orci. Cras a nunc. In tellus nibh, lobortis at, sollicitudin at, dapibus eu, lorem. Donec dapibus. Nulla eget ligula. Nullam ante. Suspendisse vitae urna. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quis lectus. Etiam ac purus eu nibh dignissim laoreet. Donec aliquet. Sed arcu lorem, lobortis non, euismod eget, consectetuer eu, leo. Nullam gravida nunc a massa. Nulla nisl ligula, faucibus eu, pulvinar id, cursus in, odio. Sed sed tellus. Pellentesque at dui.");
            this._paragraphs.push("Morbi tortor mi, feugiat posuere, dapibus sit amet, viverra ut, turpis. Aliquam hendrerit nisi. Sed lacinia elit eget purus. Maecenas varius neque nec ligula. Curabitur quis est. Suspendisse imperdiet. Mauris nec diam sit amet leo ultrices pharetra. Praesent placerat sodales urna. Donec vel augue porta orci lobortis vehicula. Cras egestas diam sit amet purus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas leo. Nulla facilisi. Fusce suscipit interdum elit. Vivamus et diam ac urna gravida suscipit.");
            this._paragraphs.push("Sed a nisi. Phasellus fringilla nisl ut erat. Duis adipiscing. Aliquam erat volutpat. In euismod ligula non odio. Phasellus fermentum aliquet mauris. Suspendisse gravida magna vel metus. Nullam vel dui vitae nunc vestibulum feugiat. Curabitur consectetuer. Vestibulum a metus. Nullam sed ipsum quis lectus faucibus porttitor.");
            this._paragraphs.push("Mauris tempor euismod lacus. Integer porttitor hendrerit dolor. Vivamus dapibus. Quisque in dui vitae purus vestibulum sollicitudin. Donec dui. Maecenas in mi. Vivamus vulputate dui eget sem. Cras sit amet nulla vel eros semper vulputate. Donec nec sapien. Ut augue elit, lobortis nec, ullamcorper aliquam, pharetra sed, velit. Aliquam odio quam, ultrices quis, consequat nec, varius et, orci. Integer tellus. In hac habitasse platea dictumst. Nam at dolor. Praesent lacus. Aenean tortor elit, molestie a, pulvinar et, lacinia at, libero. Integer orci elit, tincidunt sed, luctus consequat, ultricies at, velit. Donec bibendum sagittis sem.");
            this._paragraphs.push("Integer vel arcu id orci volutpat dignissim. Pellentesque vel dui a libero sodales rhoncus. Vivamus tempus, orci sed ultrices auctor, tellus mi rutrum ante, nec hendrerit neque nunc sit amet eros. Maecenas dapibus tellus ac neque. Nunc quis justo id sem cursus mollis. Sed faucibus metus at leo. Aenean pellentesque, lorem eu luctus dapibus, odio nunc imperdiet est, eu elementum leo diam id enim. Mauris semper magna eu eros. Nulla iaculis eros eu mauris. Etiam varius.");
            this._paragraphs.push("Nunc rhoncus volutpat ipsum. Suspendisse commodo tellus vitae turpis. Praesent turpis sapien, molestie non, pharetra non, rhoncus at, mi. Vivamus dignissim, orci quis eleifend scelerisque, neque arcu pulvinar leo, ut posuere neque tellus et purus. Pellentesque est. Mauris dolor dolor, egestas non, sagittis id, consequat eu, dolor. Vestibulum ipsum ligula, sagittis eu, suscipit eu, iaculis quis, ipsum. Duis eu sem. In lobortis volutpat nunc. Aenean imperdiet. Mauris sed eros. Cras vulputate, massa a ullamcorper iaculis, leo lectus pharetra lacus, a hendrerit justo odio sit amet risus.");
        },
        renderHtml : function(h) {
            var ref = 0;
            for (var i = 0; i < this._numLines; i++) {
                if (ref > 9) ref = 0;
                h.push("<p>" + escapeHTML(this._paragraphs[ref]) + "</p>");
                ref++;
            }
        },
        /**
         * The method that actually returns the paragraphs of lorem ipsum....
         * @param numLines Number of lines you want to display
         */
        getLines : function(numLines) {
            var retVal = [];
            var ref = 0;
            for (var i = 0; i < numLines; i++) {
                if (ref > 9) ref = 0;
                retVal.push("<p>" + escapeHTML(this._paragraphs[ref]) + "</p>");
                ref++;
            }
            return retVal.join("");
        }
    });
})();

/**
 * Simple text span but can change or clear its class
 * @param text
 */
function SFSpan(text) {
    this.register();
    this._text = text;
    this._escapeHTML = true;
}

SFSpan.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<span id=\"", this.id, "\"");
            if (this.className) {
                h.push(" class=\"", this.className, "\"");
            }
            h.push(">", (this._escapeHTML ? escapeHTML(this._text) : this._text), "</span>");
        },
        setCSSClass : function(className) {
            this.className = className;
            if ($(this.id)) $(this.id).className = this.className;
        },
        setBold : function(isBold) {
            if ($(this.id)) $(this.id).style.fontWeight = (isBold) ? "bold" : "";
        },
        setItalic : function(isItalic) {
            if ($(this.id)) $(this.id).style.fontStyle = (isItalic) ? "italic" : "";
        },
        setEscapeHtml : function(doEscape) {
            this._escapeHTML = doEscape;
        }
    });
})();

/**
 * Creates a clearing div.
 */
function clearingDiv() {
    this.register();
}
clearingDiv.prototype = (function() {
    set(new Component(), {
        renderHtml : function(h) {
            h.push("<div class=\"clr\">&nbsp;</div>");
        }
    });
})();


/**
 * This is a component that is similar to SFLink, but follows the new JUIC coding standards
 * more closely. Also note that there is no way to pass an href. For JUIC, we dispatch events from
 * the onClick.
 *
 * @param menuType          - This abstracts the CSS class that is employed for the type of menu
 *                            (see structure below)
 * @param displayText       - Display label of the menu item
 * @param actionCommand     - [optional] This is for convenience to avoid making an extra call to setActionCommand
 *                            However, if none is provided nor set, an error will be thrown
 * @param actionData        - [optional] This is also for convenience to avoid making an extra call to setActionData
 *                            However, if none is provided nor set, only "action" will be dispatched.
 *
 * Dispatched events:
 * action (click)           - actionCommand: user-specified / actionData: user-specified
 * action (mouseover)       - actionCommand: mouseover / actionData: this
 * action (mouseout)        - actionCommand: mouseout / actionData: this
 *
 * mouseover and mouseout will be useful for providing cascading menus later on. The dispatched id will provide
 * the sub-popup menu with an originator id.
 */
function SFRolloverMenu(menuType, displayText, actionCommand, actionData) {
    this.register();
    this._init();
    assert(this._menuTypes[menuType], "[SFRolloverMenu] Invalid menu type passed to constructor");
    assert(displayText, "[SFRolloverMenu] A label is required");
    this._menuType = menuType;
    this._displayText = displayText;
    if (actionCommand) this.setActionCommand(actionCommand);
    if (actionData) this.setActionData(actionData);
}

SFRolloverMenu.prototype = (function() {
    return set(new Component(), {
        _init : function() {
            //define the valid menu types and associated CSS classes
            this._menuTypes = {
                "cancel" : "rollmenu_cancel",
                "copy" : "rollmenu_copy",
                "delete" : "rollmenu_delete",
                "document_view" : "rollmenu_document_view",
                "edit" : "rollmenu_edit",
                "edit_dimmed" : "rollmenu_edit_dimmed",
                "submit" : "rollmenu_submit",
                "withdraw" : "rollmenu_withdraw",
                "email" : "rollmenu_email",
                "folder_view" : "rollmenu_folder_view",
                "save" : "rollmenu_save",
                "undo" : "rollmenu_undo",
                "run" : "rollmenu_run",
                "active" : "rollmenu_active",
                "inactive" : "rollmenu_inactive",
                "settings" : "rollmenu_settings",
                "moveup" : "rollmenu_moveup",
                "movedown" : "rollmenu_movedown",
                "person_new" : "rollmenu_person_new",
                "person_exists" : "rollmenu_person_exists",
                "forward" : "rollmenu_forward"
            };
        },
        //sets/resets the actionCommand for the component
        setActionCommand : function(actionCommand) {
            this._actionCommand = actionCommand;
        },
        //sets/resets actionData
        setActionData : function(actionData) {
            this._actionData = actionData;
        },
        //resets the displayText and updates DOM
        setDisplayText : function(displayText) {
            if ($(this.id)) {
                $(this.id + "_link").innerHTML = this._displayText = displayText;
            }
        },
        //resets the icon for the menu item
        setMenuType : function(menuType) {
            assert(this._menuTypes[menuType], "[SFRolloverMenu] Invalid menu type passed to constructor");
            $(this.id + "_link").className = this._menuTypes[menuType];
        },
        renderHtml : function(h) {
            h.push("<div id=\"", this.id, "\">",
                    "<a id=\"", this._id + "_link\" ",
                    "href=\"javascript:void(0);\" ",
                    "class=\"", this._menuTypes[this._menuType], "\" ",
                    "onmouseover=\"", this.fireCode("_mouseover"), ";return false;\" ",
                    "onmouseout=\"", this.fireCode("_mouseout"), ";return false;\" ",
                    "onclick=\"", this.fireCode("_click"), ";return false;\">", this._displayText, "</a></div>");
        },
        _mouseover : function() {
            this.dispatch("action", {actionCommand : "mouseover", actionData : this.id});
        },
        _mouseout : function() {
            this.dispatch("action", {actionCommand : "mouseout", actionData : this.id});
        },
        _click : function() {
            assert(this._actionCommand, "[SFRolloverMenu] You must provide an action command");
            if (this._actionData)
                this.dispatch("action", {actionCommand : this._actionCommand, actionData : this._actionData});
            else
                this.dispatch("action", {actionCommand : this._actionCommand});
        }
    });
})();

/*
 function menuTest() {
 this.register();
 this.init();
 }

 menuTest.prototype = (function() {
 var types = ["cancel","copy","delete","edit","save"];
 var labels = ["Cancel", "Copy", "Delete", "Edit", "Save"];
 return set(new Component(), {
 init : function() {
 var takeAction = new SFContextualMenu("Take Action","arrowDown");
 var reqId = "990";

 var submitNew = new SFRolloverMenu("edit","Submit New Candidate","submitNewCandidate",reqId);
 submitNew.addEventListener("action", this);
 takeAction.addMenuItem(submitNew);

 var submitExisting = new SFRolloverMenu("save","Submit Existing Candidate","submitExistingCandidate",reqId);
 submitExisting.addEventListener("action", this);
 takeAction.addMenuItem(submitExisting);

 var saveJob = new SFRolloverMenu("person_new","Save Job","saveJob",reqId);
 saveJob.addEventListener("action", this);
 takeAction.addMenuItem(saveJob);

 var forward = new SFRolloverMenu("cancel","Forward to a Friend","forwardJob",reqId);
 forward.addEventListener("action", this);
 takeAction.addMenuItem(forward);

 this.cMenu = takeAction;
 },
 renderHtml : function(h) {
 this.cMenu.renderHtml(h);
 },
 handleEvent : function(event) {
 alert(event.actionData);
 }
 });
 })();

 function testRolloverMenu(id) {
 var m = new menuTest();
 m.render(id);
 }
 */

/**
 * SFLabel is the object to create a string.
 * @param value: The string value to display.
 */
function SFLabel(value) {
    this.register();
    this._enabled = true;
    this.setValue(value);
}

SFLabel.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
            this._value = value;
            if ($(this.id)) $(this.id).innerHTML = escapeHTML(this._value);
        },

        getValue : function() {
            return this._value;
        },

        setEnabled : function(enabled) {
            this._enabled = enabled;

            if (!this._enabled && $(this.id))
                $(this.id).className = 'readonly';
            else
                $(this.id).className = '';
        }      ,

        renderHtml: function(h) {
            h.push('<span id="', this.id, '" class="', !this._enabled ? 'readonly' : '', '">', escapeHTML(this._value), '</span>');
        }
    });
})();