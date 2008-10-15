CustomerGrid=function(){
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
        {text:'确定',handler:addOrUpdateCustomer},
        {text:'取消',handler:function(){_win.close();}}
      ]
    });
    _win.on({
      'show':{fn:function(){_redrawShaodw(id);}}
    });
  }
  return _win;
};

  var getDlg=function(winId,name,el,v){
    dlg=getWin(winId,name);
    var fm=new Ext.form.FormPanel({
      //border:false,
      autoWidth:true,
      autoHeight:true,
      frame:true,
      buttonAlign:'right',
      items:[
        { xtype:'hidden',id:'new-customer-id',value:v?v.id:''},
        { xtype:'textfield',id:'new-name', fieldLabel:'姓名',disabled:v?true:false,value:v?v.name:''},
        { 
          xtype:'combo',
          fieldLabel:'性别',
          store:new Ext.data.SimpleStore({
            fields:['key','des'],
            data:[['M','男'],['F','女']]
          }
          ),
          id:'new-gender-combo',
          mode: 'local',
          triggerAction: 'all',
          displayField:'des',
          valueField:'key',
          hiddenName: 'genderValue',
          selectOnFocus:true,
          typeAhead: true,
          disabled:v?true:false,
          value:v?v.gender:'M'
        },
        { xtype:'textfield', id:'new-op',  fieldLabel:'办公室电话',value:v?v.op:''},
        { xtype:'textfield', id:'new-mp1', fieldLabel:'移动电话1',value:v?v.mp:''},
        { xtype:'textfield', id:'new-mp2', fieldLabel:'移动电话2',value:v?v.mp2:''},
        { xtype:'textfield', id:'new-em', fieldLabel:'电子邮件',value:v?v.em:''},
        
      ]
    });
    dlg.add(fm);
    dlg.show();
    dlg.fireEvent('move',this);
    console.log('#'+el.id+' input[type!=hidden]');
    var all=Ext.DomQuery.select('#ext-comp-1025 input[type!=hidden]'); 
    console.log('all size :'+all.length);
    Ext.each(all,function(o,i,all){ //遍历并添加enter的监听
            Ext.get(o).addKeyMap({
                key : 13,
                fn : function() {
                    try{all[i+1].focus()}catch(e){}
                    return true;
                }
            })
    });
    Ext.getCmp('new-gender-combo').setSize(127);
  };
  
  addOrUpdateCustomer=function(){
    para={};
    var cId=Ext.get('new-customer-id').getValue();
    para.id=cId
    para.name=Ext.get('new-name').getValue();
    para.gender=Ext.getCmp('new-gender-combo').getValue();
    para.op=Ext.get('new-op').getValue();
    para.mp1=Ext.get('new-mp1').getValue();
    para.mp2=Ext.get('new-mp2').getValue();
    para.em=Ext.get('new-em').getValue();
    Ext.Ajax.request({
    			url : 'addOrUpdateCustomer/', 
    			params : para,
    			method: 'POST',
    			success: function ( result, request) { 
            // popup success info
            dlg.close();
            gd.store.load();
    			},
    			failure: function ( result, request) { 
    				var ew=window.open();
            ew.document.write(result.responseText);
    			} 
    		});
  }


//public 
return {
  getGrid:function(){
     var ds=new Ext.data.Store({
      reader: new Ext.data.JsonReader({
        totalProperty:'totalCount',
        root:'records'
        },[
         {name:'id'},
         {name:'name'},
         {name:'gender'},
         {name:'office_phone'},
         {name:'mobile_phone1'},
         {name:'mobile_phone2'},
         {name:'email'}
        ]),
      proxy:new Ext.data.HttpProxy({url:'getAllCustomer/',method:'GET'})                        
      });
      
    var pagingBar = new Ext.PagingToolbar({
        pageSize: 20,
        store: ds,
        displayInfo: true,
        displayMsg: '显示 {0} - {1} 共 {2}',
        emptyMsg: '没有数据'
    });
     gd=new Ext.grid.GridPanel({
        border:false,
        ds:ds,  
          columns:[
            {id:'customerNo',header:'客户编号',dataIndex:'id',sortable:true},
            {header:'姓名',dataIndex:'name',sortable:true},
            {header:'性别',dataIndex:'gender',sortable:true},
            {header:'办公室电话',dataIndex:'office_phone',sortable:true},
            {header:'移动电话1',dataIndex:'mobile_phone1',sortable:true},
            {header:'移动电话2',dataIndex:'mobile_phone2',sortable:true},
            {header:'电子邮件',dataIndex:'email',sortable:true}
          ],

          viewConfig: {
            forceFit:true
          },
        //autoExpandColumn:'company',

        tbar:[{
            text:'添加客户',
            tooltip:'添加一个新的客户',
            iconCls:'add',
            handler:this.showAddDlg
        }, '-', {
            text:'属性',
            tooltip:'查看当前记录的属性',
            iconCls:'option',
            handler:this.showOptDlg
        },'-',{
            text:'删除客户',
            tooltip:'删除当前选中的客户',
            iconCls:'remove'
        }],
        bbar:pagingBar
        
      });
      gd.store.load();
      return gd;
  },
  
  showAddDlg:function(){
    return getDlg('create-new-customer-win','添加新客户',this.el);
  },
  showOptDlg:function(){
    var selectionModel = gd.getSelectionModel();
    var record = selectionModel.getSelected();
    if(record){
      var v={},r=record;
      v.id=r.get('id');
      v.name=r.get('name');
      v.gender=r.get('gender'),
      v.op=r.get('office_phone'),
      v.mp=r.get('mobile_phone1'),
      v.mp2=r.get('mobile_phone2'),
      v.em=r.get('email')
      return getDlg('customer-option-win','客户属性',this.el,v);
    }else{
      alert('请选择记录');
    }
  },

  
  
}
}();
