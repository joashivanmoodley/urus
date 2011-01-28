/**
 * This object will pre-process an array of spacing objects and provides a
 * method which will determine how to allocate a given amount of space over the
 * provided spacing objects.
 * 
 * @param spacing The spacing JSON objects with the following optional
 *            properties: { weight: number, minSize: integer, maxSize: integer }
 * @param options The options for this spacing
 */
function SFSpacingManager(spacing, options) {
    this._init(spacing, options);
}

SFSpacingManager.prototype = ( function() {
    var DEFAULT_BOUNDED = false;
    var DEFAULT_WEIGHT = 1;
    var DEFAULT_MINSIZE = 0;
    var DEFAULT_ADJUSTMENT_TYPE = 'simple';
    var ADJUSTMENT_TYPES = [ 'simple', 'adjacent', 'cascade', 'distribute' ];

    /**
     * Helper apply the min/max to a given value.
     * 
     * @param value : A number
     * @param min : The min to apply (optional)
     * @param max : The max to apply (optional)
     * @return The closest number to value that fits in the min/max bounds
     */
    function applyMinMax(value, min, max) {
        if (min != null && value < min) {
            return min;
        }
        if (max != null && value > max) {
            return max;
        }
        return value;
    }

    /**
     * Helper method which will assign the given size to the space returning the
     * change in spacing. This method will consider min/max size and will not
     * blindly assign the given size to the space.
     * 
     * @param space The spacing object
     * @param idealSize The size this spacing object should become
     * @param underMaxList A list of spacing that can increase in size because
     *            its size is under the maximum
     * @param underMinList A list of spacing that can decrease in size because
     *            its size is over the minimum
     * @return The change in this spacing object's size
     */
    function getSingleDelta(space, idealSize, underMaxList, overMinList) {
        var oldSize = space.size;
        space.size = applyMinMax(idealSize, space.minSize, space.maxSize);
        if (!space.maxSize || space.size < space.maxSize) {
            underMaxList.push(space);
        }
        if (space.size > space.minSize) {
            overMinList.push(space);
        }
        return space.size - (oldSize == null ? 0 : oldSize);
    }

    return {
        /**
         * Initialize the spacing.
         * 
         * @param spacing: Array of spacing objects
         * @param options: The options for this spacing
         */
        _init : function(spacing, options) {
            assert(spacing instanceof Array, 'Must provide a spacing array');

            this._bounded = (options && options.bounded) || DEFAULT_BOUNDED;
            this._adjustmentType = (options && options.adjustmentType) || DEFAULT_ADJUSTMENT_TYPE;
            assert(ADJUSTMENT_TYPES.contains(this._adjustmentType), 'Invalid adjustment type: ' + this._adjustmentType);

            this._spacing = [];
            for ( var idx = 0, len = spacing.length; idx < len; idx++) {
                this._spacing.push(this._createSpacing(idx, spacing[idx]));
            }

            this._refreshTotals();
        },

        /**
         * Insert the given space object into the spacing manager.
         * 
         * @param index {integer} The index to insert into
         * @param space {Object} The space object to insert
         */
        insertInto : function(index, space) {
            this.insertMultipleInto(index, [ space ]);
        },

        /**
         * Insert more than one spacing object into the spacing manager.
         * 
         * @param index {integer} The index to insert into
         * @param space {Object[]} The space objects to insert
         */
        insertMultipleInto : function(index, space) {
            var len = this._spacing.length;
            assert(typeof index == 'number' && index >= 0 && index <= len, 'Invalid index: ' + index + ', max = ' + len);
            assert(space instanceof Array, 'Space must be an array');
            var insertLen = space.length;
            var spacing = [];
            for ( var idx = 0; idx < space.length; idx++) {
                spacing.push(this._createSpacing(index + idx, space[idx]));
            }
            spacing.splice(0, 0, index, 0);
            this._spacing.splice.apply(this._spacing, spacing);
            for ( var idx = index + insertLen; idx < len + insertLen; idx++) {
                this._spacing[idx].index = idx;
            }
            this._refreshTotals();
            if (this._allocatedSize != null) {
                var allocateAll = false;
                for ( var idx = index; idx < index + insertLen; idx++) {
                    var space = this._spacing[index];
                    var changed = false;
                    if (space.fixedSize) {
                        space.size = space.fixedSize;
                        this._distributeDelta(-space.size);
                    } else if (this._actualSize <= this._allocatedSize) {
                        allocateAll = true;
                        break;
                    } else if (this._actualSize > this._allocatedSize) {
                        space.size = space.minSize;
                    }
                }
                if (allocateAll) {
                    this._allocateAllSizes(this._allocatedSize);
                }
                this._updateActualSize();
            }
        },

        /**
         * Move one index to another.
         * 
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         * @param count {integer} The number of cells to move
         */
        move : function(index0, index1, count) {
            this._validateIndex(index0);
            this._validateIndex(index1);
            count = count || 1;
            assert(count >= 0, '[SFSpacingManager] Invalid count: ' + count);
            this._validateIndex(index0 + count - 1);
            this._validateIndex(index1 + count - 1);
            if (index0 != index1) {
                var minIndex = Math.min(index0, index1);
                var maxIndex = Math.max(index0, index1, index1 + count - 1);
                var removed = this._spacing.splice(index0, count);
                removed.splice(0, 0, index1, 0);
                this._spacing.splice.apply(this._spacing, removed);
                for ( var idx = minIndex; idx <= maxIndex; idx++) {
                    this._spacing[idx].index = idx;
                }
            }
        },

        /**
         * Remove the given space from the spacing manager.
         * 
         * @param index0 {integer} The from index
         * @param count {integer} The number of spacing to remove
         */
        remove : function(index0, count) {
            if (count == null) {
                count = 1;
            }
            var index1 = index0 + count - 1;
            this._validateIndex(index0);
            this._validateIndex(index1);
            var totalSize = 0;
            for ( var idx = index0; idx <= index1; idx++) {
                var space = this._spacing[index0];
                totalSize += space.size;
                this._spacing.splice(index0, 1);
            }
            for ( var idx = index1, len = this._spacing.length; idx < len; idx++) {
                this._spacing[idx].index = idx;
            }
            this._refreshTotals();
            if (this._allocatedSize != null) {
                if (this._actualSize - totalSize < this._allocatedSize) {
                    var newSize = this._actualSize - totalSize;
                    var delta = Math.min(this._allocatedSize - newSize, totalSize);
                    this._distributeDelta(delta);
                }
            }
            this._updateActualSize();
        },

        /**
         * Allocate the given size (i.e. in pixels) according to the rules
         * provided in this spacing info.
         * 
         * @param size: An integer quantity (must be greater than 0)
         * @return An array of sizes which should add up to the input size that
         *         follow the rules of this spacing info
         */
        allocate : function(size) {
            assert(typeof size == 'number' && size > 0, 'Provide a positive numerical value to allocate.');

            if (this._allocatedSize != size) {
                if (this._allocatedSize != null) {
                    if ((this._actualSize > this._allocatedSize && size > this._actualSize)
                            || this._actualSize <= this._allocatedSize) {
                        this._distributeDelta(size - this._actualSize);
                    }
                } else {
                    this._allocateAllSizes(size);
                }
                this._allocatedSize = size;
            }

            var sizes = [];
            this._updateActualSize();
            for ( var idx = 0, len = this._spacing.length; idx < len; idx++) {
                sizes[idx] = this._spacing[idx].size;
            }

            return sizes;
        },

        /**
         * Set a customized size for a particular spacing.
         * 
         * @param index : index of spacing
         * @param size : number - the new customized size for this spacing
         */
        setCustomSize : function(index, size) {
            size = parseInt(size);
            assert(typeof index == 'number' && index < this._spacing.length, 'Index is invalid: ' + index);
            var space = this._spacing[index];

            var bounds = this.getBounds(index);

            var oldSize = space.size;
            space.size = size;

            if (space.fixedSize >= 0) {
                space.fixedSize = size;
                space.minSize = size;
                space.maxSize = size;
                this._fixedSpace += size - oldSize;
            }

            switch (this._adjustmentType) {
            case 'simple':
                break;
            case 'adjacent':
                this._adjustAdjacent(oldSize - size, index);
                break;
            case 'cascade':
                this._adjustCascade(oldSize - size, index);
                break;
            case 'distribute':
                this._distributeDelta(oldSize - size, index);
                break;
            }
            this._updateActualSize();
        },

        /**
         * Set all the sizes.
         * 
         * @param sizes {int[]} All the sizes to set
         */
        setSizes : function(sizes) {
            assert(sizes instanceof Array && sizes.length == this._spacing.length,
                    'sizes must be an array of length ' + this._spacing.length);
            for ( var idx = 0; idx < this._spacing.length; idx++) {
                this._spacing[idx].size = parseInt(sizes[idx]);
            }
            this._updateActualSize();
        },

        /**
         * Retrieve the last actual size for this spacing manager.
         */
        getActualSize : function() {
            return this._actualSize;
        },

        /**
         * Retrieve the minimum size this spacing can support.
         */
        getMinimumSpace : function() {
            return this._minimumSpace;
        },

        /**
         * Return the number of spacing elements.
         * 
         * @return integer : number of spacing elements
         */
        size : function() {
            return this._spacing.length;
        },

        /**
         * Get the min/max for the input index.
         * 
         * @param index : index of spacing
         * @return JSON {minSize: number, maxSize: number}
         */
        getBounds : function(index) {
            this._validateIndex(index);
            var spacing = this._spacing[index];
            var bounds = {
                minSize :spacing.minSize,
                maxSize :spacing.maxSize
            };

            if (this._bounded) {
                switch (this._adjustmentType) {
                case 'adjacent':
                    if (index == this._spacing.length - 1) {
                        bounds.minSize = spacing.size;
                        bounds.maxSize = spacing.size;
                    } else {
                        var nextSpace = this._spacing[index + 1];
                        var nextCanExpand = nextSpace.maxSize != null ? nextSpace.maxSize - nextSpace.size
                                : Number.MAX_VALUE;
                        var nextCanDecrease = nextSpace.size - nextSpace.minSize;
                        var canExpand = spacing.maxSize != null ? spacing.maxSize - spacing.size : Number.MAX_VALUE;
                        var canDecrease = spacing.size - spacing.minSize;
                        bounds.minSize = spacing.size - Math.min(nextCanExpand, canDecrease);
                        bounds.maxSize = spacing.size + Math.min(canExpand, nextCanDecrease);
                    }
                    break;
                case 'distribute':
                case 'cascade':
                    bounds.maxSize = Math.min(bounds.minSize + this._actualSize - this._minimumSpace, bounds.maxSize
                            || Number.MAX_VALUE);
                    break;
                }
            }

            return bounds;
        },

        /**
         * Update the bounds for a particular index.
         * 
         * @param index {integer} The integer to change
         * @param bounds {minSize, maxSize} Object containing the bounds
         */
        setBounds : function(index, bounds) {
            this._validateIndex(index);
            var spacing = this._spacing[index];
            var changed = false;
            if (bounds && bounds.minSize != null) {
                spacing.minSize = bounds.minSize;
            }
            if (bounds && bounds.maxSize != null) {
                spacing.maxSize = bounds.maxSize;
            }
            if (spacing.minSize != spacing.maxSize) {
                spacing.fixedSize = undefined;
            }
        },

        /**
         * Set the spacing options.
         * 
         * @param index {integer} The index of the row/column
         * @param options {Object} The spacing options
         */
        setHidden : function(index, hidden) {
            this._validateIndex(index);
            var space = this._spacing[index];
            if (space.hidden != hidden) {
                space.hidden = hidden;
                if (this._allocatedSize != null) {
                    if (space.hidden) {
                        this._actualSize -= space.size;
                        this._refreshTotals();
                        this._distributeDelta(this._allocatedSize - this._actualSize);
                    } else if (space.size) {
                        this._actualSize += space.size;
                        this._distributeDelta(this._allocatedSize - this._actualSize);
                        this._refreshTotals();
                    } else {
                        this._refreshTotals();
                        this._allocateAllSizes(this._allocatedSize);
                    }
                } else {
                    this._refreshTotals();
                }
                this._updateActualSize();
            }
        },

        /**
         * Refresh the total variables used in calculations.
         */
        _refreshTotals : function() {
            this._spacingNotFixed = [];
            this._totalWeight = 0;
            this._fixedSpace = 0;
            this._minimumSpace = 0;

            for ( var idx = 0, len = this._spacing.length; idx < len; idx++) {
                var space = this._spacing[idx];

                if (!space.hidden) {
                    if (space.fixedSize != null) {
                        this._fixedSpace += space.fixedSize;
                        assert(space.fixedSize > 0, 'fixedSize must be a positive number');
                    } else {
                        this._totalWeight += space.weight;
                        this._spacingNotFixed.push(space);
                    }

                    this._minimumSpace += space.fixedSize || space.minSize;
                }
            }
        },

        /**
         * Create the spacing object to place internally. This method will
         * sterilize any input passed in.
         * 
         * @param idx {integer} The index of this spacing
         * @param options {Object} The input options
         */
        _createSpacing : function(idx, options) {
            var space = {
                index :idx,
                weight :options.weight,
                minSize :options.minSize,
                maxSize :options.maxSize,
                fixedSize :options.fixedSize,
                hidden :options.hidden
            };

            if (space.weight == null) {
                space.weight = DEFAULT_WEIGHT;
            }
            assert(space.weight >= 0, 'weight must be a non-negative number');

            if (space.minSize == null) {
                space.minSize = DEFAULT_MINSIZE;
            } else {
                var minSize = space.minSize = parseInt(space.minSize);
                assert(minSize > 0, 'minSize must be a positive number')
            }

            if (space.maxSize != null) {
                space.maxSize = parseInt(space.maxSize);
            }

            if (space.minSize != null && space.maxSize != null) {
                if (space.minSize == space.maxSize) {
                    space.fixedSize = space.minSize;
                }
                assert(space.minSize <= space.maxSize, 'minSize cannot be greater than maxSize');
            }

            if (space.fixedSize != null) {
                var fixedSize = space.fixedSize = parseInt(space.fixedSize);
                space.size = fixedSize;
                space.minSize = space.fixedSize;
                space.maxSize = space.fixedSize;
                assert(space.fixedSize > 0, 'fixedSize must be a positive number');
            }

            return space;
        },

        /**
         * Update the _actualSize internal variable to total up all sizes inside
         * the space objects.
         */
        _updateActualSize : function() {
            this._actualSize = 0;
            for ( var idx = 0, len = this._spacing.length; idx < len; idx++) {
                if (!this._spacing[idx].hidden) {
                    this._actualSize += this._spacing[idx].size;
                }
            }
        },

        /**
         * Validate an index
         * 
         * @param index {integer} The index to validate
         */
        _validateIndex : function(index) {
            assert(typeof index == 'number' && index >= 0 && index < this._spacing.length, 'Index is invalid: ' + index);
        },

        /**
         * @param delta : The change in size (positive or negative)
         * @param startIndex : The index of the spacing to start from
         * @return The remaining delta
         */
        _adjustCascade : function(delta, startIndex) {
            for ( var idx = startIndex; delta != 0 && idx < this._spacing.length - 1; idx++) {
                delta = this._adjustAdjacent(delta, idx);
            }
            return delta;
        },

        /**
         * Adjust the spacing adjacent to the specified index by the specified
         * delta size.
         * 
         * @param delta : The change in size (positive or negative)
         * @param index : The index of the spacing
         * @return The remaining delta
         */
        _adjustAdjacent : function(delta, index) {
            if (index < this._spacing.length - 1) {
                var nextSpace = this._spacing[index + 1];
                var nextSize = applyMinMax(nextSpace.size + delta, nextSpace.minSize, nextSpace.maxSize);
                var smallDelta = nextSize - nextSpace.size;
                nextSpace.size = nextSize;
                delta -= smallDelta;
            }
            return delta;
        },

        /**
         * Distribute the given change in size to all non-fixed columns.
         * 
         * @param delta: number the change in size
         * @param startIndex : The index to start distributing from
         */
        _distributeDelta : function(delta, startIndex) {
            if (delta != 0) {
                var subset1 = [];
                var subset2 = [];
                for ( var idx = 0, len = this._spacingNotFixed.length; idx < len; idx++) {
                    var space = this._spacingNotFixed[idx];
                    if (space.index != startIndex) {
                        var subset = startIndex == null || space.index > startIndex ? subset1 : subset2;
                        if (delta < 0) {
                            if (space.size > space.minSize) {
                                subset.push(space);
                            }
                        } else if (space.maxSize == null || space.size < space.maxSize) {
                            subset.push(space);
                        }
                    }
                }
                delta = this._allocateOrDeallocate(subset1, delta, 0);
                if (subset1.length > 0 && startIndex != null && delta != 0) {
                    delta = this._allocateOrDeallocate(subset2, delta, 0);
                }
            }
            return delta;
        },

        /**
         * Private method which will set the size attribute on all spacing.
         * 
         * @param size : number The size to allocate
         */
        _allocateAllSizes : function(size) {
            if (this._spacing.length > 0) {
                var notFixedSpace = size - this._fixedSpace;
                if (this._minimumSpace < notFixedSpace) {
                    var leftOverSpace = notFixedSpace;
                    var underMaxList = [];
                    var overMinList = [];
                    for ( var idx = 0, len = this._spacingNotFixed.length; idx < len; idx++) {
                        var space = this._spacingNotFixed[idx];
                        var idealSize = Math.floor(space.weight * size / this._totalWeight);
                        getSingleDelta(space, idealSize, underMaxList, overMinList);
                        leftOverSpace -= space.size;
                    }
                    if (leftOverSpace != 0) {
                        this._allocateOrDeallocate(leftOverSpace < 0 ? overMinList : underMaxList, leftOverSpace, 0);
                    }
                } else {
                    for ( var idx = 0, len = this._spacing.length; idx < len; idx++) {
                        var space = this._spacing[idx];
                        space.size = space.minSize;
                    }
                }
            }
        },

        /**
         * Private method which recursively allocates or deallocates size to the
         * spacing as needed until there is no delta. The space is divided
         * evenly amongst the spacing provided in the subset.
         * 
         * @param subset: Array of spacing which can increase or decrease in
         *            size (depending on negativity of delta)
         * @param delta: The number of pixels to add/remove (depending on
         *            negativity)
         * @param timer: A counter to kill the recursion if it takes too long
         */
        _allocateOrDeallocate : function(subset, delta, timer) {
            /* Kill the recursion on this condition */
            if (delta == 0 || subset.length == 0 || timer > subset.length) {
                return delta;
            }

            var negate = delta < 0 ? -1 : 1;
            var modulus = Math.abs(delta);
            var division = negate * Math.floor(modulus / subset.length);
            var remainder = modulus % subset.length;

            if (division == 0) {
                /* If division was 0, means the delta is really small. */
                for ( var idx = 0; idx < modulus; idx++) {
                    subset[idx].size += negate;
                }
            } else {
                /* These are used for the recursive subset. */
                var underMaxList = [];
                var overMinList = [];

                /* Attempt to divide out the delta amongst the subset. */
                for ( var idx = 0, len = subset.length; idx < len; idx++) {
                    var space = subset[idx];
                    var offset = negate * (idx < remainder ? 1 : 0);
                    var idealSize = space.size + division + offset;
                    delta -= getSingleDelta(space, idealSize, underMaxList, overMinList);
                }

                /* Unlikely, but due to min/max we may need to recurse. */
                if (delta != 0) {
                    delta = this._allocateOrDeallocate(delta < 0 ? overMinList : underMaxList, delta, timer + 1);
                }
            }

            return delta;
        }
    }
})();