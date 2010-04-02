var Boar=Boar || {};

Boar.core={
	version:0.1,
	copy:function(source,target){
		for(name in source){
			if(!target[name]){
				target[name]=source[name];
			}
		}
	}
}

