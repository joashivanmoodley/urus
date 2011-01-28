//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfFormLayout.js
//! include /ui/juic/js/components/SFFormElements.js
//! include /ui/juic/js/components/sfSysMsg.js
//! include /ui/extlib/yui/css/container/container.css

//! include /ui/uicore/css/components/sfLoading.css
/**
 * This is the main, outer dialog controller component that will house the file upload component.
 * Also acts as a marshalling interface for events coming from constituent objects.
 * Note that this is being built to purely satisfy the business requirement, and not be generalized
 * dialog component.
 *
 * @param name        Name of the seam controller to route the request
 * @param isTextFile  Is this a text stream file
 * @param maxFiles    Number of files to upload
 * @param urlParams   JSON - extra params to go on the URL
 * @param dialogTitle Displayed title of dialog box
 * @param width       Width of the dialog
 * @param height      height of the dialog
 */

function getMessagesObject() {
    if (typeof jsSFMessages != "undefined") {
        return jsSFMessages;
    } else {
        if (typeof jsMessages != "undefined")
            return jsMessages;
    }
}

function SFFileUploadDialog(name         /*string*/,
                            isTextFile   /*boolean*/,
                            maxFiles     /*integer*/,
                            urlParams    /*object*/,
                            dialogTitle  /*string*/,
                            width        /*integer*/,
                            height       /*integer*/,
                            instructions /*string*/) {

    this._sfMsgs = getMessagesObject();
    this.register();
    this._name = name;
    this._isTextFile = isTextFile;
    this._maxFiles = maxFiles;
    this._urlParams = urlParams;
    this._titleText = dialogTitle;
    this._width = (width) ? width : 550;
    this._height = (height) ? height : 300;
    if (instructions) this._instructions = instructions;

    //Instantiate the coponents we'll need
    this._uploadButton = new SFModalDlgBtn(this._sfMsgs.COMMON_Upload, "uploadBegin", "active");
    this._closeButton = new SFModalDlgBtn(this._sfMsgs.COMMON_Cancel, "cancelEvent");
    if (this._instructions)
        this._fileUpload = new SFFileUpload(this._name, this._maxFiles, this._isTextFile, this._urlParams, this._instructions);
    else
        this._fileUpload = new SFFileUpload(this._name, this._maxFiles, this._isTextFile, this._urlParams);

    //Listen for events
    this._uploadButton.addEventListener("uploadBegin", this);
    this._closeButton.addEventListener("cancelEvent", this);
    this._fileUpload.addEventListener("uploadProceed", this);
    this._fileUpload.addEventListener("uploadSucceeded", this);
    this._fileUpload.addEventListener("uploadFailed", this);
    this._fileUpload.addEventListener("wrongFile", this);
}

SFFileUploadDialog.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {

            h.push("<div id=\"" + this.id + "\" style=\"display: block; visibility: inherit; width: " + this._width + "px; height: " + this._height + "px;\" class=\"yui-module yui-overlay yui-panel modal_dlg\">" +
                   "<div class=\"hd\" style=\"cursor: auto;\">" +
                   "<div class=\"tl\"></div>" +
                   "<span>" + this._titleText + "</span>" +
                   "<div class=\"tr\"></div>" +
                   "</div>" +
                   "<div class=\"bd\" style=\"height:" + (this._height - 68) + "px;\">" +
                   "<div class=\"innerbd\">");
            this._fileUpload.renderHtml(h);
            h.push("</div></div>" +
                   "<div class=\"ft\" style=\"width:100%\">" +
                   "<div class=\"bl\"></div>" +
                   "<div class=\"button_row\">" +
                   "<div id=\"button_bar_" + this.id + "\" class=\"right\" style=\padding-right:.5em;\">");
            this._uploadButton.renderHtml(h);
            this._closeButton.renderHtml(h);
            h.push("</div></div>" +
                   "<div class=\"br\"></div></div>" +
                   "<span id=\"dlg_close_x\" onclick=\"" + this.fireCode("cancel") + "\" class=\"container-close\"></span>" +
                   "</div>");
        },
        //Handle the "X" at the top right
        cancel : function() {
            if (!this._uploadInProgress) {
                this._fileUpload.cleanup();
                this.dispatch("hide");
            }
        },
        handleEvent : function(evt) {
            switch (evt.type) {
                case "cancelEvent" :
                    this._fileUpload.cleanup();
                    this.dispatch("hide");
                    break;
                case "uploadBegin" :
                    this._fileUpload.checkFields();
                    break;
                case "uploadProceed" :
                    this._uploadInProgress = true;
                    this._uploadButton.disable();
                    this._closeButton.disable();
                    this._fileUpload.doUpload();
                    break;
                case "uploadSucceeded" :
                    this._uploadInProgress = false;
                    this._uploadButton.enable();
                    this._closeButton.enable();
                    this._fileUpload.cleanup();
                    this.dispatch("uploadSucceeded", {response : evt.response});
                    break;
                case "uploadFailed" :
                    this._uploadInProgress = false;
                    this._uploadButton.enable();
                    this._closeButton.enable();
                    this._fileUpload.cleanup();
                    this.dispatch("uploadFailed", {response : evt.response});
                    break;
                case "wrongFile":
                    this._uploadInProgress = false;
                    this._uploadButton.enable();
                    this._closeButton.enable();
                	this._fileUpload.cleanup();
                    break;
            }
        }
    })
})();


/**
 * Simple composite component that uses SFInputFormLayout to create a form with
 * file input fields, and an optional encoding field
 *
 * @param name          Name of seam controller that to which the upload servlet will route.
 * @param numFields     Number of file inputs to display
 * @param isTextFile    Is this a text stream?
 * @param urlParamsObj  Object with name/value pairs for querystring params to be put on the URL at post
 * @param instructions  Instructions to display
 * @param config        Addtional config, {multiUploadMode:false, - indicates if multiple uploads are allowed. Defaults to only one.
 *                                         }
 */
function SFFileUpload(name /* string */,
                      maxFields /*integer*/,
                      isTextFile /*boolean*/,
                      urlParamsObj /* JSON */,
                      instructions,
                      config) {


    this._sfMsgs = getMessagesObject();
    this.register();
    this._name = name;
    this._fieldCount = maxFields;
    this._isTextFile = isTextFile;
    this._formLayout = new SFInputFormLayout();
    this._formFields = [];
    this._urlParamsObj = urlParamsObj;
    if (instructions)
        this._instructions = instructions;
    this.config = config;
    this.init();
}

SFFileUpload.prototype = (function() {
    return set(new Component(), {
        //This will instantiate this._fieldCount input fields and if it's a text file
        //will also instantiate an encoding select box and create a hidden iframe
        init : function() {
            this._fileInputs = [];
            for (var idx = 1; idx <= this._fieldCount; ++idx) {
                var lbl = this._sfMsgs.COMMON_Choose_File + ((this._fieldCount == 1) ? ":" : " " + idx + ":");
                this._formFields.push(new SFFileInput(idx));
                this._formLayout.addField(lbl, this._formFields[idx - 1]);
            }
            if (this._isTextFile) {
                this._formFields.push(new SFSingleSelect('', this._getEncodingOptions(), 'encoding1'));
                this._formLayout.addField(this._sfMsgs.COMMON_File_Encoding, this._formFields[idx - 1]);
            }

        },
        checkFields : function() {
            var fldsOk = this._formLayout.fieldsOk();
            if (fldsOk) {
                this.dispatch("uploadProceed");
            } else {
                this.setErrorMessage(this._sfMsgs.COMMON_Choose_File_Error);
            }

        },
        //Gets encoding values from localized source.
        _getEncodingOptions : function() {
            return [
                {
                    key : this._sfMsgs.COMMON_ISO_8859_1,
                    value : "ISO-8859-1"
                },
                {
                    key : this._sfMsgs.COMMON_UTF_8,
                    value : "UTF-8"
                },
                {
                    key : this._sfMsgs.COMMON_EUC_KR,
                    value : "EUC-KR"
                },
                {
                    key : this._sfMsgs.COMMON_GB2312,
                    value : "GB2312"
                },
                {
                    key : this._sfMsgs.COMMON_HZ,
                    value : "HZ"
                },
                {
                    key : this._sfMsgs.COMMON_Big5,
                    value : "Big5"
                },
                {
                    key : this._sfMsgs.COMMON_EUC_TW,
                    value : "EUC-TW"
                },
                {
                    key : this._sfMsgs.COMMON_EUC_JP,
                    value : "EUC-JP"
                },
                {
                    key : this._sfMsgs.COMMON_Shift_JIS,
                    value : "Shift-JIS"
                }
            ]
        },
        renderHtml : function(h) {
            h.push("<div id=\"msgDiv_" + this.id + "\"></div>");
            h.push("<div id=\"" + this.id + "\"><form id=\"form_" + this.id + "\">");
            if (this._instructions) {
                h.push("<div style=\"margin-bottom:10px;\"><em class=\"instructions\">" + this._instructions + "</em></div>");
            }
            this._formLayout.renderHtml(h);
            h.push("</form></div>");
            //h.push("<a href=\"#\" onclick=\"" + this.fireCode("msgHandler") + "\">click me</a>");
        },
        /*
         msgHandler : function() {
         var msg = new SFSysMsg("Test Message","asdflaksdf","error");
         this.setMessage(msg);
         },
         */
        //Create the iframe we're going to post into
        _createPostingFrame : function() {
            //only create if it doesn't exist
            if ($("iframe" + this.id)) return;
            var ifrm = document.createElement("iframe");
            var nmId = "iframe_" + this.id;
            ifrm.setAttribute("id", nmId);
            ifrm.setAttribute("name", nmId);
            ifrm.setAttribute("src", "/ui/uicore/img/_old.gif");

            set(ifrm.style, {
                display : "none",
                top : "0px",
                left : "0px"
            });
            var thisForm = $("form_" + this.id);
            thisForm.appendChild(ifrm);
            window.frames[nmId].name = nmId;
        },
        _removePostingFrame : function() {
            var frm = $("form_" + this.id);
            var ifrm = $("iframe_" + this.id);
            if (ifrm) {
                ifrm.src = "/ui/uicore/img/_old.gif";
                frm.removeChild(ifrm);
            }
        },
        //Converts JSON into QueryString
        _getQueryString : function(urlParamsObj) {
            var retVal = "";
            for (var key in urlParamsObj) {
                retVal += encodeURIComponent(key) + "=" + encodeURIComponent(urlParamsObj[key]) + "&";
            }
            return retVal.substring(0, (retVal.length - 1));
        },
        //Sets the message at the top of the component
        setMessage : function(msg) {
            if ($("msgDiv_" + this.id)) {
                if (typeof msg == "object")
                    msg.render("msgDiv_" + this.id);
                else
                    $("msgDiv_" + this.id).innerHTML = escapeHTML(msg);
            }
        },
        clearMessage : function() {
            $("msgDiv_" + this.id).innerHTML = "";
        },
        //This is the heart of the upload process
        //Sets up all the parameters to pass on the URL
        //Sets up the form properties as well.
        doUpload : function() {
            //create the iframe
            this._createPostingFrame();
            //Get a pointer to the form
            var queryString = this._getQueryString(this._urlParamsObj);
            this.setFormAttributes({
                "action" : "/upload?name=" + this._name +
                           "&componentId=" + this.id +
                           "&responseHandler=handleResponse&" +
                           "&_s.crb=" + ajaxSecKey + "&" +
                           queryString,
                "target" : "iframe_" + this.id,
                "method" : "POST",
                "enctype" : "multipart/form-data",
                "encoding" : "multipart/form-data"
            });
            this._submitForm();
        },
        _enableformItems : function(state) {
            for (var fileInputIndex = 0, fileInputLength = this._formFields.length; fileInputIndex < fileInputLength; fileInputIndex++) {
                this._formFields[fileInputIndex].setEnabled(state);
            }
        },
        _getForm : function() {
            return $("form_" + this.id);
        },
        setFormAttributes : function(attribObj) {
            var frm = this._getForm();
            for (var key in attribObj) {
                frm.setAttribute(key, attribObj[key]);
            }
        },
        _submitForm : function() {
            try {
                this._getForm().submit();
                this._enableformItems(false);
                this.setLoadingMessage();
            } catch(e) {
                this.dispatch("wrongFile");
                this.setErrorMessage(jsSFMessages.COMMON_Choose_File_Error);
            }
        },
        handleResponse : function(responseObj) {
            this.clearMessage();
            var success = responseObj.success;
            var msg = responseObj.message;
            var responseType;
            if (success) {
                responseType = "uploadSucceeded";
                //renabled if multiuploadmode is on.
                if (this.config && this.config.multiUploadMode && this.config.multiUploadMode == true) {
                    this._enableformItems(true);
                }
                this.setInfoMessage(msg);
            } else {
                responseType = "uploadFailed";
                this._enableformItems(true);
                this.setErrorMessage(msg);
            }
            this.dispatch(responseType, {response : responseObj});


        },
        setLoadingMessage : function() {
            if (!this._uploadMsg)
                this._uploadMsg = new SFSimpleLoading("Uploading...", "#333");
            this.setMessage(this._uploadMsg);
        },
        setErrorMessage : function(msg) {
            this.setMessage(new SFSysMsg("error", msg));
        },
        setInfoMessage : function(msg) {
            this.setMessage(new SFSysMsg("info", msg));
        },
        //Necessary step to remove the iframe from the body when the component
        //is destroyed.
        cleanup : function() {
            this._removePostingFrame();
        }
    })
})();


/**
 * Components
 */





/**
 * This component is specific to modal dlg, but can probably be used elsewhere.
 * It creates an XI-styled modal dialog button
 * @param actionText
 * @param eventName
 */
function SFModalDlgBtn(actionText /* string */,
                       eventName /* string */,
                       buttonType /* string */,
                       floatRight /* boolean */) {
    this.register();
    this._actionText = actionText;
    this._eventName = eventName;
    this._floatRight = floatRight;
    this._orgButtonType = buttonType;
    this.setButtonType(buttonType);
}

SFModalDlgBtn.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            if (this._floatRight) {
                h.push("<div class=\"button_row\"><div class=\"right\">");
            }
            h.push(
                    "<span id=\"btnWrapper_" + this.id + "\" class=\"" + this.getButtonType() + "\">" +
                    "<span><button id=\"dlgButton_" + this.id + "\" onclick=\"" + this.fireCode("sendEvent") + "\" type=\"button\" id=\"modalDlgBtn_" + this.id + "\">" + this._actionText + "</button></span>" +
                    "</span>"
                    );
            if (this._floatRight) {
                h.push("</div></div>");
            }
        },
        //possible values - active, normal, null, disabled
        setButtonType : function(btnType) {
            this._buttonType = "aquabtn" + ((!btnType) ? "" : " " + btnType);
        },
        getButtonType : function() {
            return this._buttonType;
        },
        sendEvent : function() {
            this.dispatch(this._eventName);
        },
        disable : function() {
            this._prevButtonType = this.getButtonType();
            this._buttonType = "aquabtn disabled";
            var btnWrapper = $("btnWrapper_" + this.id);
            btnWrapper.className = this._buttonType;

            var btn = $("dlgButton_" + this.id);
            btn.disabled = true;
        },
        enable : function() {
            var btn = $("dlgButton_" + this.id);
            btn.disabled = false;
            this._buttonType = "aquabtn active";
            var btnWrapper = $("btnWrapper_" + this.id);
            btnWrapper.className = this._buttonType;
        }

    })
})();


function SFSimpleLoading(initMsg, hexColor) {
    this.register();
    this._hexColor = (hexColor) ? hexColor : "#FFF";
    //if there's a different message you want to use, then
    //set the message to initMsg, otherwise just use the COMMON_loading message
    this.setMsg((initMsg) ? initMsg : jsSFMessages.COMMON_loading);
}

SFSimpleLoading.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<div id=\"" + this.id + "\" style=\"width:200px;height:40px;padding-top:4px;\" class=\"sfloadingIcon\">");
            h.push("<div style=\"color:" + this._hexColor + ";margin-top:6px;font:1.6em bold Trebuchet,Arial\">" + escapeHTML(this._msg) + "</div>");
            h.push("</div>");
        },
        setMsg : function(msg) {
            this._msg = msg;
        },
        //Call this from your calling application to hide this component and its associated overlay.
        hide : function() {
            this.dispatch("hide");
        }
    });
})();
