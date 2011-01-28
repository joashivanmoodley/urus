//! include /ui/juic/js/core/component.js
//! include /ui/extlib/yui/js/yahoo-dom-event/yahoo-dom-event.js
//! include /ui/extlib/yui/js/dragdrop/dragdrop.js
//! include /ui/uicore/js/DragDropUtil.js
//! include /ui/juic/js/components/sfDragDropMgr.js
//! include /ui/uicore/css/components/sfShadowBox.css

/**
 * JUIC expression of the "portlet" UI element as defined by the UI team.
 * This is specifically a "layout" component.
 *
 * See
 * - http://sfawong.successfactors.com/xidocs/xi/snippets/shadowBox.xhtml
 *
 * @param body       body of the shadow box (required)
 * @param header     header component (optional)
 * @param footer     footer component (optional)
 * @param height     Height of the shadow box (optional). Specifying height implies scrollability of the content.
 */
function SFShadowBox(body, header, footer, height, allowResize) {
    this.register();

    assert(body, 'SFShadowBox: body argument required.');
    this._body = body;

    if (typeof header == 'string') {
        this._header = new SFDefaultShadowBoxHeader(header);
        this._header.addEventListener('headeropen', this);
        this._header.addEventListener('headerclose', this);
    }
    else {
        this._header = header;
        this._isCustomHeader = true;
    }
    if(this._header && this._header.getDropGroup) {
        this._dropGroup = this._header.getDropGroup();
    }


    if (footer) {
        assert(typeof footer == 'object', 'SFShadowBox: footer argument must be an object.');
        this._footer = footer;
    }

    if (height) {
        this._height = height;
        this._scrollable = true;
    }

    this._allowResize = allowResize;
    if (this._allowResize) {
        this.setupResize();
    }
}

SFShadowBox.prototype = (function() {

    function getPosition(val) {
        return val ? parseInt(val) : 0;
    }

    function getDomXY(el) {
        return YAHOO.util.Dom.getXY(el);
    }

    var PROXY_DIV = null;

    function getDragEl() {
        if (!PROXY_DIV) {
            PROXY_DIV = document.createElement('div');
            if (document.body.firstChild) {
                document.body.insertBefore(PROXY_DIV, document.body.firstChild);
            } else {
                document.body.appendChild(PROXY_DIV);
            }
            PROXY_DIV.style.display = 'none';
            PROXY_DIV.style.position = 'absolute';
            PROXY_DIV.style.zIndex = '100001';
        }
        return PROXY_DIV;
    }

    return set(new Component(), {

        setupResize: function(allowResize) {
            if ((typeof TopNavBar != "undefined") && TopNavBar.showEvent) {
                TopNavBar.hideEvent.subscribe(Util.createCallback(this, 'resize'));
                TopNavBar.showEvent.subscribe(Util.createCallback(this, 'resize'));
            }
            YAHOO.util.Event.addListener(window, "resize", function() {
                this.resize();
                return false;
            }, this, true);
        },
        getDragHandle: function() {
            return this._header.getDragHandle();
        },
        getDropGroup: function() {
            return this._dropGroup;
        },
        _convertStyle: function(type) {
            switch (type) {
                case "companyProcess":
                    return "companyProcess";
                    break;
                case "favoriteLinks":
                    return "favoriteLinks";
                    break;
                default:
                    break;
            }
        },
        setDisplayStyle: function(style) {
            this._sbCSS = this._convertStyle(style);
        },
        renderHtml: function(h) {
            h.push('<span unselectable="on" onselectstart="return false;" id="', this.id, '"><div id="sb', this.id, '" class="sfShadowBox', this._isCustomHeader ? '' : ' withHeader', this._sbCSS ? ' ' + this._sbCSS : '', '"><div class="sFSBheader  ">',
                    '<div class="sFSBborderCorner"><div class="sFSBleftCorner"></div><div class="sFSBrightCorner"><div class="sFSBborderDiv">&nbsp;</div></div></div>');
            h.push('</div>');
            if (this._header) {
                h.push('<div id="', this.id, 'sbheader" class="sFSBheaderTitle clear_all">');
                if (this._header) this._header.renderHtml(h);
                h.push('</div>');
                h.push('<div id="sbbody', this.id, '" class="sFSBbody">');
            } else {
                h.push('<div id="sbbody', this.id, '" class="sFSBbody clear_all">');
            }
            h.push('<div id="body', this.id, '" class="content', (this._scrollable ? ' scrollable' : ''), '"', (this._height ? ' style="height:' + this._height + '"' : ''), '>');
            this._body.renderHtml(h);
            h.push('</div></div><div class="sFSBfooter">');
            //add footer here
            h.push('<div id="', this.id, 'sbfooter">');
            if (this._footer) this._footer.renderHtml(h);
            h.push('</div>');
            h.push('<div class="sFSBborderCorner"><div class="sFSBleftCorner"></div><div class="sFSBrightCorner"><div class="sFSBborderDiv">&nbsp;</div></div></div>',
                    '</div>',
                    '</div></span>');
        },
        handleEvent : function(evt) {
            switch (evt.type) {
                case "headeropen":
                    this.showBody(true);
                    break;
                case 'headerclose':
                    this.showBody(false);
                    break;
                case 'headerMouseDown':
                    this._originDomXY = getDomXY($(this.id));
                    SFDragDropMgr.handleMouseDown(evt, this, {
                        useShim :this._useShim,
                        shimCursor :'move'
                    });
                    break;
                case 'resize':
                    this.resize();
                    break;
            }
        },
        updateDragEl: function() {

        },
        /**
         * Handles any incoming drag event.
         *
         * @param event {DragEvent} The drag event to handle.
         */
        handleDragEvent : function(evt) {
            var dragEl = getDragEl();
            switch (evt.type) {
                case 'dragStart': {
                    var el = $("sb" + this.id);
                    var xy = YAHOO.util.Dom.getXY(el);
                    this._originPosition = {
                        left :xy[0],
                        top :xy[1]
                    };
                    this.updateDragEl(dragEl, false);
                    dragEl.style.display = '';
                    $(this.id).style.visibility = 'hidden';
                    break;
                }
                case 'drag':
                    var corrections = this._header.getCorrections();
                    this._showShim();
                    dragEl.style.width = $(this.id).offsetWidth + "px";
                    dragEl.innerHTML = $(this.id).innerHTML;
                    dragEl.style.left = (evt.origin.x + evt.point.x) - corrections.x + 'px';
                    dragEl.style.top = (evt.origin.y + evt.point.y) - corrections.y + 'px';
                    dragEl.style.display = '';
                    $(this.id).style.visibility = 'hidden';
                    break;
                case 'dragEnd':
                    this._hideShim();
                    if (this._validDropTarget) {
                        this._validDropTarget.drop(this);
                    }
                    var me = this;
                    var toPoint = YAHOO.util.Dom.getXY(this.id);
                    var animation = new YAHOO.util.Motion(dragEl, {
                        points : {
                            to :toPoint
                        }
                    }, 0.3, YAHOO.util.Easing.easeOut);
                    if (this._autoScroller) {
                        this._autoScroller.stopScrolling();
                    }
                    animation.onComplete.subscribe(function() {
                        dragEl.style.display = 'none';
                        YAHOO.util.Dom.setStyle(me.id, 'visibility', 'visible');
                        dragEl.innerHTML = '';
                        dragEl.style.width = '';
                    });
                    animation.animate();
                    SFDragDropMgr.refreshCache(true);
                    break;
                case 'dragOver':
                    var target = Component._registry[evt.id];
                    if (target.canDrop && target.canDrop(this)) {
                        this._validDropTarget = target;
                        this.updateDragEl(dragEl, true);
                        target.hoverOver();
                    }
                    break;
                case "dragOut":
                    var target = Component._registry[evt.id];
                    if (this._validDropTarget === target) {
                        this._validDropTarget = null;
                        this.updateDragEl(dragEl, false);
                    }
                    target.hoverOut();
                    break;
            }
        },
        showBody : function(show) {
            if (show) {
                $('body' + this.id).style.display = '';
                this.dispatch('collapse', { state: 'expanded'});
            }
            else {
                $('body' + this.id).style.display = 'none';
                this.dispatch('collapse', { state: 'collapsed'});
            }
        },

        setBody : function(body) {
            this._body = body;

            if ($('body' + this.id)) {
                var h = [];
                this._body.renderHtml(h);
                $('body' + this.id).innerHTML = h.join('');
            }
        },

        setHeader : function(header) {
            if (typeof header == 'string') {
                this._header.removeEventListener('headeropen');
                this._header.removeEventListener('headerclose');
                this._header = null;

                this._header = new SFDefaultShadowBoxHeader(header);
                this._header.addEventListener('headeropen', this);
                this._header.addEventListener('headerclose', this);
            }
            else
                this._header = header;
            if (header && header.getDropGroup) {
                this._dropGroup = header.getDropGroup();
            }
            this._header.render(this.id + 'sbheader');
        },

        setFooter : function(footer) {
            this._footer = footer;
            this._footer.render(this.id + 'sbfooter');
        },

        resize: function() {
            var elem = $("sb" + this.id);
            var props = Util.getAbsPos(elem);
            var vph = YAHOO.util.Dom.getViewportHeight();
            var height = vph - props.y - 27;
            $("sbbody" + this.id).style.height = height + "px";
            this.dispatch("resize", {height:height});
        },

        cleanup: function() {
            if (this._allowResize) {
                if ((typeof TopNavBar != "undefined") && TopNavBar.showEvent) {
                    TopNavBar.hideEvent.unsubscribe(Util.createCallback(this, 'resize'));
                    TopNavBar.showEvent.unsubscribe(Util.createCallback(this, 'resize'));
                }
                YAHOO.util.Event.removeListener(window, "resize", function() {
                    this.resize();
                    return false;
                });
            }
            if (this._header) {
                this._header.cleanup();
            }
            if (this._body) {
                this._body.cleanup();
            }
            if (this._footer) {
                this._footer.cleanup();
            }
        },

        /**
         * Show the shim.
         */
        _showShim : function() {
            if (!$('shimshim')) {
                this._createShim();
            } else {
                this._shim = $('shimshim');
            }
            this._shimActive = true;
            this._sizeShim();
            this._shim.style.display = '';
        },

        /**
         * Hide the shim.
         */
        _hideShim : function() {
            if ($('shimshim')) {
                this._shim.style.display = 'none';
            }
        },

        /**
         * Size the shim to match size of page.
         */
        _sizeShim : function() {
            if (this._shimActive) {
                this._shim.style.height = YAHOO.util.Dom.getDocumentHeight() + 'px';
                this._shim.style.width = YAHOO.util.Dom.getDocumentWidth() + 'px';
                this._shim.style.top = '0';
                this._shim.style.left = '0';
            }
        },

        /**
         * Create a shim to go under the hovering lines so that all mouse
         * events come through the shim and not through the body of the
         * page.
         */
        _createShim : function() {
            if (!$('shimshim')) {
                this._shim = document.createElement('div');
                if (document.body.firstChild) {
                    document.body.insertBefore(this._shim, document.body.firstChild);
                } else {
                    document.body.appendChild(this._shim);
                }
                this._shim.style.display = 'none';
                this._shim.style.backgroundColor = 'red';
                this._shim.style.position = 'absolute';
                this._shim.style.zIndex = '100001';
                this._shim.style.cursor = 'move';
                this._shim.unselectable = 'on';
                this._shim.id = 'shimshim';
                this._shim.onselectstart = function() {
                    return false;
                }
                YAHOO.util.Dom.setStyle(this._shim, 'opacity', '0');
                YAHOO.util.Event.on(this._shim, 'mouseup', this._onMouseUp, this, true);
                YAHOO.util.Event.on(this._shim, 'mousemove', this._onMouseMove, this, true);
                YAHOO.util.Event.on(window, 'scroll', this._sizeShim, this, true);
            }
        }
    });
})();


/**
 * This is the default header used in the shadow box if header is a string.  Can be instantiated externally also.
 *
 * @param label        label of header.
 * @param noCollapse   true or false (optional).
 */
function SFDefaultShadowBoxHeader(label, noCollapse, dragOptions) {
    this.register();
    this._label = label;
    this._noCollapse = noCollapse;
    if (dragOptions && dragOptions.isDraggable === true) {
        this._draggable = true;
        assert(dragOptions.dragGroup, "A draggable object should be member of a drop group");
        this._dropGroup = dragOptions.dragGroup;
    }
}

SFDefaultShadowBoxHeader.prototype = (function() {


    return set(new Component(), {
        // Returns Drop Group
        getDropGroup: function() {
            return this._dropGroup;
        },
        getDragHandle: function() {
            return (this._draggable ? this._dragHandle : null);
        },
        /**
         * When you mouse down on the handle. Calls the SFDragDropMgr.
         *
         * @param event {Event} The mouse event.
         */
        _onMouseDown : function(event) {
            this.dispatch("headerMouseDown");
        },
        renderHtml: function(h) {
            h.push('<h5 id="', this.id, '" class="panel_header">');
            if (this._draggable) {
                h.push('<span unselectable="on" onselectstart="return false;" class="sfShadowBoxGrip" id="', this.id, '_box_handle" onmousedown="', this.fireCode("_onMouseDown"), '"></span>');
            }

            if (!this._noCollapse)
                h.push('<a id="sbArrow', this.id, '" ',
                        'href="javascript:void(0);" ',
                        'class="section_arrow_open" ',
                        'onclick="', this.fireCode('_collapse'), '" ',
                        'title="Collapse"></a>');

            h.push(escapeHTML(this._label),
                    '</h5>');
        },
        getCorrections: function() {
            return {
                x:20,y:15
            };
        },
        /**
         * Handles any incoming drag event.
         *
         * @param event {DragEvent} The drag event to handle.
         */
        handleDragEvent : function(event) {
            switch (event.type) {
                case 'drag':
                    this.dispatch("drag", event);
                    break;
                case 'dragEnd':
                    this.dispatch("dragEnd", event);
                    break;
                case 'dragOver':
                    this.dispatch("dragOver", event);
                    break;
                case "dragOut":
                    this.dispatch("dragOut", event);
                    break;
            }
        },

        _collapse : function() {
            if ($('sbArrow' + this.id).className === 'section_arrow_close') {
                $('sbArrow' + this.id).className = 'section_arrow_open';
                this.dispatch('headeropen', { state: 'open'});
            }
            else {
                $('sbArrow' + this.id).className = 'section_arrow_close';
                this.dispatch('headerclose', { state: 'close'});
            }
        }

    });
})();
