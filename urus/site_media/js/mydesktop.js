MyDesktop = new Ext.app.App({
	init :function(){
		Ext.QuickTips.init();
	},

	getModules : function(){
		return [
			new MyDesktop.CustomerMgrWindow()
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
    },
    
    keyHandler:function(){
      if(!this.win){
        this.createWindow();
      }else{
        this.win.fireEvent('minimize');
        
      }
      alert(this.win);
    }
    
    
    
});

var windowIndex = 0;