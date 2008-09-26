var saveAction = new Ext.Action({
        text: 'Save',
        handler: function(){
            Ext.Msg.confirm('Name', 'Do you want to save?', function(btn, text){
	      if (btn == 'ok'){
	          Ext.Msg.alert('','ok');
	      }
	    });
        },
        iconCls: 'blist'
    });
    
var editAction = new Ext.Action({
        text: 'Edit',
        handler: function(){
            Ext.Msg.confirm('Name', 'Do you want to edit?', function(btn, text){
	      if (btn == 'ok'){
	          Ext.Msg.alert('','edit');
	      }
	    });
        },
        iconCls: 'blist'
    });

var delAction = new Ext.Action({
        text: 'Delete',
        handler: function(){
            Ext.Msg.confirm('Name', 'Do you want to delete?', function(btn, text){
	      if (btn == 'ok'){
	          Ext.Msg.alert('','delete');
	      }
	    });
        },
        iconCls: 'blist'
    });    

var agm_panel = new Ext.Panel({
        title: 'Agent Mangment',
        bodyStyle: 'padding:10px;',     // lazy inline style

        tbar: [
            saveAction,editAction,delAction
        ],
    });