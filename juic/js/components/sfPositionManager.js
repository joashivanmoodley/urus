//! include /ui/juic/js/components/sfOverlayMgr.js

/**
 * position a component respective to a DOM object.
 *
 * Usage:
 * 1. DO NOT INSTANTIATE!!! SFPositionManager  is a singleton that is directly accessible. When you
 * include this file.
 *
 * 2. To show an overlay, call SFPositionManager .showOverlay(componentReference,originId). See method
 * description for parameter implementation
 */
if (typeof SFPositionManager == "undefined") {
    //hide implementation from global namespace
    window.SFPositionManager = (function() {
        var ns = /Gecko\/[0-9]+/.test(navigator.userAgent);
        /**
         * private
         *
         * get the left and top position of the origin object.
         *
         * @param originObj - dom object for which the left and top position
         */
        function _originDims(originObj, fixPoint, menuOptions) {
            var originDims = {left:0,top:0};

            if (fixPoint.offset) {
                assert(!isNaN(fixPoint.offset.vertical), "[SFPositionManager] : vertical offset should be a number");
                assert(!isNaN(fixPoint.offset.horizontal), "[SFPositionManager] : horizontal offset should be a number");
                if (!isNaN(fixPoint.offset.horizontal))
                    originDims.left += fixPoint.offset.horizontal;
                if (!isNaN(fixPoint.offset.vertical))
                    originDims.top += fixPoint.offset.vertical;
            }
              originDims = _getOffestXY(originObj,originDims );
            return _fixPointsX(menuOptions, _fixPointsX({componentHeight:originObj.offsetHeight,componentWidth:originObj.offsetWidth}, originDims, fixPoint.origin, true), fixPoint.menu, false); // return the JSON object
        }

        function _getOffestXY(originObj,originDims ){

            var tempObj = originObj ;// obj assigned to a temp object

                        // the bellow do while will add the offset left and offset top to the dims left and top untill the
                        // offsetparent of temp object is undefined
                        do
                        {
                            originDims.left += tempObj.offsetLeft; // add temp obj offsetLeft to the orgDims left
                            originDims.top += tempObj.offsetTop; // add temp obj offsetRight to the orgDims right
                            tempObj = tempObj.offsetParent;
                        }
                        while (tempObj);

                        tempObj = originObj; // obj assigned to a temp object
                        // the bellow do while will subtract the scroll left and scroll top to the dims left and top untill the
                        // offsetparent of temp object is not equal to the document body, assuming the document body will not have a scroll bar
                        do
                        {
                            originDims.left -= tempObj.scrollLeft;
                            originDims.top -= tempObj.scrollTop;
                            tempObj = tempObj.parentNode;
                        }
                        while (tempObj != document.body);

            return originDims;
        }

        function mathForPoints(numOne, numTwo, isAdd)
        {
            if (isAdd) {
                return  numOne + numTwo;
            } else
                return  numOne - numTwo;
        }

        /**
         * the bellow tow function (_fixPoints & _fixHPositionOrigin) calculate the left and top position of the menu
         * based on the fix point options.
         * if it is origin the component height and width value is added to left and top (isMenu = false)
         * if it is menu the component height and width value is subtracted to left and top (isMenu = true)
         */

        function _fixPointsX(originObj, originDims, fixPoint, isOrigin) {
            switch (fixPoint.vertical) {
                case "bottom" :
                    originDims.top = mathForPoints(originDims.top, originObj.componentHeight, isOrigin);
                    break;
                case "middle" :
                    originDims.top = mathForPoints(originDims.top, (originObj.componentHeight / 2), isOrigin);
                    break;
                default :
                    break;
            }
            return _fixPointsY(originObj, originDims, fixPoint.horizontal, isOrigin);
        }

        function _fixPointsY(originObj, originDims, position, isOrigin) {
            switch (position) {
                case "right" :
                    originDims.left = mathForPoints(originDims.left, originObj.componentWidth, isOrigin);
                    break;
                case "center" :
                    originDims.left = mathForPoints(originDims.left, (originObj.componentWidth / 2), isOrigin);
                    break;
                default :
                    break;
            }
            return originDims;
        }
        function _getViewportDims() {
            var vpHeight = 0;
            vpHeight = self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight); // get the view port height
            var vpWidth = 0;
            vpWidth = self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth); // get the view port width
            return {height:vpHeight,width:vpWidth};
        }
        return set(new Component(), {
            init : function() {
                this.register();
                this.originObj;
                this.fixPoint = {
                    origin : {vertical:"bottom" , horizontal:"left"},
                    menu   : {vertical:"top" , horizontal:"left"},
                    offset : {vertical:0 , horizontal:0}
                };
                /**
                 * The origin in the json describe which point in the origin the menu should stick to
                 * The menu in the json describe which point of the menu should stick to the origin.
                 * the default value of the fix point is origin bottom left to the menu top left
                 */

                this.menuPos = {left:0,top:0};
            },
            handleEvent : function(evt) {
                switch (evt.type) {
                    case "hide" :
                        evt.target.removeEventListener("hide", this);
                        SFOverlayMgr.removeEventListener("overlayRendered", this);
                        this.menuPos = {left:0,top:0};
                        break;
                    case "overlayRendered" :
                        this._moveMenu(arguments[0]);
                        break;
                    default :
                        alert("unknown event!!");
                        break;
                }
            },
            /**
             * Private
             *
             * the after the overlay is rendered this calculates if the menu is rendered in the view port and then reposition it.
             *
             * @param menuOptions - json -- {overlayId : ovrId,componentWidth : Width,componentHeight : Height}
             */
            _moveMenu : function(menuOptions)
            {
                if (menuOptions.isModal) {
                    return true;
                }

                this.menuPos = _originDims(this.originObj, this.fixPoint, menuOptions);
                
                var componentFit = 0;
                var fixedToTop = false;
                var isPosChange = false;
                var vpDims = _getViewportDims(); // get the view ports width and height
                var moveLeft = (this.menuPos.left + menuOptions.componentWidth) - vpDims.width; // position of the right end point of the menu subtracted by the viewport width
                var moveTop = (this.menuPos.top + menuOptions.componentHeight) - vpDims.height; // position of the bottom end point of the menu subtracted by the viewport height
                var moveRight = this.menuPos.left - menuOptions.componentWidth; // position of the left end point of the menu subtracted by the component Width
                var moveBottom = this.menuPos.top - menuOptions.componentHeight; // position of the top end point of the menu subtracted by the component height
                // if the moveleft is greater than 0 then the menu extends outside the view port.
                // the menu must jump to fix the right corner with the origin
                if (moveLeft > 0) {
                  if(moveLeft > (vpDims.width - this.menuPos.left)) {
                    this.fixPoint.menu.horizontal = "right";
                    isPosChange = true;
                  }
                }
                // if the moveTop is greater than 0 then the menu extends outside the view port.
                // the menu must jump to fix the bottom corner with the origin's top corner
                if (moveTop > 0) {
                    //it doesnt fit bottom - check to see if the menu fits on top
                    if((this.menuPos.top - this.originObj.offsetHeight) > menuOptions.componentHeight)  {
                      this.fixPoint.menu.vertical = "bottom";
                      this.fixPoint.origin.vertical = "top";
                      isPosChange = true;
                    } //otherwise is the bottom a closer fit than top?
                    else if ((vpDims.height - this.menuPos.top) > (this.menuPos.top - this.originObj.offsetHeight)) {
                      //leave it bottom and change its size
                      componentFit = this.menuPos.top - vpDims.height;
                    } 
                    else {
                      //put it top and change its size and set the top point to zero
                      this.fixPoint.menu.vertical = "bottom";
                      this.fixPoint.origin.vertical = "top";
                      componentFit = this.menuPos.top - this.originObj.offsetHeight;
                      fixedToTop = true;
                    }
                    isPosChange = true;
               }
                // if the moveRight is less than 0 then the menu extends outside the view port.
                // the menu must jump to fix the left corner with the origin
                if (moveRight < 0 && this.fixPoint.menu.horizontal == "right") {
                    this.fixPoint.menu.horizontal = "left";
                    isPosChange = true;
                }
                // if the moveBottom is less than 0 then the menu extends outside the view port.
                // the menu must jump to fix the top corner with the origin's bottom corner
                if (moveBottom < 0 && this.fixPoint.menu.vertical == "bottom") {
                    this.fixPoint.menu.vertical = "top";
                    this.fixPoint.origin.vertical = "bottom";
                    isPosChange = true;
                }
                var newPosition = this.menuPos;

                if (isPosChange) {
                  
                    newPosition = _originDims(this.originObj, this.fixPoint, menuOptions);
                    if (fixedToTop)
                      newPosition.top = 0;
                }
                
                SFOverlayMgr.repositionComponent(menuOptions.overlayId, newPosition);
                this.dispatch("positionFixed",
                {
                    positionInfo : {
                        fixPoint : {
                            origin : {
                                originId : this.originObj.id,
                                vertical:this.fixPoint.origin.vertical,
                                horizontal:this.fixPoint.origin.horizontal
                            },
                            menu   : {
                                vertical:this.fixPoint.menu.vertical,
                                horizontal:this.fixPoint.menu.horizontal
                            }
                            },
                        overlay : {
                            overlayId : menuOptions.overlayId,
                            left      : newPosition.left,
                            top       : newPosition.top,
                            width     : menuOptions.componentWidth,
                            height    : menuOptions.componentHeight
                        }
                    },
                    newComponentHeight:componentFit
                }); 
            },
             /**
             * Public
             *
             * the menumgr will calculate the x and y for positioning the overlay at that position
             *
             * @param component - component reference
             * @param originId - element id string or DOM element to which the menu is ankered
             * @param fixPoint - JSON - defaulted to originoffset (0 0), origin (bottom left) and menu (top left)
             */
            showMenu : function(component, originId, fixPoint) {
                this.show(component, originId, fixPoint);
            },
            show : function(component, originId, fixPoint) {
                assert(originId, "[SFPositionManager] : originId required to anker the menu");
                // if it's a string then it's id. On some occassions, the element is passed in to avoid sfPositionManager picking
                // up the wrong element due to the existence of drag and drop proxy element that has the same element id.
                if (typeof originId === 'string') { 
                    this.originObj = $(originId);
                } else {
                    this.originObj = originId;
                }
                if (fixPoint) {
                    this.fixPoint = fixPoint;
                } else {
                    this.fixPoint = {
                    origin : {vertical:"bottom" , horizontal:"left"},
                    menu   : {vertical:"top" , horizontal:"left"},
                    offset : {vertical:0 , horizontal:0}
                }
                }
                SFOverlayMgr.addEventListener("overlayRendered", this);
                component.addEventListener("hide", this);
                SFOverlayMgr.showOverlay(component, false, this.menuPos);
            },
            /**
             * Public
             *
             * this will move the rendered overlay to a new position either to a referenced object
             * or to a new x and y position
             *
             * @param component - id of the component that will be rendered inside the overlay
             * @param movePos - JSON - defaulted to originoffset (0 0), origin (bottom left) and menu (top left)
             * @param originId - element id to which the menu is ankered
             */
            moveTo : function(componentId, movePos, originId ) {
                assert(typeof componentId == 'string', "[SFPositionManager] : component cannot be an object. it should be id of the component");
                this.fixPoint = {
                    origin : {vertical:"bottom" , horizontal:"left"},
                    menu   : {vertical:"top" , horizontal:"left"},
                    offset : {vertical:0 , horizontal:0}
                };
                var compObj = $(componentId);
                var componentId = compObj.parentNode.id;
                if (originId) {

                    this.originObj = $(originId);
                    if (movePos) {
                        if (movePos.origin) {
                            this.fixPoint.origin = movePos.origin;
                        }
                        if (movePos.menu) {
                            this.fixPoint.menu = movePos.menu
                        }
                        if (movePos.offset) {
                            this.fixPoint.offset = movePos.offset
                        }
                    }
                    this._moveMenu({
                        overlayId : componentId,
                        componentWidth : compObj.offsetWidth,
                        componentHeight : compObj.offsetHeight,
                        isModal : false
                    })

                } else {
                    assert(movePos, "[SFPositionManager] : should have the left and top offset values in the format \n {left:(number),top:(number)}");
                    assert(!isNaN(movePos.left), "[SFPositionManager] : left offset should be a number");
                    assert(!isNaN(movePos.top), "[SFPositionManager] : top offset should be a number");
                    SFOverlayMgr.repositionComponent(objOverlayId, movePos);
                }
            }
        });
    })();
    SFPositionManager.init();
}
