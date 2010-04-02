var Boar=Boar || {};
Boar.Utils={};
/*members clear, containsKey, get, isEmpty, keySet, 
    prototype, put, putAll, remove, size, values
*/
Boar.Utils.Map=function(){
  this.length = 0;
  this.prefix = "BMap__";
};

Boar.Utils.Map.prototype={
  put:function(key,value){
    this[this.prefix + key] = value;
    this.length ++;
  },
  get:function(key){
    return typeof this[this.prefix + key] == "undefined" 
            ? null : this[this.prefix + key];
  },
  /** 
  *@return Array 
  */
  keySet:function(){
    var arrKeySet = new Array();
    var index = 0;
    for(var strKey in this){
        if(strKey.substring(0,this.prefix.length) == this.prefix)
            arrKeySet[index ++] = strKey.substring(this.prefix.length);
    }
    return arrKeySet.length == 0 ? null : arrKeySet;
  },
  values:function(){
    var arrValues = new Array();
    var index = 0;
    for(var strKey in this){
      if(strKey.substring(0,this.prefix.length) == this.prefix)
        arrValues[index ++] = this[strKey];
    }
    return arrValues.length == 0 ? null : arrValues;
  },
  size:function(){
    return this.length;
  },
  clear:function(){
    for(var strKey in this){
      if(strKey.substring(0,this.prefix.length) == this.prefix)
        delete this[strKey];   
    }
    this.length = 0;
  },
  isEmpty:function(){
     return this.length == 0;
  },
  containsKey:function(key){
    for(var strKey in this){
      if(strKey == this.prefix + key)
        return true;  
    }
    return false;
  },
  putAll:function(map){
    if(map == null)
        return;
    if(map.constructor != Boar.Utils.Map)
        return;
    var arrKey = map.keySet();
    var arrValue = map.values();
    for(var i in arrKey)
       this.put(arrKey[i],arrValue[i]);
  },
  remove:function(key){
    delete this[this.prefix + key];
    this.length --;
  }
};
var BMap=Boar.Utils.Map;
