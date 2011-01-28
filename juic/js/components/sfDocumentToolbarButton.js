
//! include /ui/jsfcore/css/menuBar.css

/**
 * Button for populating a toolbar according to: http://ui/awong/bento/snippets_toolbar.html
 * While the button can be used as a standalone button, it is really meant to be used with
  * an SFToolbarLayout instance. Also, it is the only accepted button type that the layout
  * will accept.
 * @param iconType          - See iconClasses below. User passes a specific "type" to produce a
 * @param label             - Label to display on the button
 * @param actionCommand     - Action command dispatched along with "action" event
 * @param isMenu            - [optional] Merely adds a drop-down arrow. This doesn't change the object's behavior.
 */
function SFToolbarButton(iconType,label,actionCommand, isMenu) {
    this.register();
    assert(iconType, "[SFToolbarButton] A valid iconType is required. See documentation in Confluence");
    assert(label, "[SFToolbarButton] A button label is required");
    assert(actionCommand,"[SFToolbarButton] An actionCommand is required");
    this._isMenu = isMenu;
    this._iconType = iconType;
    this._buttonLabel = label;
    this._actionCommand = actionCommand;
    this._init();
}

SFToolbarButton.isMouseLeaveOrEnter = function(e, handler) 
{
	if (e.type != 'mouseout' && e.type != 'mouseover') return false;
	var reltg = e.relatedTarget ? e.relatedTarget :
	e.type == 'mouseout' ? e.toElement : e.fromElement;
	while (reltg && reltg != handler) reltg = reltg.parentNode;
	return (reltg != handler);
};


SFToolbarButton.prototype = (function() {
    /**
     * This is the "secret sauce" of the component and the implementation detail hidden
     * from consumers. The cool thing here is that the UE group needs only create a new
     * CSS class, and it can be added to this object and be available for the app.
     */
    var _iconClasses = {
        "return" : "icon_return",
        "save" : "icon_save",
        "save_as" : "icon_save_as",
        "saving" : "icon_saving",
        "preview" : "icon_preview",
        "forward" : "icon_forward",
        "delete" : "icon_delete",
        "add" : "icon_add",
        "copy" : "icon_copy",
        "align" : "icon_align",
        "email" : "icon_email",
        "emailall" : "icon_emailall",
        "undo_all" : "icon_undo_all",
        "cancel" : "icon_cancel",
        "error" : "icon_error",
        "ok" : "icon_ok",
        "pdf" : "icon_pdf",
        "lineage_expand" : "icon_lineage_expand",
        "lineage_collapse" : "icon_lineage_collapse",
        "print" : "icon_print",
        "meeting" : "icon_meeting",
        "export" : "icon_export",
        "import" : "icon_import",
        "export_data" : "icon_export_data",
        "export_report" : "icon_export_report",
        "run" : "icon_run",
        "template" : "icon_template",
        "signature" : "icon_signature",
        "phone" : "icon_phone",
        "person_new" : "icon_person_new",
        "person_exists" : "icon_person_exists",
        "fit_on_screen" : "icon_fitOnScreen",
        "full_screen" : "icon_fullScreen",
        "instruction" : "icon_instruction",
        "lotus" : "icon_lotus",
        "pause" : "icon_pause",
        "none" : "icon_none",
        "bgcheck" : "icon_bgcheck"
    };

    return set(new Component(), {
        _init : function() {
            this._visible = true;
            this._enabled = true;
            this._iconClass = this._getIconClass(this._iconType);
        },
        _getIconClass : function(iconType) {
            assert(_iconClasses[iconType],"[SFToolbarButton] The icon type '"+iconType+"' specified is not defined");
            return _iconClasses[iconType];
        },
        renderHtml : function(h) {
            var iconClass = (this._iconClass != "icon_none") ? ((this._isMenu) ? "class=\"" + this._iconClass + " btn_menu\""
                                                                               : "class=\"" + this._iconClass + "\"")
                                                             : ((this._isMenu) ? "class=\"btn_menu\"" : "");
            var btnClass = (this._enabled) ? "btn" : "dimmed btn";
            var visibility = (!this._visible) ? " style=\"display:none;\" " : "";
            h.push("<span id=\"",this.id,
                    "\" onmousedown=\"",this.fireCode("_mouseDown"),
                    "\" onmouseup=\"",this.fireCode("_mouseUp"),
                    "\" onmouseover=\"if (SFToolbarButton.isMouseLeaveOrEnter(event,this)) {",this.fireCode("_mouseOver"),"};",
                    "\" onmouseout=\"if (SFToolbarButton.isMouseLeaveOrEnter(event,this)) {",this.fireCode("_mouseOut"),"};\"",
                    visibility,
                    "\" class=\"",btnClass,"\"><span class=\"left\"><span class=\"right\"><a id=\"",
                    this.id,"_link\" href=\"javascript:void(0);\" ",
                    iconClass,
                    " onclick=\"",this.fireCode("_actionHandler"),";return false;\"><em id=\"",this.id,"_label\">",
                    escapeHTML(this._buttonLabel),"</em></a></span></span></span>");
        },
        _actionHandler : function() {
            if (this._enabled) {
                if (this._actionCommand)
                    this.dispatch("action", {actionCommand : this._actionCommand});
                else
                    this.dispatch("action");
            }
        },
        _mouseDown : function() {
            if (this._enabled) {
                var button = $(this.id);
                button.className += " itemon";
            }
        },
        _mouseUp : function() {
            if (this._enabled) {
                var button = $(this.id);
                button.className = button.className.replace(' itemon', '').replace(' itemover', '');
            }
        },
        _mouseOver : function() {
            if (this._enabled) {
                var button = $(this.id);
                button.className += ' itemover';
            }
        },
        _mouseOut : function() {
            if (this._enabled) {
                var button = $(this.id);
                button.className = button.className.replace(' itemon', '').replace(' itemover', '');
            }
        },
        /**
         * Public method for enabled/disabled state of the button.
         * @param enabled
         */
        setEnabled : function(enabled) {
            //Do nothing if enabled state is already
            //what is trying to be set.
            if (this._enabled != enabled) {
                this._enabled = enabled;
                if ($(this.id)) {
                    var button = $(this.id);
                    button.className = (enabled) ? button.className.replace("dimmed ", "") : "dimmed " + button.className;
                }
            }
        },
        isEnabled : function() {
            return this._enabled;
        },
        /**
         * Changes the icont type of the button.
         * @param iconType
         */
        setIconType : function(iconType) {
            this._iconType = iconType;
            this._iconClass = this._getIconClass(this._iconType);
            var btnLink = $(this.id + "_link");
            if (btnLink) {
                btnLink.className = (this._iconClass != "icon_none") ? ((this._isMenu) ? this._iconClass + " btn_menu"
                                                                                       : this._iconClass)
                                                                     : ((this._isMenu) ? "btn_menu" : "");
            }
        },
        /**
         * Sets the button's label
         * @param label
         */
        setLabel : function(label) {
            this._buttonLabel = label;
            var lbl = $(this.id + "_label");
            if (lbl) {
                lbl.innerHTML = escapeHTML(label);
            }
        },
        /**
         * Wrapper function to change the icon type and label in one step.
         * @param iconType
         * @param label
         */
        setIconAndLabel : function(iconType, label) {
            this.setIconType(iconType);
            this.setLabel(label);
        },
        /**
         * Changes the action command that is dispatched with the action event
         * @param actionCommand
         */
        setActionCommand : function(actionCommand) {
            this._actionCommand = actionCommand;
        },
        /**
         * Sets visibility of the button. If you set this before rendering,
         * the button will be rendered with a style=display:none.
         * @param visible
         */
        setVisible : function(visible) {
            //Do nothing if visibility is already set to what was passed.
            if (this._visible != visible) {
                this._visible = visible;
                if ($(this.id))
                    $(this.id).style.display = (visible) ? "" : "none";
            }
        },
        /**
         * Returns visibility of the button
         */
        isVisible : function() {
            return this._visible;
        }
    });
})();
