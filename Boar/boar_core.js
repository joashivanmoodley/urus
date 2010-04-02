var Boar=Boar || {};
Boar.Widgets={};
Boar.CurrentID=0;
Boar.IDPrefix='Boar-ID-';
Boar.Path='../';
Boar.CssPath='../css/'
Boar.WidgetPath='widgets/';
Boar.Core={
	version:0.1,
	loadedLibs:{},
	/**
	*Merge prototype from source to target.
	*/
	merge:function(source,target){
		for(name in source){
			if(!target[name]){
				target[name]=source[name];
			}
		}
	},
  /**
  *@return next auto ID.
  */
  nextId:function(){
    Boar.CurrentID+=1;
    return Boar.IDPrefix+Boar.CurrentID;
  }
}

/**
*@param {Function} subClass
*@param {Function} superClass
*/
Boar.Extend=function(subClass, superClass){
  var F = function() {};
  F.prototype = superClass.prototype;
  F.prototype.constructor=superClass;
  subClass.prototype = new F();
  subClass.prototype.superClass=new F();
  subClass.prototype.constructor = subClass;
  /*
  subClass.superclass = superClass.prototype;
  if(superClass.prototype.constructor == Object.prototype.constructor) {
    superClass.prototype.constructor = superClass;
  }
  */
}
/**
*All Boar Lib definition
*/
Boar.Libs={
  'utils':{
    'dependency':[],
    'pathJS':'boar_utils.js'
  },
  'testframework':{
    'dependency':['panel'],
    'pathJS':'boar_testframework.js'
  },
  'dom':{
    'dependency':[],
    'pathJS':'boar_dom.js'
  },
  'panel':{
    'dependency':['utils','dom'],
    'pathJS':'boar_panel.js',
    'pathCSS':'boar_panel.css'
  }
}


/**
* Load extenal Boar libs
*/
Boar.load=function(arrLibs){
  var t=this,core=Boar.Core;
  if(arrLibs=='undefined' || arrLibs.constructor!=Array){
    return;
  }
  for(var i=0;i<arrLibs.length;i++){
    var lib=Boar.Libs[arrLibs[i]];
    if(lib){
      if(lib.dependency.length!=0){
      //load lib dependency  
      Boar.load(lib.dependency);
      }
      //load lib
      if(null==core.loadedLibs[arrLibs[i]] || undefined==core.loadedLibs[arrLibs[i]]){
        document.write('<script type="text/javascript" src="' + Boar.Path+ lib.pathJS + '"></script>');
        if(lib.pathCSS!=undefined && lib.pathCSS.length>0){
          document.write('<link rel="stylesheet" type="text/css" href="' + Boar.CssPath+ lib.pathCSS + '"></script>');  
        }
        core.loadedLibs[arrLibs[i]]=lib;
      }
    }
    
  }  
}

Boar.StartUp=function(){
  Boar.load([]);
}();
var BCore=Boar.Core;
var BExtend=Boar.Extend;
