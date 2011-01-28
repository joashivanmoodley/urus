//! include /ui/juic/js/components/sfDefaultTreeModel.js
//! include /ui/uicore/css/components/sfTreeView.css

/**
 * Abstract View Representation of a Tree Component. Contains all the methods to
 * show a default tree component with expand and collapse behavior.
 * 
 * Usage: Do NOT instantiate. this is a internal abstract class and does not
 * register itself as a component. Instantiate only a concrete implementation
 * class. In general instantiation will follow the following syntax var treeView =
 * new SFTreeViewImpl(SFTreeModelImpl);
 * 
 */
function SFAbstractTreeView() {

}
SFAbstractTreeView.prototype = (function() {
    return set(new Component(), {
        _init : function(model) {
            if (typeof model != "undefined")
                this.setModel(model);
            this._expandedNodes = new Object();
            this.getModel().addEventListener('dataAvailable', this);
        },
        setModel : function(model) {
            this._model = model;
        },
        getModel : function() {
            return this._model;
        },
        renderHtml : function(h) {
            h.push("<div class=\"treeview_wrapper\" id=\"", this.id, "\"><div id=\"", this.id, this.getModel().getRootNode().getNodeId(), ":childTree\">");
            this._getNodeChildrenListHtml(this.getModel().getRootNode(), h);
            h.push("</div></div>");

        },
        /**
         * function to generate complete HTML as an unordered List of the child
         * nodes for any node. This will generate the UL and iterate over each
         * child node to generate it's HTML from this._getNodeChildElementHtml
         * method. In general the structure will look like
         * 
         * <ul id="childNodes_[nodeId]">
         * 
         * this._getNodeChildElementHtml([child1])
         * 
         * this._getNodeChildElementHtml([child2])
         * 
         * this._getNodeChildElementHtml([child3]) . . .
         * </ul>
         */
        _getNodeChildrenListHtml : function(node, html) {
            html.push("<ul id=\"", this.id, node.getNodeId(), ":childNodes", "\">");
            if (typeof (this.getModel().getNodeById(node.getNodeId())) != 'undefined') {
                var childNodes = node.getChildren();
                if (node.getNumChildren() > 0) {
                    for ( var el in childNodes) {
                        this._getNodeChildElementHtml(childNodes[el], html);
                    }
                }
            }
            html.push("</ul>");
        },
        /**
         * function to generate the HTML for a single child element. mainly the
         * LI tag for each node and call the requisite functions to generate the
         * internal requisite structures the structure generate would look like
         * 
         * <LI>
         * 
         * this._getNodeToggleSwitchHtml(node, html);
         * 
         * this._getNodeContentHtml(node, html);
         * 
         * this._getNodeChildrenHtml(node, html);
         * 
         * </LI>
         * 
         */
        _getNodeChildElementHtml : function(node, html) {
            html.push('<li id="', this.id, node.getNodeId(), ':wrapper" class="collapsed', node.isLeaf() ? ' leaf' : '', '" >');
            this._getNodeToggleSwitchHtml(node, html);
            this._getNodeContentHtml(node, html);
            this._getNodeChildrenHtml(node, html);
            html.push('</li>');
        },
        /**
         * function to generate the content for each node. Each node is a JUIC
         * component and hence just the renderHtml. for the child node is
         * called.
         */
        _getNodeContentHtml : function(node, html) {
            html.push('<div id="', this.id, node.getNodeId(), ':content" class="nodeContent">');
            node.renderHtml(html);
            html.push('</div>');
        },
        /**
         * function to generate the toggle switch of a node. generates
         * 
         * <div><span></span></div>
         * 
         * for leaf nodes and
         * 
         * <div><a></a></div>
         * 
         * for nodes that have children.
         */
        _getNodeToggleSwitchHtml : function(node, html) {
            html.push('<div id="', this.id, node.getNodeId(), ':toggle_wrapper" class="expand_switch">');
            if (node.isLeaf()) {
                html.push('<span id="', this.id, node.getNodeId(), ':toggle" >', '</span>');
            } else {
                html.push('<a href="javascript:void(0);" id="', this.id, node.getNodeId(), ':toggle" onclick="', this
                        .fireCode("_handleClick", node.getNodeId()), 'return false;">', this._expandedNodes[node.getNodeId()] ? '-' : '+', '</a>');
            }
            html.push('</div>');
        },
        /**
         * function to generate html corresponding to the child Tree of a node.
         * It creates a DIV wrapper and then calls the
         * this._getNodeChildrenListHtml for children if the current node has
         * children and is expanded.
         */
        _getNodeChildrenHtml : function(node, html) {
            html.push('<div id="', this.id, node.getNodeId(), ':childTree', '" class="childTree">');
            if (node.getNumChildren() > 0 && this._expandedNodes[node.getNodeId()]) {
                this._getNodeChildrenListHtml(node, html);
            }
            html.push('</div>');
        },
        /**
         * handle expansion and collapse from the toggle switch.
         */
        _handleClick : function(nodeId, evt) {
            if (this._expandedNodes[nodeId] == true) {
                this._expandedNodes[nodeId] = false;
                $(this.id + nodeId + ':toggle').innerHTML = "+";
                Util.addClass(this.id + nodeId + ':wrapper', "collapsed");
            } else {
                this.getModel().getNodeData(nodeId);
                this._expandedNodes[nodeId] = true;
                $(this.id + nodeId + ':toggle').innerHTML = "-";
                Util.removeClass(this.id + nodeId + ':wrapper', "collapsed");
            }
        },
        /**
         * listen for data availability from the Model
         */
        handleEvent : function(evt) {
            switch (evt.type) {
            case "dataAvailable":
                if ($(this.id + evt.nodeId + ":childTree")) {
                    this._expandedNodes[evt.nodeId] = true;
                    var html = new Array();
                    this._getNodeChildrenListHtml(this.getModel().getNodeById(evt.nodeId), html);
                    $(this.id + evt.nodeId + ":childTree").innerHTML = html.join("");
                }
                break;
            }
        },
        cleanup : function() {
            this.getModel().removeEventListener('dataAvailable', this);

        }
    });
})();

/**
 * Default implementation of the TreeView which uses the SFAbstractTreeView for
 * it's behavior
 * 
 * @param model
 */
function SFDefaultTreeView(model) {
    this.register();
    this._init(model);
}
SFDefaultTreeView.prototype = (function() {
    return set(new SFAbstractTreeView(), {
        _init : function(model) {
            SFAbstractTreeView.prototype._init.call(this, model);
        }
    });
})();

/**
 * Implementation of a select Tree View. Adds selection related events on top of
 * SFAbstractTreeView.
 * 
 * @param model
 */
function SFSelectTreeView(model) {
    this.register();
    this._init(model);
}
SFSelectTreeView.prototype = (function() {
    return set(new SFAbstractTreeView(), {
        _init : function(model) {
            SFAbstractTreeView.prototype._init.call(this, model);
            this.getModel().addEventListener('selectAction', this);
        },
        /**
         * add and remove CSS classes in child nodes when selection related events are fired.
         */
        handleEvent : function(evt) {
            SFAbstractTreeView.prototype.handleEvent.call(this, evt);
            switch (evt.type) {
            case "selectAction":
                switch (evt.actionCommand) {
                case "selected":
                    Util.addClass(this.id + evt.nodeId + ':content', "selected");
                    break;
                case "childSelected":
                    if (this.getModel().getNodeById(evt.nodeId).hasSelectedChildren() == true)
                        Util.addClass(this.id + evt.nodeId + ':content', "childSelected");
                    break;
                case "deSelected":
                    Util.removeClass(this.id + evt.nodeId + ':content', "selected");
                    break;
                case "childDeSelected":
                    if (this.getModel().getNodeById(evt.nodeId).hasSelectedChildren() == false)
                        Util.removeClass(this.id + evt.nodeId + ':content', "childSelected");
                    break;
                }
                break;
            }
        }
    });
})();
