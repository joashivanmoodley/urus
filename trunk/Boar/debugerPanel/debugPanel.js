var Boar=Boar || {};
Boar.DebugPanel=function(){
  var t=this;
  t.PANEL_ID='Boar-DebugPanel';
  t.isDispaly=false;
  t.init();
}

Boar.DebugPanel.prototype={
  init: function(){
    //capture document
    var t=this;
    t.panel=t.inject();
    t.panelStyle=t.panel.style;
    t.captureDocument();
  },
  
  inject:function(){
    var panel=document.createElement('div');
    panel.id=this.PANEL_ID;
    var st=panel.style;
    st.display='none';
    st.height='100px';
    st.position = 'absolute';
    st.backgroundColor = '#FFAC56';
    st.overflowY = 'scroll';
    st.overflowX = 'hidden';
    st.width='98%';
    document.body.appendChild(panel);
    return panel;
  },
  /**
    * @private
    * capute document user ctrl+w
    */
  captureDocument:function(){
    var t=this;
    document.onkeydown=function(e){
      e=e || window.event;
      //ctrl+shift+w
      if(e.shiftKey && e.ctrlKey && e.keyCode==77){
        if(t.isDispaly){
          t.hidden.call(t);
        }else{
          t.display.call(t);
        }
        
      }
    }
  },
  /**
      *@private
      *dispaly the debuger panel
      */
  display:function(){
    var t=this;
    t.panelStyle.display='';
    t.isDispaly=true;
  },
  hidden:function(){
    var t=this;
    t.panelStyle.display='none';
    t.isDispaly=false;
  }
  
  
}