_redrawShaodw=function(id){
  var obj=Ext.getCmp(id);
  if(obj){
    var s =obj.getEl().shadow;
    if(s){
      s.realign(obj.getBox().x, obj.getBox().y, obj.getBox().width, obj.getBox().height);
    }
  }
}