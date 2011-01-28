//! include /ui/juic/js/components/sfDefaultTreeNode.js
/**
 * Abstract implementation of a Tree model. Provides basic behavior such as -
 * Fetching hierarchichal data. - Retaining a root node reference.
 * 
 * TODO: data fetching pagination.
 */
function SFAbstractTreeModel() {

}
SFAbstractTreeModel.prototype = (function() {
    return set(new EventTarget(), {
        _init : function(dao) {
            this._rootNode = new SFDefaultTreeNode();
            this._rootNode.register();
            this._rootNode.setNumChildren(1);
            this._dao = dao;
            this._dao.addEventListener('dataAvailable', this)
            this._nodeIdMap = new Object();
            this._nodeIdMap[this._rootNode.getNodeId()] = this._rootNode;
            this.getNodeData(this.getRootNode().getNodeId());
        },
        /**
         * Used to make sure that the data for a node is fetched from the
         * server. When the data is already available in the model it is
         * dispatched using the data available event directly. Otherwise a
         * fetchdata is called on the DAO which dispatches the data available
         * and a passthrough event dispatch is done in the handleEvenT of this
         * class after appending it to the correct position in the model.
         */
        getNodeData : function(nodeId) {
            if (!this._nodeIdMap[nodeId].isDataPopulated()) {
                this._dao.fetchChildren(nodeId);
            } else {
                this.dispatch("dataAvailable", {
                    nodeId : nodeId,
                    startIndex : 0,
                    endIndex : this.getNodeById(nodeId).getNumChildren()
                });
            }
        },
        getRootNode : function() {
            return this._rootNode;
        },
        /**
         * This class maintains a map o fthe available data nodes and can fetch
         * them easily in a O(1) lookup.
         */
        getNodeById : function(nodeId) {
            return this._nodeIdMap[nodeId];
        },
        handleEvent : function(evt) {
            switch (evt.type) {
            case "dataAvailable":
                /* set the parent node as received from the DAO event */
                var selectedNode = evt.parentNode;
                /*
                 * since the number of children in the root node cannot be
                 * populated before hand the same is done after the data for the
                 * root node is received
                 */
                if (evt.parentNode == this._rootNode.getNodeId()) {
                    this._rootNode.setNumChildren(evt.endIndex + 1);
                }
                var count = 0;
                for ( var nodeIndex = evt.startIndex; nodeIndex <= evt.endIndex; nodeIndex++, count++) {
                    /* insert the new node into the nodeIdMap */
                    this._nodeIdMap[evt.data[count].getNodeId()] = evt.data[count];
                    /* insert the new node into the correct parent node */
                    this.getNodeById(selectedNode).addChild(evt.data[count]);
                }
                /* dispatch that the data is now available with the model */
                this.dispatch("dataAvailable", {
                    nodeId : selectedNode,
                    startIndex : evt.startIndex,
                    endIndex : evt.endIndex
                });
                break;
            }
        },
        cleanup : function() {
            this._dao.removeEventListener('dataAvailable', this)
            this._rootNode.cleanup();
        }
    });
})();

/**
 * Default implementation of a TreeModel only provides tree interactions. As
 * defined in SFAbstractTreeModel
 * 
 * @param dao
 */
function SFDefaultTreeModel(dao) {
    if (dao) {
        this._init(dao);
    }
}
SFDefaultTreeModel.prototype = (function() {
    return set(new SFAbstractTreeModel(), {
        _init : function(dao) {
            SFAbstractTreeModel.prototype._init.call(this, dao);
        }
    });
})();

/**
 * Default implementation of a multi select Tree Model. Adds selection related
 * methods and events on top of SFAbstractTreeModel.
 * 
 * @param dao
 * @return
 */
function SFMultiSelectTreeModel(dao) {
    if (dao) {
        this._init(dao);
    }
}
SFMultiSelectTreeModel.prototype = (function() {
    return set(new SFAbstractTreeModel(), {
        _init : function(dao) {
            this.selectedNodes = new Object();
            SFAbstractTreeModel.prototype._init.call(this, dao);
        },
        /**
         * Option to notify parent hierarchy of a child selection. When set to
         * true will propagate an event all the way up the hierarchy on
         * selection of a node.
         */
        setShowChildSelected : function(optionValue) {
            this._showChildSelected = optionValue;
        },
        /**
         * Returns true if a particular node is selected.
         */
        isNodeSelected : function(nodeId) {
            return this.selectedNodes[nodeId] == true;
        },
        handleEvent : function(evt) {
            switch (evt.type) {
            case "dataAvailable":
                /**
                 * Attached selection events to newly available nodes.
                 */
                for ( var nodeIndex = evt.startIndex; nodeIndex <= evt.endIndex; nodeIndex++) {
                    evt.data[nodeIndex].addEventListener("selectAction", this);
                    evt.data[nodeIndex].setShowChildSelected(this._showChildSelected);
                }
                break;
            case "selectAction":
                /**
                 * Handle selection related Events triggered on nodes which are
                 * part of this Tree Model.
                 */
                if (evt.actionCommand == "selected") {
                    this.selectedNodes[evt.nodeId] = true;
                } else if (evt.actionCommand == "deSelected") {
                    this.selectedNodes[evt.nodeId] = false;
                }
                /**
                 * Dispatch select action from the model for other components to
                 * listen to.
                 */
                this.dispatch("selectAction", {
                    "actionCommand" : evt.actionCommand,
                    "nodeId" : evt.nodeId
                });
                break;
            }
            /**
             * call to super class' handleEvent method
             */
            SFAbstractTreeModel.prototype.handleEvent.call(this, evt);
        },
        cleanup : function() {
            for ( var nodeEl in this._nodeIdMap) {
                this.getNodeById(nodeEl).removeEventListener("selectAction", this);
            }
            SFAbstractTreeModel.prototype.cleanup.call(this);
        }
    });
})();

/**
 * Restricts selection to 1 item at a time. extends from SFMultiSelectTreeModel.
 * 
 * @param dao
 */
function SFSingleSelectTreeModel(dao) {
    this._init(dao);
}
SFSingleSelectTreeModel.prototype = (function() {
    return set(new SFMultiSelectTreeModel(), {
        _init : function(dao) {
            SFMultiSelectTreeModel.prototype._init.call(this, dao);
        },
        handleEvent : function(evt) {
            switch (evt.type) {
            case "selectAction":
                if (evt.actionCommand == "selected") {
                    for ( var selectedNode in this.selectedNodes) {
                        if (this.selectedNodes[selectedNode] == true) {
                            this.getNodeById(selectedNode).deSelect();
                        }
                    }
                }
                break;
            }
            SFMultiSelectTreeModel.prototype.handleEvent.call(this, evt);
        }
    });
})();
