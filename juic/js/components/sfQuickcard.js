//! include /ui/uicore/css/components/sfQuickCard.css

/**
 * this object replace the YUI panel
 * this is a object used by the old quickcard.js using JSUP to render the quickcard in the page.
 */
function SFQuickcardPanel() {
    this.register();
    this.init();
}
SFQuickcardPanel.prototype = ( function() {
    return set(new Component(), {
        header:"",
        body:"",
        footer:"",
        width:"350px",
        init: function(){

        },
        setBody : function(body){
            this.body = body;
        },
        setHeader: function(head){
            this.header = head
        },
        setFooter:function(foot){
            this.footer = foot;
        },
        setWidth:function(width){
        	this.width = width;
        },
        show : function(quickCardImgId, movePos){
            var _defautlOffSet = {vertical:0 , horizontal:0};
            var _offset = (null == movePos ? _defautlOffSet : movePos);
            SFPositionManager.show(this, quickCardImgId,{
                    origin : {vertical:"top" , horizontal:"right"},
                    menu   : {vertical:"top" , horizontal:"left"},
                    offset : _offset
                });
        },
        _cancel : function(){
             this.close();
        },
        close : function() {
                this.dispatch("action", { actionCommand : "hide" });
                this.dispatch("hide");
        },
        cleanup: function() {
            var elem = document.getElementById(this.id);
            if (elem) {
                while (elem.parentNode != null && elem.parentNode.id != 'sfOverlayMgr') {
                    elem = elem.parentNode;
                }
                if (elem.parentNode != null) {
                    elem.parentNode.removeChild(elem);
                }
            }
            this.unregister();
        },
        renderHtml : function(h) {
            h.push('<div  class="sfQuickCard quickcard"  id="', this.id ,'" style="width:', this.width,'"><div class="hd">',this.header,'</div >');
            h.push('<div class="bd">',this.body,'</div >');
            h.push('<div class="ft">', this.footer, '</div >');
            h.push('<span id="dlg_close_x" onclick="' , this.fireCode("_cancel") , '" class="closeIcon"></span>');
            h.push('</div>');
        }
    });
})();


