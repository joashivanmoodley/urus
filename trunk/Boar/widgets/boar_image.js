
 /**
  *@param {String} imgSrc is image src or document.Element object
  *@return {Json} return new image size with structure {width:newWidth;height:newHeight}
  */
Boar.Widgets.Image=function(imgSrc){
  this.imgSrc=imgSrc;
}

Boar.Widgets.Image.prototype={
  /**
  *@param {Number} w width to match
  *@param {Number} h height to match
  *@param {Function} callBack callback function when image onload
  *@return {Json} return new image size with structure {width:newWidth;height:newHeight}
  */
  getAdjustSize : function(w,h,callBack){
    if(!this.imgSrc){return null;}
    var tmpImg=new Image();
    tmpImg.src=this.imgSrc;
    tmpImg.onload=function(){
      if(callBack!=undefined){
        callBack.call();
      }
    }
    return {width:tmpImg.width,height:tmpImg.height};
  }
}



var BWImage=Boar.Widgets.Image;
