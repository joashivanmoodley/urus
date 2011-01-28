//! include /ui/juic/js/core/component.js


/**
 * This component will create an input form based upon input field definitions passed to it. Essentially creates a standard
 * input form contained in the table layout
 */

/**
 *
 * @param useCellBorders - Default is true, and will add borders to the cells which is the default for the axial table
 */
function SFInputFormLayout(useCellBorders /*boolean*/) {
    this.register();
    this._useCellBorders = (typeof useCellBorders != "undefined" ) ? useCellBorders : true;
    this._fields = [];
}

SFInputFormLayout.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            var fields = this._fields;
            h.push("<table id=\"layoutTbl_"+ this.id + "\" class=\"axial");
            if(!this._useCellBorders) {
                h.push(" noborder");
            }
            h.push("\">");
            for (var idx=0, len=fields.length;idx<len;++idx) {
                var required = (fields[idx].options && fields[idx].options.required) ? "<span class=\"required\">*</span>" : "";
                h.push("<tr><th>");
                var lbl = this._fields[idx].label;
                if (typeof lbl == "string") {
                    h.push(required,"<label for=\"" + fields[idx].compRef.id + "\">",escapeHTML(lbl),"</label>");
                } else {
                    lbl.renderHtml(h);
                }
                h.push("</th><td>");
                fields[idx].compRef.renderHtml(h);
                if (fields[idx].options && fields[idx].options.description) h.push("<span style=\"font-style:italic;padding:0.5em;\">",escapeHTML(fields[idx].options.description),"</span>");                
                h.push("</td></tr>");
            }
            h.push("</table>")
        },
        fieldsOk : function() {
            var tbl = $("layoutTbl_" + this.id);
            var inputs = tbl.getElementsByTagName("input");
            var fldsOk = false;
            for (var idx=0,len=inputs.length;((idx<len) && (!fldsOk));++idx) {
                if (inputs[idx].type != "submit") {
                    if (inputs[idx].value != null && inputs[idx].value != "") {
                        fldsOk = true;
                    }
                }
            }
            return fldsOk;
        },
        /**
         * Instantiated component to be rendered in the form layout
         * @param label Localized string
         * @param fieldComp Input component
         * @param options The only accepted and processed is {required : true}
         */
        addField : function(label, fieldComp, options) {
            this._fields.push({label : label, compRef : fieldComp, options : options})
        }
    });
})();