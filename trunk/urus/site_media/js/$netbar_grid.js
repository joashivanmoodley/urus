NetBarGrid=function(){
  var dlg,gd;
  
  
  //public
  return {
    getGrid:function(){
      var ds=new Ext.data.GroupingStore({
      reader: new Ext.data.JsonReader({
        totalProperty:'totalCount',
        root:'records'
        },[
         {name:'id'},
         {name:'name'},
         {name:'sort_name'},
         {name:'company'},
         {name:'link_man'},
         {name:'disable'},
         {name:'address'}
        ]),
      proxy:new Ext.data.HttpProxy({url:'getAllNetBar/',method:'GET'}),
      sortInfo:{field: 'sort_name', direction: "ASC"},
      groupField:'company' 
      });
      var pagingBar = new Ext.PagingToolbar({
        pageSize: 20,
        store: ds,
        displayInfo: true,
        displayMsg: '显示 {0} - {1} 共 {2}',
        emptyMsg: '没有数据'
      });
      
      var vw = new Ext.grid.GroupingView({
        forceFit:true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
      }),
      gd=new Ext.grid.GridPanel({
        border:false,
        ds:ds,  
          columns:[
            {id:'customerNo',header:'网吧编号',dataIndex:'id',sortable:true},
            {header:'名称',dataIndex:'name',sortable:true},
            {header:'简称',dataIndex:'sort_name',sortable:true},
            {header:'所属公司',dataIndex:'company',sortable:true},
            {header:'联系人',dataIndex:'link_man',sortable:true},
            {header:'有效',dataIndex:'disable',sortable:true},
            {header:'地址',dataIndex:'address',sortable:true}
          ],
          view: vw,
        //autoExpandColumn:'company',

        tbar:[{
            text:'添加客户',
            tooltip:'添加一个新的客户',
            iconCls:'add',
            //handler:this.showAddDlg
        }, '-', {
            text:'属性',
            tooltip:'查看当前记录的属性',
            iconCls:'option',
            //handler:this.showOptDlg
        },'-',{
            text:'删除客户',
            tooltip:'删除当前选中的客户',
            iconCls:'remove'
        }],
        bbar:pagingBar
      });
      gd.store.load();
      return gd;
    }
  }
}();