/*
 * Ext JS Library 2.2
 * Copyright(c) 2006-2008, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.app.App = function(cfg){
    Ext.apply(this, cfg);
    this.addEvents({
        'ready' : true,
        'beforeunload' : true
    });

    Ext.onReady(this.initApp, this);
};

Ext.extend(Ext.app.App, Ext.util.Observable, {
    isReady: false,
    startMenu: null,
    modules: null,
    getStartConfig : function(){
  
    },

    initApp : function(){
    	this.startConfig = this.startConfig || this.getStartConfig();

        this.desktop = new Ext.Desktop(this);

		this.launcher = this.desktop.taskbar.startMenu;

		this.modules = this.getModules();
        if(this.modules){
            this.initModules(this.modules);
        }

        this.init();

        Ext.EventManager.on(window, 'beforeunload', this.onUnload, this);
		this.fireEvent('ready', this);
        this.isReady = true;
        this.enableKeyNav();
    },

    getModules : function(){return this.modules;},
    init : Ext.emptyFn,
    
    handleKey:function(k,e){
      var winId=this.keySet[k].id;
      var w=this.desktop.getWindow(winId);
      if(!w){
        this.keySet[k].createWindow();
      }else{
        if(w.minimized){
          w.show();
        }else{
          w.fireEvent('minimize',w);
        }
        
      }
    },
    
    enableKeyNav:function(){
      var all=Ext.DomQuery.select('input[type!=hidden]'); 
      Ext.each(all,function(o,i,all){ //遍历并添加enter的监听
            Ext.get(o).addKeyMap({
                key : 13,
                fn : function() {
                    try{all[i+1].focus()}catch(e){event.keyCode=9}
                    if(all[i+1]&&/button|reset|submit/.test(all[i+1].type)) all[i+1].click();   //如果是按钮则触发click事件
                    return true;
                }
            })
      });
    },
    
    regKey: function(module){
      var keys=module.key;
      var key=keys.key;
      Ext.applyIf(keys,{fn:this.handleKey,scope:this})
      if(!this.keyMap){
        this.keyMap = new Ext.KeyMap(document, keys);
      }else{
        this.keyMap.addBinding(keys);  
      }
      this.keySet=this.keySet ? this.keySet : {};
      this.keySet[key]=module;
    },
    
    initModules : function(ms){
		for(var i = 0, len = ms.length; i < len; i++){
            var m = ms[i];
            this.launcher.add(m.launcher);
            this.regKey(m);
            m.app = this;
        }
    },

    getModule : function(name){
    	var ms = this.modules;
    	for(var i = 0, len = ms.length; i < len; i++){
    		if(ms[i].id == name || ms[i].appType == name){
    			return ms[i];
			}
        }
        return '';
    },

    onReady : function(fn, scope){
        if(!this.isReady){
            this.on('ready', fn, scope);
        }else{
            fn.call(scope, this);
        }
    },

    getDesktop : function(){
        return this.desktop;
    },

    onUnload : function(e){
        if(this.fireEvent('beforeunload', this) === false){
            e.stopEvent();
        }
    }
});