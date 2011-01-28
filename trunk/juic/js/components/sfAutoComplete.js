//! include /ui/uicore/js/Util.js
//! include /ui/extlib/yui/js/yahoo/yahoo.js
//! include /ui/extlib/yui/js/dom/dom.js
//! include /ui/extlib/yui/js/event/event.js
//! include /ui/extlib/yui/js/connection/connection.js
//! include /ui/extlib/yui/js/autocomplete/autocomplete.js
//! include /ui/juic/js/components/sfPositionManager.js
//! include /ui/static/js/yui-mods.js
//! include /ui/uicore/css/autocomplete.css
//! include /ui/juic/js/components/sfPositionManager.js

/**
 * The Auto-Complete control provides the front-end logic for text-entry
 * suggestion and completion functionality for tech spec and implimentation
 * details http://confluence.successfactors.com/display/ENG/Common+Components
 *
 * @param findType ::
 *            this describes the find object. currently supports [firstname |
 *            lastname | username | fullname | userTags | department | location |
 *            division ]
 * @param options ::
 *            this will control the display and behavior of the component.
 * @return null
 */
function SFAutoComplete(findType, options) {
    this.register();
    this.init(findType, options);
}
SFAutoComplete.prototype = ( function() {
    function SFAutoCompleteParentDiv(SFACId) {
        this.register();
        this.SFACId = SFACId;
    }

    SFAutoCompleteParentDiv.prototype = ( function() {
        return set(new Component(), {
            renderHtml : function(h) {
                h.push('<div id="', this.id, '" >');
                h.push('<div id="', this.SFACId, '_pdiv" class="yui-ac" style="position:relative;">');
                h.push('</div></div>')
            }
        });
    })();


    return set(
            new Component(),
    {
        // instantiate the component
        init : function(findType, options) {
            assert(findType,
                    "[SFAutoComplete] : Find Type missing in the constructor");
            this.findType = findType;
            this.rendered = false;
            // switch between the find type and then set the type of the
            // component
            switch (this.findType) {
                case "firstname":
                case "lastname":
                case "username":
                case "fullname":
                case "proxy":
                case "fullnameForCountry":
                    this.type = "user";
                    this.URIParams()
                    this.value = {
                        userId : "",
                        userDisplayValue : ""
                    };
                    break;
                default:
                    this.type = "other";
                    this.value = "";
                    break;
            }
            this._options = options;
            this._readOnlyClass = this._options.readOnlyClass || ""
            this._autoCompleteContainer = new SFAutoCompleteParentDiv(this.id);
            // error object
            this._err = new SFInlineError(sfMessageFormat.format(
                    jsSFMessages.COMMON_ERR_DATA_REQUIRED,
                    this._options.label), this._options.maxWidth);
        },
        URIParams : function() {
            switch (this.findType) {
                case "fullname" :
                case"fullnameForCountry":
                    this.URIParamsArr = ["FullName", "FirstName","LastName", "UserName", "Location","Department", "UserId", "MiddleInitial","Count"]
                    break
                case "username":
                    this.URIParamsArr = ["UserName", "FirstName","LastName", "FullName", "Location","Department", "UserId", "MiddleInitial","Count"]
                    break;
                case  "proxy":
                    this.URIParamsArr = ["FullName", "FirstName","LastName", "UserName", "Location","Department", "UserId", "MiddleInitial","Count"]
                    break;
                case "firstname":
                    this.URIParamsArr = ["FirstName", "LastName","UserName", "FullName", "Location","Department", "UserId", "MiddleInitial","Count"]
                    break;
                default:
                    this.URIParamsArr = [ "LastName", "FirstName","UserName", "FullName", "Location","Department", "UserId", "MiddleInitial","Count"]
            }
        },
        cleanup : function() {
            this._autoCompleteContainer.cleanup();
            this.unregister();
        },
        setValue : function(value) {
            this.value = value;
            if ($(this.id)) {
                if (this.type == "user") {
                    this._setInputValue(this.id + "_hidden",
                            this.value.userId);
                    this._setInputValue(this.id,
                            this.value.userDisplayValue);
                    if (this.value.userId) {
                        this._change();
                    }

                } else {
                    // remove the last ','
                    this.value = this.value.trim();
                    this.value = this.value.replace(/\,$/, "");
                    this._setInputValue(this.id, this.value);
                    if (this.value.length) {
                        this._change();
                    }
                }
            }
        },
        getValue : function() {
            if (this.type == "user") {
                if (this._options.writable) {
                    this.value.userId = $(this.id + "_hidden").value;
                    this.value.userDisplayValue = $(this.id).value;
                }
                return this.value.userId;
            } else {
                if (this._options.writable) {
                    this.value = $(this.id).value;
                }
                return this.value;
            }

        },
        getUserObject: function() {
            var userObj = {};
            if (this._selectedObj) {
                for(var item = 0, itemLength = this.URIParamsArr.length; item < itemLength; item ++){
                    userObj[this.URIParamsArr[item]] = this._selectedObj[item]
                }
            } else {
                for(var item = 0, itemLength = this.URIParamsArr.length; item < itemLength; item ++){
                    userObj[this.URIParamsArr[item]] = ""
                }
            }
            return userObj;
        },
        getSelectedObject: function () {
            return  this._selectedObj;
        },
        setSelectedObject: function(selectedObj) {
            this._selectedObj = selectedObj;
        },
        renderHtml : function(h) {
            var dispValue = Util.escapeHTML((this.type == "user" ? this.value ? this.value.userDisplayValue : "" : this.value));

            if (this._options.writable) {
                h.push('<span class="autocompspan" style="position:static"><input style="position:static"');
                h.push(' type="text" id="', this.id, '" name="',
                        this.id, '" onfocus="',
                        this.fireCode("_focus"), '"');
                h.push(' class="autocompinput" onchange="', this
                        .fireCode("_change"), '" onblur="', this
                        .fireCode("_blur"), '" size="',
                        this._options.inputSize, '"');
                h.push(' value="', dispValue, '" />');
                h.push('<input type="hidden" value="', this.value ? this.value.userId : "", '" id="', this.id, '_hidden" name="', this.id, '_hidden" /></span>');
                this._err.renderHtml(h);
                this.rendered = true;
            } else {
                h.push('<span id="', this.id, '_span" class= "',
                        this._readOnlyClass, '">', dispValue,
                        '</span>');
            }
        },
        _setInputValue : function(objId, value) {
            var input = $(objId);
            if (input) {
                if (!value || value.trim().length == 0) {
                    input.value = "";
                } else {
                    input.value = value;
                }
            }
        },
        // display any error mesage
        displayErrorMesage : function(errorText) {
            if (errorText) {
                this._err.setValue(errorText);
                this._err.show();
                return false;
            }
        },
        // validate the object if required also used the display server error mesages
        validate : function() {
            if (this._options.preventSelfValidation) {
                return true;
            }
            var inputValue = this.type == "user" ? $(this.id + "_hidden").value : $(this.id).value;
            if (this._options.required
                    && !(/[^ \t\r\n]/.test(inputValue))) {
                this._err.show();
                return false;
            } else {
                this._err.hide();
                return true;
            }
        },
        _blur : function() {
            this.validate();
            this.dispatch("blur"); // this is for backward
            // compatibility
            this.dispatch('action', {
                actionCommand : 'blur'
            });
        },
        _change : function() {
            if ($(this.id).value === ""){
                this._selectedObj = "";
                if($(this.id+"_hidden"))
                $(this.id+"_hidden").value = ""
            }
            this.validate();
            this.dispatch("change"); // this is for backward
            // compatibility
            this.dispatch('action', {
                actionCommand : 'change'
            });
        },
        // function called after an item is selected and this updates the value of the component
        selectUserCB : function (userIdValue) {
            var userDisplayValue = $(this.id).value; // display name
            this.setValue({
                "userId" : userIdValue,
                "userDisplayValue" : userDisplayValue
            });

            this.validate();
            this.dispatch('action', {
                actionCommand : 'itemSelect',
                actionData : {
                    "userId" : userIdValue,
                    "userDisplayValue" : userDisplayValue
                }
            });
        },
        // function called after an item is selected and this updates the value of the component
        selectCB : function() {
            var userDisplayValue = $(this.id).value; // display name
            this.dispatch('action', {
                actionCommand : 'itemSelect',
                actionData : {
                    "value" : userDisplayValue
                }
            });
        },
        _AutoCompOptions : function() {
            var ACOptions = {};
            var me = this;
            ACOptions.acObject = me;
            if (this.type == "user") {
                ACOptions.selectedUsersElementId = this.id + "_hidden";
            }

            ACOptions.supressAlert = true;
            ACOptions.minQueryLength = 2;
            ACOptions.enableAutoCompFind = true;
            ACOptions.findtype = this.findType;
            ACOptions.textElementId = this.id;
            ACOptions.parentElementId = this.id + "_pdiv";
            ACOptions.v10 = false;
            ACOptions.querry = this._options.querry;
            ACOptions.URIParamsArr = this.URIParamsArr
            for (var acOptions in this._options.autoComplete) {
                if (acOptions) {
                    ACOptions[acOptions] = this._options.autoComplete[acOptions];
                }
            }
            return ACOptions;
        },
        _focus : function() {
            if (this._options.writable) {
                var input = $(this.id);
                //                this._autoCompleteContainer.dispatch("hide");

                var self = this;
                // This is a temporary fix for this object, when used in an object that is lazy loaded, the attributes of the field get lost when rendered again.
                if (this.rendered) {
                    this._autoCompleteContainer.dispatch("hide");
                    SFPositionManager.addEventListener("positionFixed", this);
                    SFPositionManager.show(this._autoCompleteContainer, this.id, {origin:{vertical:"bottom",horizontal:"left"},menu:{vertical:"top",horizontal:"left"}});
                } else {
                    SFPositionManager.moveTo(this._autoCompleteContainer.id, null, this.id)
                }
                input.style.display = '';
                input.focus();
                input.select();
            }
        },
        _createAutoCompObj : function() {
            if (this.rendered) {
                SFPositionManager.removeEventListener("positionFixed", this);
                this.rendered = false;
                if (this.type == "user") {
                    this._autoComplete = new SFAutoCompleteFindUser(this._AutoCompOptions());
                } else {
                    this._autoComplete = new SFAutoCompleteDataList(this._AutoCompOptions());
                }
            }
        },
        handleEvent : function(evt) {
            switch (evt.type) {
                case "positionFixed" :
                    if (arguments[0].positionInfo.fixPoint.origin.originId == this.id) {
                        this._createAutoCompObj();
                    }
                    break;
                default :
                    alert("unknown event!!");
                    break;
            }
        }
    });
})();

/**
 * SFAutoCompleteBase provides all the base level functions to validate the
 * input text field, creates a container for displaying the suggestion list
 * popup, initialize common data source parameters, creates the Yahoo UI Library
 * (YUI) autocompletion widget, and controls the popup's width, height and
 * visibility of the scrollbar.
 *
 * @return null
 */
function SFAutoCompleteBase() {
    this.init(arguments);
}
SFAutoCompleteBase.prototype = ( function() {
    return set(
            new Component(),
    {
        module : "autocomplete", // UpdateServlet module name
        includeInactive : false, // include inactive users in search
        textElementId : null, // input text or textarea field Id
        parentElementId : null, // id of the containing element
        delimChar : "", // delimiter character used for multiple query
        maxResultsDisplayed : 5, // maximum number of results to return
        enableAutoCompFind : true, // provisioning enable autocompletion find flag
        forceSelection : true, // force user to select from suggestion list popup
        dataSource : null, // data source for search
        widget : null, // yui autocomplete widget
        maxItemsNoScrollbar : 10, // don't display scrollbar if less than this #
        width : "", // width of suggestion list popup
        height : "", // height of suggestion list popup
        forceEditable : false, // force input text field to be editable
        submitOnSelect : false, // do form submit when item has been selected from popup
        onItemSelect : null, // JavaScript to execute when onItemSelect event fires
        v10 : true, // version v10, jsMessage exist & use browserDetector instead of Util.browserInfo
        dataSet : null, // default is not using dataset
        adminPage : false, // default is not from admin page.
        groupId : 0, // dynamic group id
        init : function(oConfigs) {
            if (oConfigs.length <= 0)
                return;
            if (typeof oConfigs == "object") {
                for (var sConfig in oConfigs) {
                    if (sConfig) {
                        this[sConfig] = oConfigs[sConfig];
                    }
                }
            }
            this.textElement = $(this.textElementId);
            this.validateTextField(this.textElement);
            this.parentElement = this.parentElementId ? $(this.parentElementId)
                    : this.textElement.parentNode;
            if (this.textElement.value.length > 0) {
                this.textElement.value = Util
                        .unescapeHTML(this.textElement.value);
            }
            this.addAutoCompContainer();
        },
        // validate if the input is of type text box and text area
        validateTextField : function(fldObject) {
            assert(fldObject, "the text field is null");
            assert((fldObject.nodeType == 1),
                    "nodeType is not an element.");
            assert(
                    (fldObject.tagName == "INPUT" || fldObject.tagName == "TEXTAREA"),
                    "element is not an INPUT or TEXTAREA");
        },
        isIE : function() {
            return (this.v10 ? browserDetector.isIE
                    : Util.browserInfo.ie);
        },
        // creates the container div for the autocomplete text box
        addAutoCompContainer : function() {
            // insert div tag for autocompletion popup
            this.divContainer = this.createDivTag(this.parentElement,
                    this.textElement);
        },
        createDivTag : function(parentElem, afterElem) {
            var oElem = document.createElement("div");
            oElem.id = oElem.name = afterElem.id + "_" + "div";
            oElem.className = "autocompcontainer";
            // prevent popup from appearing at the right of text field
            oElem.style.left = "0px";
            parentElem.appendChild(oElem);
            return oElem;
        },
        /**
         * Execute the JavaScript that is specified for the onItemSelect attribute to
         * support the ajax4jsf support tag.
         * @param execJs - JavaScript to be executed
         */
        execOnItemSelectJS : function(execJs) {
            // Gives the client of this widget the opportunity to use function pointers
            // instead of a plain javascript string to eval. Note that if
            // you try to
            // access 'this' directly within the callback, it will be out of
            // scope,
            // so in your callback, you will need to pass the interested
            // object
            // reference as a parameter and access its fields and methods
            // that way.
            if (execJs && typeof execJs == 'function') {
                execJs.apply(null, []);
                return;
            }
            // create an event object if it's missing; otherwise Firefox will bomb if A4J.AJAX.Submit() references event.
            var noEvent = false;
            try {
                if (event == null || event == undefined) {
                    noEvent = true;
                }
            } catch (err) {
                noEvent = true;
            }

            if (noEvent) {
                execJs = "var event=null;" + execJs;
            }
            eval(execJs);
        },
        /**
         * initialize common data source parameters and create the YUI
         * autocompletion widget.
         */
        initDataSourceAndWidget : function() {
            if (this.dataSource == null)
                return;
            this.dataSource.responseStripAfter = "";
            this.dataSource.maxCacheEntries = 90;
            // Normally this is not needed when connection.js is placed
            // before AutoComplete.js which
            // AutoCompleteRenderer does but the different layout.xhtml
            // files may have included
            // AutoComplete.js already so only connection.js will be added
            // by the renderer which
            // will make things out of order. Add this line to correct that
            // potential problem.
            // Keep this even if we remove yui script files from layout just
            // to be safe.
            this.dataSource.connMgr = YAHOO.util.Connect;

            var forceSelection = (this.delimChar == "" && this.forceSelection);
            var delimChar = (this.delimChar == "") ? null
                    : [ this.delimChar ];
            if (this.widget) {
                this.widget = null;
                delete this.widget;
            }
            // create the autocompletion widget
            this.widget = new YAHOO.widget.AutoComplete(this.textElement,
                    this.divContainer, this.dataSource, {
                useIFrame : true,
                useShadow : false,
                queryDelay : 0,
                autoHighlight : true,
                maxResultsDisplayed : this.maxResultsDisplayed,
                delimChar : delimChar,
                includeInactive : this.includeInactive,
                forceSelection : forceSelection,
                typeAhead : false,
                animVert : false,
                allowBrowserAutocomplete : false,
                groupId:this.groupId
            });

            this.widget.autocomp = this;

            // if display field has an initial value, then tell the widget
            // an item has been selected; otherwise, Yahoo widget
            // will clear the field due to foreceSelection when a user
            // clicks inside the field and then outside the field.
            if (this.textElement.value != "") {
                this.widget._bItemSelected = true;
            }

            /**
             * Fired when the AutoComplete instance receives query results from the data
             * source.
             *
             * @event dataReturnEvent
             * @param oWidget {YAHOO.widget.AutoComplete} The AutoComplete instance.
             * @param sQuery {String} The query string.
             * @param aResults {Object[]} Results array.
             */
            this.widget.dataReturnEvent.subscribe(function(type, args) {
                var oWidget = args[0];
                var aResults = args[2];

                if (aResults.length > 0) {
                    var oAutoComp = oWidget.autocomp;

                    // add ... to footer if search exceeds number of
                    // max results displayed
                    oWidget.setFooter("");

                    if (oAutoComp.dataSet == null) {
                        var firstItem = aResults[0];
                        var count = firstItem.Count;
                        if (count > aResults.length) {
                            oWidget
                                    .setFooter("<div class='autocompellipsis'>...</div>");
                        }
                    }

                    var oContainer = oWidget._elContainer;
                    var oContent = oWidget._elContent;

                    // this code here in case we roll back to YUI
                    // 2.2.2
                    if (!oContainer) {
                        oContainer = oWidget._oContainer;
                        oContent = oContainer._oContent;
                    }

                    // set the top offset, must do this here instead of in createDivTag() since find user tag could be inside a <div> that expands
                    // and collapses (when display:none, IE thinks
                    // the height of text field is 0) so doing this
                    // during creation will not work.
                    if (oAutoComp.parentElement == oAutoComp.textElement.parentNode) {
                        var textHt = parseInt(oAutoComp.textElement.offsetHeight);
                        var newHt = oAutoComp.isIE() ? textHt + 2
                                : textHt - 4;
                        oContainer.style.top = newHt + "px";
                    } else {
                        oContainer.style.top = "0px";
                    }

                    // note that we must set width and height explicitely for IE; otherwise the scrollbar may sometimes disappear
                    // on IE (SCM-2057).

                    // set the width, make popup wider when hiding
                    // username since the location and department
                    // takes more room.
                    var wid = 50;
                    if (oAutoComp.dataSet == null
                            && oAutoComp.hideUserName)
                        wid = 70;
                    oContent.style.width = (parseInt(oAutoComp.textElement.offsetWidth) + wid)
                            + "px";

                    // set the height to force a vertical scroll bar
                    // if necessary. By default, the YUI
                    // AutoCompletion widget does not
                    // support scrollbars. It will display all the
                    // matching items all at once. Since we need to
                    // support max results > 30,
                    // we have to implement vertical scrollbars.
                    if (aResults.length >= oAutoComp.maxItemsNoScrollbar) {
                        // don't exceed 280px because the autocompletion field inside formless nomination dialog (or any dialog) will
                        // cause the dialog body to generate a
                        // vertical scrollbar which is not good.
                        // Note that v10 uses smaller fonts than
                        // Ultra.
                        oContent.style.height = oAutoComp.enablePhoto ? "280px"
                                : (oAutoComp.v10 ? "180px"
                                : "230px");
                    }

                    // set the scrollbars
                    if (oAutoComp.isIE()) {
                        // always hide horizontal scrollbar for find user, but for SMART Goal Wizard use auto scroll
                        oContent.style.overflowX = "auto";
                        oContent.style.overflowY = aResults.length >= oAutoComp.maxItemsNoScrollbar ? "auto"
                                : "hidden";
                    } else {
                        // Product Management wants the horizontal scrollbar not to appear for find user, but for FireFox it's not possible
                        // because FireFox does not support
                        // overflowX and overflowY
                        oContent.style.overflow = "auto";
                    }

                    // FireFox puts the horizontal overflow scroll bar on the outside of the element. IE does it differently.
                    // When the content overflows horizontally on
                    // IE, displaying the new horizontal scroll bar
                    // means we can't see
                    // all the content vertically, thus generating a
                    // vertical scroll bar. When only one line is
                    // overflowed
                    // (there's a super tiny vertical scrollbar that
                    // you're supposed to use to view the single
                    // line). Add 20 pixels
                    // for horizontal scrollbar to get rid of this
                    // problem on IE.
                    if (oAutoComp.isIE()
                            && (aResults.length < oAutoComp.maxItemsNoScrollbar)) {
                        var newHt;

                        if (oAutoComp.dataSet != null) {
                            // calculate height only for IE and SMART Goal Wizard
                            var maxHt = (aResults.length * 18) + 20;
                            newHt = Math.min(maxHt,
                                    parseInt(oAutoComp.height));
                        } else {
                            if (oAutoComp.enablePhoto) {
                                //Height is bigger when photo is shown
                                newHt = aResults.length * 26 + 23;
                            } else {
                                // This is for IE and when we are dealing with non-SMART goal wizard
                                // magic number explanation: 23 is
                                // the height of the top padding +
                                // 20 for the horizontal scroll bar
                                // 15 is the height of each item in
                                // v10
                                // 20 is the height of each item in
                                // v11
                                newHt = (aResults.length * (oAutoComp.v10 ? 15
                                        : 20)) + 23;
                            }
                        }

                        if (newHt) {
                            oContent.style.height = newHt + "px";
                        }
                    }
                }
                //Reset the browser for session after the ajax call
                // Needs to be changed to a dispatch after the
                // Session Timeout is refactored to be a JUIC
                // component
                if (typeof (SessionTimeout) != 'undefined') {
                    SessionTimeout.reset();
                }

            }, null, false);

            /**
             * Fired when an item is selected via mouse click, ENTER key, or
             * TAB key.
             *
             * @event itemSelectEvent
             * @param oWidget
             *            {YAHOO.widget.AutoComplete} The AutoComplete
             *            instance.
             * @param oItem
             *            {HTMLElement} The selected &lt;li&gt; element
             *            item.
             * @param oData
             *            {Object} The data returned for the item, either as
             *            an object, or mapped from the schema into an
             *            array.
             */
            this.widget.itemSelectEvent.fire = function(oWidget, oItem,
                                                        oData) {
                // do not change this to use subscribe() due to XI-1620 & XI-1573.
                var oAutoComp = oWidget.autocomp;

                // execute the onItemSelect javascript for ajax4jsf support
                // tag
                if (oAutoComp.onItemSelect != null
                        && oAutoComp.onItemSelect != "") {
                    oAutoComp.execOnItemSelectJS(oAutoComp.onItemSelect);
                }

                // automatically do form submit if necessary
                if (oAutoComp.submitOnSelect) {
                    oAutoComp.textElement.form.submit();
                }
            };

        }
    });
})();

/**
 * This JavaScript class is a subclass AutoCompleteBase. It checks arguments
 * that are specific to find users, sets up the data source needed to find full
 * name or user name, builds the query string for the AJAX request, ensures that
 * the autocompletion field and the hidden field used for form action submit are
 * in sync, and overrides the formatResult() to format the names by highlighting
 * the matching text.
 *
 * @return null
 */
function SFAutoCompleteFindUser() {
    this.create(arguments);
}

/**
 * Add autocomplete functionality to a text field. Use <sfh:autoComplete> to create this JavaScript object.
 * See trunk/example/autocomplete_finduser/home.xhtml for usage examples.
 *
 * @param {string, required} findtype is [firstname | lastname | username | fullname], controls what's display in textElement
 * @param {number, required} hideUserName is the provisioning hide username flag, 1 means to hide username, 0 means show username
 * @param {string, required} textElementId is the element Id of the text field
 * @param {boolean, required} enablePhoto set to true means to display photo next to name, it means the live profile feature is enabled.
 * @param (string, required for multi-queries) delimChar to accept multiple delimited queries, eg. "," or ";"
 * @param (string, optional} addOption directs server to add NO_MANAGER or NO_HR.   addOption can be [addNoMgr | addNoHr].
 * @param {number, optional} maxResultsDisplayed is the number of items to display in pop-up list, if the results
 *                           exceeds this number, user will need to type another letter to narrow the search results,
 *                           the default value is 30.
 * @param {boolean, optional} forceSelection option is used for single query autocompletion only
 * @param {boolean, optional} enableAutoCompFind indicates whether autocompletion is enabled in Provisioning Company Settings
 * @param (string, optional) includeInactive if true, include inactive users in results
 * @param {string, optional} selectedUsersElementId is an text field Id to store the selected username or user Id,
 *                           this is a hidden field that is used for form actions and it can contain a list of usernames
 *                           or user Ids depending on the fetchUserName argument
 * @param (number, optional) fetchUserName set to true means to store username(s) in selectedUsersElementId,
 *                           fetchUserName set to false means to store user Id(s) in selectedUsersElementId
 *
 * i.e. var findUser = new AutoCompleteFindUser( {module:"autocomplete", findtype:"fullname", hideUserName:0,
 *              textElementId:"fullname_display_field_id", enablePhoto:true, enableAutoCompFind: true, delimChar:",",
 *              maxResultsDisplayed:50, forceSelection:true, fetchUserName:true, selectedUsersElementId:"myHiddenFieldId"} );
 */

/**
 * Set any configuration params passed in to override defaults.
 *
 * @param oConfigs -
 *            configuration parameters
 */
SFAutoCompleteFindUser.prototype = ( function() {
    return set(
            new SFAutoCompleteBase(),
    {
        findtype : "fullname", // findtype is fullname or username
        hideUserName : 0, // provisioning hide username flag
        fetchUserName : false, // store username/userId in hidden field
        selectedUsersElementId : null, // field id of where to store username/userId
        enablePhoto : false, // display photo next to name in popup
        minQueryLength : 2, // number of chars to trigger autocompletion
        usernameMap : null, // store initial username/userId
        supressAlert : false, // supress Alert messages.  Let UI handle errors.
        // backup message to use for error message, caller should pass
        // in
        // localized error message to replace this.
        errMsg : "Can not determine username from input, please use autocompletion to select user.",
        unknownNames : null, // Out parameter for unknown names.
        includeExternalUsers : true, // include external users in search
        addOption : null, // add NO_MANAGER or NO_HR.
        setInputAttributes : function() {
            // set attributes for wizard.js - wizSetParentElement(),
            // note that getAttribute() returns a string
            //   if(!this.textElement.getAttribute("findtype")) {
            this.textElement.setAttribute("findtype", this.findtype);
            this.textElement.setAttribute("delimChar", this.delimChar);
            this.textElement.setAttribute("hideUserName", this.hideUserName + "");
            this.textElement.setAttribute("fetchUserName", this.fetchUserName ? "true" : "false");
            // }
        },
        create : function(arguments) {
            if (arguments.length <= 0)
                return;
            this.init(arguments[0]);
            this.checkArguments();
            this.setInputAttributes();
            // if we're trying to find username and provisioning
            // indicates to hide username then ignore autocompletion
            // request
            // or if provisioning setting indicates to disable
            // autocompletion find, then ignore autocompletion request
            if ((this.findtype == "username" && this.hideUserName == 1)
                    || (!this.enableAutoCompFind)) {
                // use the text field event instead one of the autocompletion events cuz autocompletion can be disabled due to provisioning flag.
                YAHOO.util.Event.addListener(this.textElementId,
                        "blur", this.onTextUpdate, this, true);
                // disable text field if autocomplete find is disabled
                // and we're trying to find username and provisioning
                // indicates to hide username
                this.textElement.disabled = (!this.enableAutoCompFind
                        && this.findtype == "username" && this.hideUserName == 1);
                // if page author wants to override provisioning
                // settings and want to force the text field to be
                // editable
                if (this.textElement.disabled && this.forceEditable) {
                    this.textElement.disabled = false;
                }
                return;
            }
            this.setUpAutoComp();
        },
        setUserObject:function(userObj) {
            this.acObject.setSelectedObject(userObj);
        },
        onTextUpdate : function() {
            var id = this.selectedUsersElementId;
            // if selectedUsersElementId is null, then there's no need
            // to set the hidden form action field.
            if (id == null)
                return;
            // if text field is blank, then set hidden form action field
            // to blank also.
            if (this.textElement.value == "") {
                $(id).value = "";

                // if display field and hidden form action field both
                // contain usernames
            } else if (this.findtype == "username"
                    && this.fetchUserName) {
                if (this.delimChar == "") {
                    $(id).value = this.textElement.value; // copy
                    // directly
                    // to hidden
                    // field
                } else {
                    var names = this.textElement.value
                            .split(this.delimChar); // delimChar can be
                    // a semi-colon or
                    // any char
                    $(id).value = names.join(",");
                }
            }
        },
        initUsernameMap : function() {
            this.usernameMap = [];
            if (this.selectedUsersElementId != null) {
                var fullnameOrUsernameList = this.textElement.value;
                var usernameOrUserIdList = $(this.selectedUsersElementId).value;
                if (usernameOrUserIdList != ""
                        && fullnameOrUsernameList != "") {
                    var fullnamesOrUsernames = (this.delimChar == "") ? [ fullnameOrUsernameList ]
                            : fullnameOrUsernameList
                            .split(this.delimChar);
                    var usernamesOrIds = (this.delimChar == "") ? [ usernameOrUserIdList ]
                            : usernameOrUserIdList.split(",");
                    for (var idx = 0; idx < usernamesOrIds.length; idx++) {
                        var hiddenName = usernamesOrIds[idx].trim();
                        if (fullnamesOrUsernames[idx] != null) {
                            var displayName = fullnamesOrUsernames[idx]
                                    .trim();
                            this.usernameMap[displayName] = hiddenName;
                        }
                    }
                }
            }
        },
        setUpAutoComp : function() {
            var uri = "/jsup";
            // create datasource, the first result item gets displayed
            // in the autocompletion text field.
            var uriParams = ["ResultSet.Result"]
            uriParams = uriParams.concat(this.URIParamsArr)

            this.dataSource = new YAHOO.widget.DS_XHR(uri, uriParams);

            var query = [];
            query.push("m=", this.module);
            query.push("&findtype=", this.findtype);
            query.push("&maxresults=", this.maxResultsDisplayed);
            query.push("&hideusername=", this.hideUserName);
            query.push("&includeInactive=", this.includeInactive);
            query.push("&includeExternalUsers=", this.includeExternalUsers);
            query.push("&adminPage=", this.adminPage);
            query.push("&groupId=", this.groupId); // passing the group id parameter.
            /* key value pairs set in 'params' attribute while creating SFAutoComplete object
             * is sent as parameter in Auto Complete URL*/
            if(this.params){
              for (var key in this.params){
                var value = this.params[key];
                if(value){
                  query.push("&"+key+"=",value);
                }
              }
            }
            if (this.addOption) {
                query.push("&addOption=", this.addOption);
            }
            this.dataSource.scriptQueryAppend = query.join("");
            this.dataSource.responseType = YAHOO.widget.DS_XHR.TYPE_JSON;

            this.initDataSourceAndWidget();
            this.widget.minQueryLength = this.minQueryLength;

            this.initUsernameMap();

            /**
             * Fired when an item is selected via mouse click, ENTER
             * key, or TAB key.
             *
             * @event itemSelectEvent
             * @param oWidget
             *            {YAHOO.widget.AutoComplete} The AutoComplete
             *            instance.
             * @param oItem
             *            {HTMLElement} The selected &lt;li&gt; element
             *            item.
             * @param oData
             *            {Object} The data returned for the item,
             *            either as an object, or mapped from the schema
             *            into an array.
             */
            this.widget.itemSelectEvent.fire = function(oWidget, oItem,
                                                        oData) {
                // do not change this to use subscribe() due to XI-1620 & XI-1573. The base class and subclass will both subscribe to
                // the event and the 2 event handlers will execute. This
                // can be
                // prevented by placing the subscribe() in a function
                // that
                // subclass can override; but even after doing that, the
                // Notes
                // in Ultra Employee Files will generated exceptions
                // listed in
                // XI-1573.
                var oAutoComp = oWidget.autocomp;

                oAutoComp.setUserObject(oItem._oResultData);

                if (oAutoComp.selectedUsersElementId != null) {
                    // save the username or userId for later retrieval, note that at any time user can select a name and do backspace to delete it,
                    // that's why we have to wait until the onblur event to set the hidden form action field
                    var key = oItem._oResultData[0];
                    oAutoComp.usernameMap[key] = oAutoComp.fetchUserName ? (oAutoComp.findtype == "fullname" ? oItem._oResultData[3]
                            : oItem._oResultData[0])
                            : oItem._oResultData[6];

                    if (oAutoComp.delimChar == "") {
                        $(oAutoComp.selectedUsersElementId).value = oAutoComp.usernameMap[key];
                    }
                }

                // execute the onItemSelect javascript for ajax4jsf support tag
                oAutoComp.widget.textboxBlurEvent.fire(oAutoComp.widget);
                oAutoComp.acObject.selectUserCB(oAutoComp.usernameMap[key]);

                // automatically do form submit if necessary
                if (oAutoComp.submitOnSelect) {
                    oAutoComp.widget.textboxBlurEvent.fire(oAutoComp.widget);
                    oAutoComp.textElement.form.submit();
                }
            };

            /**
             * Fired when the input field loses focus.
             *
             * @event textboxBlurEvent
             * @param oWidget
             *            {YAHOO.widget.AutoComplete} The AutoComplete
             *            instance.
             */

            this.widget.textboxBlurEvent.subscribe(
                    function(type, args) {
                        var oWidget = args[0];
                        var oAutoComp = oWidget.autocomp;
                        if (oAutoComp.selectedUsersElementId == null)
                            return;

                        oAutoComp.unknownNames = [];
                        if (oAutoComp.textElement.value == "") {
                            $(oAutoComp.selectedUsersElementId).value = "";
                        } else {
                            // also need to check single query in case user cleared the field using backspace or deleted a few characters from the name.
                            // we stored the username/userId in
                            // the usernameMap earlier
                            // during autocompletion so retrieve
                            // the values from
                            // usernameMap if it exists
                            var names = [];
                            if (oAutoComp.delimChar == "") {
                                names[0] = oAutoComp.textElement.value;
                            } else {
                                names = oAutoComp.textElement.value
                                        .split(oAutoComp.delimChar);
                            }
                            var usernamesOrIds = [];
                            for (var idx = 0; idx < names.length; idx++) {
                                var name = names[idx].trim();
                                if (name == "")
                                    continue;
                                if (oAutoComp.usernameMap[name] != undefined) {
                                    usernamesOrIds
                                            .push(oAutoComp.usernameMap[name]);
                                } else {
                                    oAutoComp.unknownNames
                                            .push(name);
                                }
                            }
                            $(oAutoComp.selectedUsersElementId).value = (oAutoComp.delimChar == "") ? usernamesOrIds
                                    .join("")
                                    : usernamesOrIds.join(",");
                        }

                        //alert("textboxBlurEvent, hidden field id="+oAutoComp.selectedUsersElementId+", value="+$(oAutoComp.selectedUsersElementId).value);
                        if (oAutoComp.unknownNames.length > 0) {
                            if (oAutoComp.findtype == "username"
                                    && oAutoComp.fetchUserName) {
                                // let username fields get a free pass, allow user to type in short username without selecting an item in popup
                                oWidget._bItemSelected = true;
                                if (oAutoComp.delimChar == "") {
                                    $(oAutoComp.selectedUsersElementId).value = oAutoComp.textElement.value; // copy
                                    // directly
                                    // to
                                    // hidden
                                    // field
                                } else {
                                    var names = oAutoComp.textElement.value
                                            .split(oAutoComp.delimChar); // delimChar
                                    // can
                                    // be a
                                    // semi-colon
                                    $(oAutoComp.selectedUsersElementId).value = names
                                            .join(",");
                                }
                            } else if (!oAutoComp.supressAlert) {
                                if (oAutoComp.v10
                                        && jsMessages
                                        && jsMessages.AUTOCOMP_FINDUSER_ERR) {
                                    alert(jsMessages.AUTOCOMP_FINDUSER_ERR);
                                } else {
                                    alert(oAutoComp.errMsg);
                                }
                            }
                        }
                    }, null, false);

            this.widget.doBeforeExpandContainer = function(o_textBox,
                                                           o_container, o_sQuery, o_Results) {
                if (o_Results) {
                    for (var i = 0; i < o_Results.length; i++) {
                        if (o_Results[i]) {
                            for (var j = 0; j < o_Results[i].length - 1; j++) {
                                if (o_Results[i][j]) {
                                    o_Results[i][j] = Util
                                            .unescapeHTML(o_Results[i][j]);
                                }
                            }
                        }
                    }
                }
                if (this._aListItems) {
                    for (var i = 0; i < this._aListItems.length; i++) {
                        if (this._aListItems[i]._sResultKey) {
                            this._aListItems[i]._sResultKey = Util
                                    .unescapeHTML(this._aListItems[i]._sResultKey);
                        }
                    }
                }
                return true;
            };

            /**
             * Overridable method that converts a result item object
             * into HTML markup for display. Return data values are
             * accessible via the oResultItem object, and the key return
             * value will always be oResultItem[0]. Markup will be
             * displayed within &lt;li&gt; element tags in the
             * container.
             *
             * @method formatResult
             * @param oResultItem
             *            {Object} Result item representing one query
             *            result. Data is held in an array.
             * @param sQuery
             *            {String} The current query string.
             * @return {String} HTML markup of formatted result data.
             */
            this.widget.formatResult = function(oResultItem, sQuery) {
                var replaceExp = null, usernameExp = null;
                var sMarkUp = oResultItem[0];
                // if query text contains no space nor comma, such as
                // "john"
                if (sQuery.indexOf(" ") == -1
                        && sQuery.indexOf(",") == -1) {
                    replaceExp = new RegExp("(\\b" + sQuery + ")", "gi");
                    usernameExp = new RegExp("(^" + sQuery + ")", "i");
                } else { // query text can be "john smith" or "Smith, John"
                    // take care of any trailing spaces, for example "NA
                    // "
                    sQuery = sQuery.replace(/\s*$/g, '');
                    var nameArr = (sQuery.indexOf(",") != -1) ? (sQuery
                            .indexOf(", ") != -1 ? sQuery.split(", ")
                            : sQuery.split(",")) : sQuery.split(" ");
                    if (nameArr.length > 0) {
                        var pattern = (nameArr.length == 1) ? nameArr[0]
                                : ("(" + nameArr[0] + "|" + nameArr[1] + ")");
                        replaceExp = new RegExp("(\\b" + pattern + ")",
                                "gi"); // eg.
                        // /(\b(john|smith))/gi
                    }
                }
                if (replaceExp != null)
                    sMarkUp = sMarkUp.replace(replaceExp, "<b>$1</b>");

                var tdTags = "&nbsp;&nbsp;<span style='white-space:nowrap;color:#999;'>(";
                // if username needs to be hidden, then display First
                // Name
                // (Location, Department)
                if (this.autocomp.hideUserName == 1) {
                    var demographic = [];
                    if (oResultItem[4] != "" || oResultItem[5] != "") {
                        demographic.push(tdTags);
                        if (oResultItem[4] != "") {
                            demographic.push(oResultItem[4]);
                            if (oResultItem[5] != "")
                                demographic.push(", ");
                        }
                        if (oResultItem[5] != "") {
                            demographic.push(oResultItem[5]);
                        }
                    }
                    sMarkUp += demographic.join("");
                } else { // no need to hide username
                    var othername = (this.autocomp.findtype == "fullname") ? ((usernameExp != null) ? oResultItem[3]
                            .replace(usernameExp, "<b>$1</b>")
                            : oResultItem[3])
                            : ((replaceExp != null) ? oResultItem[3]
                            .replace(replaceExp, "<b>$1</b>")
                            : oResultItem[3]);
                    sMarkUp += (tdTags + othername);
                }
                sMarkUp += ")</span>";
                var sPrefix = "<div style='text-align:left;'>";
                if (this.autocomp.enablePhoto) {
                    return sPrefix
                            + "<span style='white-space:nowrap;height:24px;padding:0px;margin:0px;'><img style='height:24px;width:24px;z-index:99;vertical-align:middle;' src='/localpicture?ps_p_action=show&amp;ps_p_uid="
                            + encodeURIComponent(oResultItem[6])
                            + "&amp;p_type=ps_orgchart&amp;_s.crb=" + ajaxSecKey + "'></img>"
                            + sMarkUp + "</span></div>";
                } else {
                    return sPrefix + sMarkUp + "</div>";
                }
            };
        },
        checkArguments : function() {
            if (!this.supressAlert) {
                assert(
                        (typeof this.findtype == "string" && (this.findtype == "username"
                                || this.findtype == "fullname"
                                || this.findtype == "firstname" || this.findtype == "lastname")),
                        ("invalid argument for SFAutoCompleteFindUser(), findtype is not [firstname | lastname | username | fullname]"));
                assert(
                        (typeof this.hideUserName == "number" && (this.hideUserName == 0 || this.hideUserName == 1)),
                        "invalid argument for SFAutoCompleteFindUser(), hideUserName is not [0 | 1]");
                assert(
                        (typeof this.fetchUserName == "boolean"),
                        "invalid argument for SFAutoCompleteFindUser(), fetchUserName is not [true | false]");
                if (this.selectedUsersElementId != null) {
                    this.validateTextField($(this.selectedUsersElementId));
                }
            }
        }
    });
})();
/**
 * Autocompletion to find words in a data set. This class is used specifically
 * for finding words in a goal library for the SMART goal wizard. If you need to
 * use other data sets, subclass this class and override the
 * populateDataSetArray and getMatches methods.
 *
 * @param {string,
        *            required} dataSet is a JSON formatted string to search from, or
 *            the string "staticGoalLibrary"
 * @param {string,
        *            required} textElementId is the element Id of the text field
 * @param (string,
 *            required for multi-queries) delimChar to accept multiple delimited
 *            queries, eg. "," or ";"
 * @param {number,
        *            optional} maxResultsDisplayed is the number of items to display in
 *            pop-up list, if the results exceeds this number, user will need to
 *            type another letter to narrow the search results, the default
 *            value is 30.
 * @param {boolean,
        *            optional} forceSelection option is used for single query
 *            autocompletion only
 * @param {boolean,
        *            optional} enableAutoCompFind indicates whether autocompletion is
 *            enabled in Provisioning Company Settings
 *
 * eg. new AutoCompDataSet({dataSet: 'staticGoalLibrary',
 * textElementId:'autocompletion_id', enableAutoCompFind:true,
 * forceSelection:true});
 */
function SFAutoCompleteDataList() {
    this.create(arguments);
}
SFAutoCompleteDataList.prototype = ( function() {
    return set(
            new SFAutoCompleteBase(),
    {
        errMsg: "Can not determine tag from input, please use autocompletion to select tag.",
        create: function(oConfigs) {
            if (oConfigs.length <= 0)
                return;
            this.init(oConfigs[0]);

            YAHOO.util.Event.addListener(this.textElementId, "change",
                    this.onTextUpdate, this, true);
            var query = [];
            query.push("m=", this.module);
            query.push("&findtype=", this.findtype);
            query.push("&maxresults=", this.maxResultsDisplayed);

            this.query = oConfigs[0].querry ? oConfigs[0].querry : query.join("");
            this.setUpAutoComp();
        },
        onTextUpdate: function() {

            // if text field is blank, then set hidden form action field to blank also.
            if (this.textElement.value != "") {
                return;
            }
            var oAutoComp = this.widget.autocomp;
            if (oAutoComp.onItemSelect != null && oAutoComp.onItemSelect != "") {
                // oAutoComp.execOnItemSelectJS(oAutoComp.onItemSelect);
                this.acObject.selectCB();
            }
        },
        setSelectedObject: function(selectedObject)
        {
            this.acObject.setSelectedObject(selectedObject);
        },
        setUpAutoComp: function() {
            if (!this.enableAutoCompFind)
                return;

            var uri = "/jsup";
            // create datasource, the first result item gets displayed in
            // the autocompletion text field.
            this.dataSource = new YAHOO.widget.DS_XHR(uri, [
                "ResultSet.Result", "name" ]);


            this.dataSource.scriptQueryAppend = this.query;
            this.dataSource.responseType = YAHOO.widget.DS_XHR.TYPE_JSON;

            this.initDataSourceAndWidget();
            this.widget.minQueryLength = this.minQueryLength;

            /**
             * Fired when an item is selected via mouse click, ENTER key, or
             * TAB key.
             *
             * @event itemSelectEvent
             * @param oWidget
             *            {YAHOO.widget.AutoComplete} The AutoComplete
             *            instance.
             * @param oItem
             *            {HTMLElement} The selected &lt;li&gt; element
             *            item.
             * @param oData
             *            {Object} The data returned for the item, either as
             *            an object, or mapped from the schema into an
             *            array.
             */
            this.widget.itemSelectEvent.fire = function(oWidget, oItem,
                                                        oData) {
                var oAutoComp = oWidget.autocomp;

                oAutoComp.setSelectedObject(oItem._oResultData[1]);

                // execute the onItemSelect javascript for ajax4jsf support
                // tag
                oAutoComp.acObject.selectCB();

                // automatically do form submit if necessary
                if (oAutoComp.submitOnSelect) {
                    oAutoComp.widget.textboxBlurEvent
                            .fire(oAutoComp.widget);
                    oAutoComp.textElement.form.submit();
                }
            };

            // format the result for the autocomplete pop-up
            this.widget.formatResult = function(oResultItem, sQuery) {
                //this.autocomp.setWidth();
                // alert(oResultItem+", "+oResultItem[0]+",
                // "+oResultItem[1]);
                return Util.escapeHTML(oResultItem[0] ? oResultItem[0]
                        : oResultItem);
            };

        }
    });
})();
YAHOO.widget.AutoComplete.prototype._iFrameSrc = "/ui/uicore/img/_old.gif";

function SFInlineError(errorText, maxwidth) {
    this.register();
    this.init(errorText, maxwidth);
}
SFInlineError.prototype = ( function() {
    return set(
            new Component(),
    {
        init : function(errorText, maxwidth) {
            this._errorText = errorText ? errorText : "";
            this._maxwidth = maxwidth ? maxwidth : "auto";
        },
        // Hides the error message
        hide : function() {
            var el = $(this.id);
            el.style.display = 'none';
        },

        // Renders the component
        renderHtml : function(h) {
            h.push(
                    '<div id="',
                    this.id,
                    '" style="display:none;width:',
                    this.maxWidth,
                    '"><img src="'+IMAGES["/ui/uicore/img/icon_error.gif"] +'" class="nudge-down" style="float:left;" />');
            h.push(
                    '<div id="',
                    this.id,
                    '_error" style="color:#ff0000;padding-left:20px;">',
                    Util.escapeHTML(this._errorText),
                    '</div><div style="clear:both;"></div></div>');
        },
        // Sets new notification message
        setValue : function(errorText) {
            this._errorText = errorText ? errorText : "";
            var el = $(this.id + "_error");
            if(el){
            el.innerHTML = Util.escapeHTML(this._errorText);
            }

        },
        getValue : function() {
            return this._errorText;
        },
        // Shows the erroe message:
        show : function() {
            var el = $(this.id);
            el.style.display = 'block';
        }
    });
})();
