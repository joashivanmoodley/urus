MyDesktop = new Ext.app.App({
	init :function(){
		Ext.QuickTips.init();
	},

	getModules : function(){
		return [
			new MyDesktop.CustomerMgrWindow(),
      new MyDesktop.NetBarMgrWindow()
		];
	},

    // config for the start menu
    getStartConfig : function(){
        return {
            title: 'handle',
            iconCls: 'user',
            toolItems: [{
                text:'Settings',
                iconCls:'settings',
                scope:this
            },'-',{
                text:'Logout',
                iconCls:'logout',
                scope:this
            }]
        };
    }
});



MyDesktop.NetBarMgrWindow=Ext.extend(Ext.app.Module,{
  id:'netbar-mgr-win',
  key:{key:Ext.EventObject.N,shift:true},
  init:function(){
    this.launcher = {
      text: '网吧管理',
      iconCls:'icon-grid',
      handler : this.createWindow,
      scope: this
    }
  },
  createWindow:function(){
    var desktop = this.app.getDesktop();
    var win = desktop.getWindow('netbar-mgr-win');
    if(!win){
    win = desktop.createWindow({
      id: 'netbar-mgr-win',
      title:'网吧管理',
      width:740,
      height:480,
      iconCls: 'icon-grid',
      shim:false,
      animCollapse:false,
      constrainHeader:true,
      layout: 'fit',
      items:NetBarGrid.getGrid()
    });
    }
    win.show();
    this.win=win;
  }
});


MyDesktop.CustomerMgrWindow = Ext.extend(Ext.app.Module, {
    id:'cm-win',
    key:{key:Ext.EventObject.C,shift:true,alt:true},
    init : function(){
        this.launcher = {
          text: '客户管理',
          iconCls:'icon-grid',
          handler : this.createWindow,
          scope: this
        }
    },

    createWindow : function(){
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow('cm-win');
        if(!win){
            win = desktop.createWindow({
                id: 'cm-win',
                title:'客户管理',
                width:740,
                height:480,
                iconCls: 'icon-grid',
                shim:false,
                animCollapse:false,
                constrainHeader:true,
                layout: 'fit',
                items:CustomerGrid.getGrid()
            });
        }
        win.show();
        this.win=win;
    }   
});

var windowIndex = 0;