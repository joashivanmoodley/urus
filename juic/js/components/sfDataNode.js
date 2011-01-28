/**
 * Implements a generic Data Node definition. Note that has a NodeId and a
 * default renderHtml. It is expected that implementing Component would provide
 * it's own renderHtml implementation.
 * 
 * @param nodeId this is either 
 *  - provided as a constructor parameter
 *  - set when init is called
 *  - generated automatically with a node(n) format
 */
function SFDataNode(nodeId) {
    this._init(nodeId);
}
SFDataNode.nodeGen = 0;
SFDataNode.prototype = (function() {
    return set(new Component(), {
        _init : function(nodeId) {
            this._nodeId = typeof (nodeId) == 'undefined' ? "node" + (++SFDataNode.nodeGen) : nodeId;
        },
        setNodeId : function(nodeIdentifier) {
            this._nodeId = nodeIdentifier;
        },
        getNodeId : function() {
            return this._nodeId;
        },
        renderHtml : function(html) {
            html.push(this.getNodeId());
        }
    });
})();
