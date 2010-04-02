/**
*@param {Json} conf Panel configuration.
*/
Boar.Panel=function(conf){
  var bc=Boar.Core;
  //var nId=bc.nextId();
  this.baseConf={
    'id':'boar-panel-'+bc.nextId(),
    'class':'boar-panel'
  };
  bc.merge(conf,this.baseConf);
  this.buildHTML();  
}

BExtend(Boar.Panel,Boar.Dom.Element);
/**
* Build Panel HTML tag
*/
Boar.Panel.prototype.buildHTML=function(){
  var t=this;
  t.el=BDom.build('div',t.baseConf);
  t.elHeader=BDom.build('div',{'class':'boar-panel-header'});
  t.elFooter=BDom.build('div',{'class':'boar-panel-footer'});
  t.elBody=BDom.build('div',{'class':'boar-panel-body'});
  t.el.append(t.elHeader).append(t.elBody).append(t.elFooter);
  t.element=t.el.element;
  t.el.style('display','none');
}

Boar.Panel.prototype.append=function(elm){
  if(elm.constructor===Boar.Dom.Element && elm.element!=undefined ){
      this.elBody.element.appendChild(elm.element);
    }else{
      this.elBody.element.appendChild(elm);
    }
    return this;
}

var BPanel=Boar.Panel;
