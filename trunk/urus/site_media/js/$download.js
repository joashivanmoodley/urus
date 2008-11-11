Download=function(){
    var dlg,gd;
//private function
var getWin=function(id,titleText,config){
  var desktop=MyDesktop.desktop;
  var _win=desktop.getWindow(id);
  if(!_win){
    var cfg=config||{};
    _win=new Ext.Window({
      autoCreate : true,
      id:id,
      title:titleText,
      resizable:false,
      constrain:true,
      constrainHeader:true,
      minimizable : false,
      maximizable : false,
      stateful: false,
      modal: true,
      shim:true,
      buttonAlign:'right',
      autoWidth:true,
      autoHeight:true,
      minHeight: 80,
      plain:false,
      closable:true,
      manager:desktop.getManager(),
      shadow:true,
      buttons:[
        {text:'confirm',handler:downloadResult},
        {text:'cancel',handler:function(){_win.close();}}
      ]
    });
  }
  return _win;
};

downloadResult=function(){
    para={};
    para.result=Ext.get('new-query_result').getValue();
	if (para.result =='')
	{
	  alert('pls input query sentence');
	  return;
	}
	//creat a iframe to this download page.
    var iframe = document.createElement("iframe");
    iframe.src = "downloadResult?result=" + para.result;
    iframe.style.display = "none";
    document.body.appendChild(iframe); 
  }

  var getDlg=function(winId,name,v){
    dlg=getWin(winId,name);
    var fm=new Ext.form.FormPanel({
      //border:false,
      autoWidth:false,
	  width:500,
      autoHeight:true,
      frame:true,
      buttonAlign:'right',
      items:[
        { xtype:'textfield',id:'new-query_result', fieldLabel:'query_Result',disabled:v?true:false,value:v?v.name:''},
      ]
    });
    dlg.add(fm);
    dlg.show();
  };


//public 
return {
  getGrid:function(){
    return getDlg('execl download','excel_downlaod');
  }
 
}
}();
