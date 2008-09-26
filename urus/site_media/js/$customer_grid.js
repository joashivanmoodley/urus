CustomerGrid=function(){
    var dlg,gd;
//private function
var getWin=function(titleText,config){
    var cfg=config||{};
    var c_dlg=new Ext.Window({
      autoCreate : true,
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
      plain:true,
      footer:true,
      closable:true
    });
    return c_dlg;
};

  var getDlg=function(name,el,v){
    dlg=getWin(name);
    var fm=new Ext.form.FormPanel({
      //border:false,
      autoWidth:true,
      autoHeight:true,
      frame:true,
      buttonAlign:'right',
      items:[
        { xtype:'textfield', fieldLabel:'姓名',disabled:v?true:false,value:v?v.name:''},
        { 
          xtype:'combo',
          fieldLabel:'性别',
          store:new Ext.data.SimpleStore({
            fields:['key','des'],
            data:[['M','男'],['F','女']]
          }
          ),
          id:'gender-combo',
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
        { xtype:'textfield', fieldLabel:'办公室电话',disabled:v?true:false,value:v?v.op:''},
        { xtype:'textfield', fieldLabel:'移动电话1',disabled:v?true:false,value:v?v.mp:''},
        { xtype:'textfield', fieldLabel:'移动电话2',disabled:v?true:false,value:v?v.mp2:''},
        { xtype:'textfield', fieldLabel:'电子邮件',disabled:v?true:false,value:v?v.em:''},
        
      ]
    });
    dlg.add(fm);
    dlg.addButton('确定');
    dlg.addButton("取消",function(){
    dlg.close();
    });
    //dlg.render(document.body);
    dlg.show();
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
    Ext.getCmp('gender-combo').setSize(127);
  };

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
      proxy:new Ext.data.HttpProxy({url:'json/',method:'GET'})                        
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
    return getDlg('添加新客户',this.el);
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
      return getDlg('客户属性',this.el,v);
    }else{
      alert('请选择记录');
    }
    
  },

  
  
}
}();
