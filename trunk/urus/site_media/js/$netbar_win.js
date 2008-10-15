NetBarWin=function(cfg){
  var desktop=MyDesktop.desktop;
  var _win = desktop.getWindow('netbar-win');
  if(!_win){
    var panel=new NetBarFormPanel();
    _win=desktop.createWindow({
      title:'添加新网吧',
      id:'netbar-win',
      autoWidth:true,
      autoHtight:true,
      maximizable : false,
      minHeight: 80,
      style:'z-index:20000',
      buttonAlign:'center',
      stateful:false,
      resizable:false,
      minimizable : false,
      modal: true,
      items:[
        panel
      ]
    });
    _win.addButton({text:'确定'});
    _win.addButton("取消",function(){
    _win.close();
  });
  }
  return _win;
}


var _company_data=[['1','东方网点'],['2','网吧联盟']];

NetBarFormPanel=function(cfg){
  cfg=cfg?cfg:{};
  
  // company comobox
  var combo = new Ext.form.ComboBox({
    store: new Ext.data.SimpleStore({
      fields: ['id', 'shortName'],
      data:_company_data
    }),
    displayField:'shortName',
    fieldLabel:'公司名称',
    typeAhead: true,
    editable:false,
    id:'netbar-cmp-name-combox',
    mode: 'local',
    forceSelection: true,
    triggerAction: 'all',
    emptyText:'请选择...',
    selectOnFocus:true
  });
  var keyCfg={keypress:{fn:function(c,e){alert(v);}}};
  
  var cf={
    labelWidth:75,
    frame:true,
    id:'netbar-win-form',
    title: '',
    bodyStyle:'padding:5px 5px 0',
    //defaults: {width: 230},
    defaultType: 'textfield',
    width: 335,
    items:[{
        xtype:'fieldset',
        title: '网吧信息',
        autoHeight:true,
        defaults: {width: 210},
        defaultType: 'textfield',
        items:[
          { xtype:'textfield', id:'netbar-name',  fieldLabel:'网吧名称'},
          { xtype:'textfield', id:'netbar-short-name',  fieldLabel:'网吧简称'},
          combo,
          { xtype:'textfield', id:'netbar-scale',  fieldLabel:'规模'},
          { xtype:'textfield', id:'netbar-address',  fieldLabel:'网吧地址'},
          
        ]
      },{
        xtype:'fieldset',
        checkboxName:'netbar-new-cmp-checkbox',
        checkboxToggle:true,
        title: '新建网吧所属公司',
        //collapsible: true,
        collapsed: true,
        autoHeight:true,
        defaults: {width: 210},
        defaultType: 'textfield',
        items:[
          //{ xtype:'checkbox', id:'is-new-cmp-chk',  fieldLabel:'新建公司',handler:this.doNewCmp},
          { xtype:'textfield', id:'company-name',  fieldLabel:'公司名称'},
          { xtype:'textfield', id:'company-address',  fieldLabel:'公司地址'},
          { xtype:'textfield', id:'company-linkman',  fieldLabel:'联系人'},
        ],
        listeners:{
          collapse:{
            fn:function(){
              var a=Ext.getCmp('company-name');
              var b=Ext.getCmp('company-address');
              var c=Ext.getCmp('company-linkman');
              var d=Ext.getCmp('netbar-cmp-name-combox');
              a.disable();
              b.disable();
              c.disable();
              d.enable();
              a.setValue('');
              b.setValue('');
              c.setValue('');
              _redrawShaodw('netbar-win');
            }
          },
          expand:{
            fn:function(){
              var a=Ext.getCmp('company-name');
              var b=Ext.getCmp('company-address');
              var c=Ext.getCmp('company-linkman');
              var d=Ext.getCmp('netbar-cmp-name-combox');
              a.enable();
              b.enable();
              c.enable();
              d.disable();
              _redrawShaodw('netbar-win');
            }
          }
        }
      }
    ]
  };
  
  
  cfg=Ext.applyIf(cfg,cf);
  return new Ext.FormPanel(cfg);
}