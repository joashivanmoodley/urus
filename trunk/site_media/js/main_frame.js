mainFrame=function(config){
  this.cfg=config;
};

mainFrame.prototype={
  show:function(){
    var Tree = Ext.tree;
       var tree = new Tree.TreePanel({
           el:'name_menu_div',
           useArrows:true,
           autoScroll:true,
           border:false,
           autoHeight: true,
           autoWidth: true,
           animate:true,
           enableDD:true,
           containerScroll: true,
           rootVisible: false
       });
       var root=new Tree.TreeNode({
                                    text:'菜单',
                                    id:'menu_root_id',
                                    leaf:false
                                    });
       var agentMgmtRoot=new Tree.TreeNode({
                                    id:'agent_mgmt_root_id',
                                    text:'管理',
                                    leaf:false,
                                    url:'aaaaaaa'
                                    });
       var netBarMgmtRoot=new Tree.TreeNode({
                                    id:'netBar_mgmt_root_id',
                                    text:'Netbar Mangment',
                                    leaf:false,
                                    url:'BBBBBB'
                                    });
       var financeMgmtRoot=new Tree.TreeNode({
                                    id:'fincance_mgmt_root_id',
                                    text:'Fincance Mangment',
                                    leaf:false,
                                    url:'CCCC'
                                    });
       root.appendChild([agentMgmtRoot,netBarMgmtRoot,financeMgmtRoot]);
       tree.setRootNode(root);
       // add listener
       tree.on('click',function(node){
                 var mainContent=Ext.getCmp('conter_id');
                 if(node.id=='agent_mgmt_root_id'){
                   //agm_panel.applyToMarkup(mainContent.getEl());
                 }else{
                   mainContent.body.update(node.attributes['url']);
                 }
              });
       
       tree.render();
       
	
     
     	new Ext.Viewport({
	    layout: 'border',
	    items: [{
	        region: 'north',
	        xtype: 'box',
	        el: 'top_div',
	        height:32,
	        margins: '0 0 5 0'
	    }, {
	        region: 'west',
	        collapsible: true,
	        title: 'Navigation',
	        width: 200,
	        minWidth: 200,
	        autoScroll: true,
	        split: true,
	        layout:'accordion',
                layoutConfig:{
                  animate:true
                },
                items: [{
                        el: 'name_menu_div',
                        title:'管理菜单',
                        xtype: 'panel',
                        border:false,
                        iconCls:'nav'
                    },{
                        title:'Menu 2',
                        html:'<p>Some settings in here.</p>',
                        border:false,
                        iconCls:'settings'
                }]
	        
	        
	    }, {
	        region: 'center',
	        id: 'conter_id',
	        el:'content_div',
	        xtype: 'panel',
	        title: 'Content'
	    }, {
	        region: 'south',
	        title: 'Information',
	        collapsible: true,
	        html: 'Information goes here',
	        split: true,
	        height: 100,
	        minHeight: 100
	    }]
	});
  }
}

