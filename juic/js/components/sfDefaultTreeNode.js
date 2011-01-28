//! include /ui/juic/js/components/sfDataNode.js
/**
 * Abstract Tree Node implementation which derives from a SFDataNode. Adds only
 * tree specific methods and attributes. It is xpected that implementing classes
 * will call the init function and define their own renderHtml.
 * 
 * TODO: Please note that the order in which children are evaluated/shown is not
 * fixed and may change. Support for this feature is planned but not
 * implemented.
 * 
 * @param nodeId
 * @see SFDatanode
 */
function SFAbstractTreeNode(nodeId) {
    this._init(nodeId);
}
SFAbstractTreeNode.prototype = (function() {
    return set(new SFDataNode(), {
        _init : function(nodeId) {
            SFDataNode.prototype._init.call(this, nodeId);
            this.setLeaf(true);
        },
        /**
         * A node is a leaf if it contains zero children.
         */
        isLeaf : function() {
            return this._numChildren == 0;
        },
        /**
         * Sets whether the current node is a leaf node. If a node is set to
         * leaf it's children are cleared and cleanup is called. Otherwise if
         * it's unset then the internal storage of children object is
         * instantiated.
         */
        setLeaf : function(bool) {
            if (bool) {
                // TODO: this seems like a potential memory leak since the
                // cleanup of child nodes is done correctly but the current node
                // might still have event references to them. Need to figure out
                // how to clean this up without calling this.unregister
        SFAbstractTreeNode.prototype.cleanup.call(this);
        this._children = undefined;
        this._numChildren = 0;
        this._numPopulatedChildren = 0;
    } else {
        if (typeof this._children == 'undefined') {
            this._children = new Object();
            this._numPopulatedChildren = 0;
        }
    }
},
/**
 * returns true if the data for this node's children has been fetched
 * completely.
 */
isDataPopulated : function() {
    return (this._numChildren == 0 || this._numPopulatedChildren == this._numChildren);
},
/**
 * Adds a child node to the current Node and ensures that the number of nodes
 * does not exceed the number specified by the data.
 */
addChild : function(obj) {
    this.setLeaf(false);
    this._children[obj.getNodeId()] = obj;
    this._numPopulatedChildren++;
    assert(this._numPopulatedChildren <= this._numChildren, "Number of children for node " + this.getNodeId() + " exceeds the declared number");
},
getChildren : function() {
    return this._children;
},
getChild : function(nodeId) {
    return this._children[nodeId];
},
getNumChildren : function() {
    return this._numChildren;
},
setNumChildren : function(numChildren) {
    this._numChildren = numChildren;
},
cleanup : function() {
    if (typeof this._children != 'undefined') {
        for ( var element in this._children) {
            this.getChild(element).cleanup();
        }
    }
}
    });
})();

/**
 * Default implementation of the TreeNode. Based completely on the
 * SFAbstractTreeNode.
 * 
 * @param nodeId
 */
function SFDefaultTreeNode(nodeId) {
    this._init(nodeId);
}
SFDefaultTreeNode.prototype = (function() {
    return set(new SFAbstractTreeNode(), {
        _init : function(nodeId) {
            SFAbstractTreeNode.prototype._init.call(this, nodeId);
        },
        cleanup : function() {
            SFAbstractTreeNode.prototype.cleanup.call(this);
        }
    });
})();

/**
 * Default implementation of a selectable tree node. Adds selection related
 * behavior events. Based on SFAbstractTreeNode.
 * 
 * @param nodeId
 */
function SFDefaultTreeSelectNode(nodeId) {
    this._init(nodeId);
}
SFDefaultTreeSelectNode.prototype = (function() {
    return set(new SFAbstractTreeNode(), {
        _init : function(nodeId) {
            this._selected = false;
            this._numSelectedChildren = 0;
            this._selectedChildren = new Object();
            SFAbstractTreeNode.prototype._init.call(this, nodeId);
        },
        /**
         * Overrides the default addchild implementation but calls the super
         * implementation to leverage code reuse. Adds selection related event.
         */
        addChild : function(obj) {
            SFAbstractTreeNode.prototype.addChild.call(this, obj);
            if (this._showChildSelected)
                obj.addEventListener('selectAction', this);
        },
        /**
         * Sets the option whether child selection should propagate up to the
         * parent and be available as a event to be captured by the view.
         */
        setShowChildSelected : function(optionValue) {
            this._showChildSelected = optionValue;
        },
        isSelected : function() {
            return this._selected;
        },
        setSelected : function(bool) {
            this._selected = bool;
        },
        /**
         * Returns the number of selected immediate children if
         * ShowChildSelected is false in this hierarchy. returns total number of
         * selected children anywhere in this hierarchy when ShowChildSelected
         * is true.
         */
        hasSelectedChildren : function() {
            return this._numSelectedChildren > 0;
        },
        /**
         * The renderHtml should call this from some of it's elements via
         * fireCode. for example a node might call this only from a checkbox
         * used to toggle the selection.
         */
        _toggleSelected : function() {
            if (this.isSelected()) {
                this.deSelect(); 
            } else {
                this.select();
            }
        },
        select: function() {
            this.setSelected(true);
            this.dispatch("selectAction", {
                "actionCommand" : "selected",
                "nodeId" : this.getNodeId()
            });
        },
        deSelect:function() {
            this.setSelected(false);
            this.dispatch("selectAction", {
                "actionCommand" : "deSelected",
                "nodeId" : this.getNodeId()
            });
        },
        /**
         * Handle selection related Events
         */
        handleEvent : function(evt) {
            switch (evt.type) {
            case "selectAction":
                switch (evt.actionCommand) {
                case "childSelected":
                case "selected":
                    if (typeof (this._children[evt.nodeId]) != 'undefined') {
                        this._selectedChildren[evt.nodeId] = true;
                        this._numSelectedChildren++;
                        this.dispatch("selectAction", {
                            actionCommand : "childSelected",
                            nodeId : this.getNodeId()
                        });
                    }
                    break;
                case "childDeSelected":
                case "deSelected":
                    if (typeof (this._children[evt.nodeId]) != 'undefined') {
                        this._selectedChildren[evt.nodeId] = false;
                        this._numSelectedChildren--;
                        this.dispatch("selectAction", {
                            actionCommand : "childDeSelected",
                            nodeId : this.getNodeId()
                        });
                    }
                    break;
                }
                break;
            }
        },
        cleanup : function() {
            for ( var element in this.getChildren()) {
                this.getChild(element).removeEventListener('selectAction', this);
            }
            SFAbstractTreeNode.prototype.cleanup.call(this);
        }
    });
})();
