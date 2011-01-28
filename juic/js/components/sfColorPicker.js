//! include /ui/juic/js/core/component.js
//! include /ui/static/css/components/sfColorPicker.css
//! include /ui/juic/js/components/sfCommandButton.js
//! include /ui/juic/js/components/sfOverlayMgr.js
//! include /ui/juic/js/components/sfPositionManager.js
//! include /ui/juic/js/components/sfDragDropMgr.js
//! include /ui/juic/js/components/sfColorUtil.js

/**
 * Use the SFColorDialog to display a color picker inside a yellow div with a
 * Done and Cancel button.
 * 
 * @param color The 6 digit hexidecimal color to display by default
 */
function SFColorDialog(color) {
    this.register();
    this._colorPicker = new SFColorPicker(color);
    var done = new SFCommandButton(jsSFMessages.COMMON_Done, true);
    done.setSize('sml');
    done.setActionCommand('done');
    var cancel = new SFCommandButton(jsSFMessages.COMMON_Cancel, false);
    cancel.setSize('sml');
    cancel.setActionCommand('cancel');
    this._buttons = [ done, cancel ];
    for ( var idx = 0, len = this._buttons.length; idx < len; idx++) {
        this._buttons[idx].addEventListener('action', this);
    }
}

SFColorDialog.prototype = ( function() {
    return set(new Component(), {
        renderHtml : function(html) {
            html.push('<div id="', this.id, '" class="color-picker-dialog"><div class="bottomSpace"><strong>',
                    jsSFMessages.COMMON_ColorPicker_Please_Choose_Color,
                    '</strong></div>');
            this._colorPicker.renderHtml(html);
            html.push('<div class="button_row"><div class="right">');
            for ( var idx = 0, len = this._buttons.length; idx < len; idx++) {
                this._buttons[idx].renderHtml(html);
            }
            html.push('</div></div></div>');
        },

        handleEvent : function(event) {
            switch (event.type) {
            case 'action':
                switch (event.actionCommand) {
                case 'done':
                    this.dispatch('colorSelected', {
                        color :this.getColor()
                    });
                    this.dispatch('hide');
                    break;
                case 'cancel':
                    this.dispatch('hide');
                    break;
                }
                break;
            }
        },

        show : function(originId) {
            SFPositionManager.show(this, originId, {
                origin : {
                    vertical :"bottom",
                    horizontal :"right"
                },
                menu : {
                    vertical :"top",
                    horizontal :"left"
                }
            });
        },

        getColor : function() {
            return this._colorPicker.getColor();
        },

        setColor : function(color) {
            this._colorPicker.setColor(color);
        },
        
        cleanup : function() {
            for(var idx=0; idx<this._buttons.length; idx++) {
                this._buttons[idx].cleanup();
            }
            this._colorPicker.cleanup();
            this.unregister();
        }
    });
})();

function SFColorPicker(color) {
    this.register();
    this._init(color);
}

SFColorPicker.prototype = ( function() {
    var DEFAULT_COLOR = 'FFFFFF';
    var SMALL_COLOR_PADDING = 14;
    var PICKER_SIZE = 182;
    var PICKER_THUMB_OFFSET = -4;
    var HUE_THUMB_OFFSET = -8;
    var STANDARD_COLORS = [ 'ED9C00', 'B795FF', 'B4BE35', '63CBC6', 'EAA299', '9ABDF1' ];
    var STANDARD_COLOR_CLASSES = [ 'tangerine', 'purpleInk', 'moneyGreen', 'coolWave', 'springBlossom', 'tomorrowsBlue' ];

    function hasAnything(json) {
        if (json) {
            for ( var property in json) {
                return true;
            }
        }
        return false;
    }

    /**
     * Render all styles to an html array. <br>
     * !WARNING!: This method will not escape anything.
     * 
     * @param html : String array
     * @param style : JSON containing all styles
     */
    function renderStyle(html, style) {
        if (hasAnything(style)) {
            html.push(' style="');
            for ( var property in style) {
                html.push(property, ':', style[property], ';');
            }
            html.push('"');
        }
    }

    /**
     * Update the styles on a DOM element to match styles provided in the style
     * JSON.
     * 
     * @param el : HTML DOM Element
     * @param style : The style JSON
     */
    function updateStyle(el, style) {
        for ( var property in style) {
            YAHOO.util.Dom.setStyle(el, property, style[property]);
        }
    }

    /**
     * Key map to well-known commands for txt field input
     * 
     * @param e {Event} the keypress or keydown event
     * @return {int} a command code
     *         <ul>
     *         <li>0 = not a number, letter in range, or special key</li>
     *         <li>1 = number</li>
     *         <li>2 = a-fA-F</li>
     *         <li>3 = increment (up arrow)</li>
     *         <li>4 = decrement (down arrow)</li>
     *         <li>5 = special key (tab, delete, return, escape, left, right)</li>
     *         <li>6 = return</li>
     *         </ul>
     */
    function getCommand(event) {
        var charCode = YAHOO.util.Event.getCharCode(event);

        /* special keys */
        if (charCode === 38) { /* up arrow */
            return 3;
        } else if (charCode === 13) { /* return */
            return 6;
        } else if (charCode === 40) { /* down array */
            return 4;
        } else if (charCode >= 48 && charCode <= 57) { /* 0-9 */
            return 1;
        } else if (charCode >= 97 && charCode <= 102) { /* a-f */
            return 2;
        } else if (charCode >= 65 && charCode <= 70) { /* A-F */
            return 2;
        } else if ("8, 9, 13, 27, 37, 39".indexOf(charCode) > -1 || event.ctrlKey || event.metaKey) {
            return 5; /* special chars */
        } else { /* something we probably don't want */
            return 0;
        }
    }

    return set(new Component(), {
        _init : function(color) {
            this.setColor(color || DEFAULT_COLOR, true)
        },

        renderHtml : function(html) {
            var selectedColorTitle = sfMessageFormat.format(jsSFMessages.COMMON_ColorPicker_Current_Selected_Color,
                    this._color);
            var websafeTitle = sfMessageFormat.format(jsSFMessages.COMMON_ColorPicker_Closest_Websafe_Color,
                    this._websafe);

            html.push('<div id="', this.id, '" class="color-picker"><div id="', this.id, 'picker" class="picker-bg"');
            renderStyle(html, this._getPickerStyle());
            html.push(' title="', jsSFMessages.COMMON_ColorPicker_Click_To_Select_A_Color,
                    '" onmousedown="', this.fireCode('_firePickerMouseDown'), '"',
                    ' unselectable="on"><div id="', this.id, 'picker-thumb" class="picker-thumb"');
            renderStyle(html, this._getPickerThumbStyle());
            html.push('></div></div><div id="', this.id, 'hue" class="hue-bg"',
                    ' title="', jsSFMessages.COMMON_ColorPicker_Click_To_Select_A_Hue,
                    '" onmousedown="', this.fireCode('_fireHueMouseDown'), '" unselectable="on"><div id="',
                    this.id, 'hue-thumb" class="hue-thumb"');
            renderStyle(html, this._getHueThumbStyle());
            html.push('></div></div><div class="controls"><div class="bd"><ul class="rgb-controls"><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Red,
                    '">R <input maxlength="3" size="3" id="', this.id,
                    'r" value="', this._rgb[0], '" onchange="', this.fireCode('_onChange', 'r'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"></li><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Green,
                    '">G <input maxlength="3" size="3" id="', this.id,
                    'g" value="', this._rgb[1], '" onchange="', this.fireCode('_onChange', 'g'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"></li><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Blue,
                    '">B <input maxlength="3" size="3" id="', this.id,
                    'b" value="', this._rgb[2], '" onchange="', this.fireCode('_onChange', 'b'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"></li></ul><ul class="hsv-controls"><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Hue,
                    '">H <input maxlength="3" size="3" id="', this.id,
                    'h" value="', this._hsv[0], '" onchange="', this.fireCode('_onChange', 'h'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"> &deg;</li><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Saturation,
                    '">S <input maxlength="3" size="3" id="', this.id,
                    's" value="', Math.round(this._hsv[1] * 100), '" onchange="', this.fireCode('_onChange', 's'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"> %</li><li title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Value,
                    '">V <input maxlength="3" size="3" id="', this.id,
                    'v" value="', Math.round(this._hsv[2] * 100), '" onchange="', this.fireCode('_onChange', 'v'),
                    '" onkeydown="return ', this.fireCode('_fireNumericalKeyDown'),
                    '"> %</li></ul><div class="hex-controls" title="',
                    jsSFMessages.COMMON_ColorPicker_Enter_Hex,
                    '"># <input maxlength="6" size="6" id="', this.id,
                    'hex" value="', this._color, '" onchange="', this.fireCode('_onChange', 'hex'),
                    '" onkeydown="return ', this.fireCode('_fireHexKeyDown'),
                    '"></div></div></div><div id="', this.id, 'swatch" class="swatch"');
            renderStyle(html, this._getSwatchStyle());
            html.push(' title="', selectedColorTitle, '"></div><div id="', this.id, 
                    'websafe-swatch" class="websafe-swatch" title="', websafeTitle,
                    '" onclick="', this.fireCode('_onSelectWebsafe'), 'return false;"');
            renderStyle(html, this._getWebsafeSwatchStyle());
            html.push('></div><div class="standard-colors">');
            
            for ( var idx = 0, len = STANDARD_COLORS.length; idx < len; idx++) {
                var color = STANDARD_COLORS[idx];
                var className = STANDARD_COLOR_CLASSES[idx];
                var title = jsSFMessages['COMMON_ColorPicker_' + className];
                html.push('<div class="', className, ' small-color" title="', title, '"');
                renderStyle(html, {
                    'background-color' :'#' + color,
                    left :idx * SMALL_COLOR_PADDING + 'px'
                });
                html.push(' onclick="', this.fireCode('setColor', color), 'return false;"></div>');
            }
            
            html.push('</div></div>');
        },

        _onChange : function(type) {
            var valueStr = $(this.id + type).value;
            switch (type) {
            case 'r':
                this._rgb[0] = parseInt(valueStr) % 256;
                break;
            case 'g':
                this._rgb[1] = parseInt(valueStr) % 256;
                break;
            case 'b':
                this._rgb[2] = parseInt(valueStr) % 256;
                break;
            case 'h':
                this._hsv[0] = parseInt(valueStr) % 360;
                this._rgb = SFColorUtil.hsv2rgb(this._hsv);
                break;
            case 's':
                this._hsv[1] = (parseInt(valueStr) % 101) / 100;
                this._rgb = SFColorUtil.hsv2rgb(this._hsv);
                break;
            case 'v':
                this._hsv[2] = (parseInt(valueStr) % 101) / 100;
                this._rgb = SFColorUtil.hsv2rgb(this._hsv);
                break;
            case 'hex':
                while (valueStr.length < 6) {
                    valueStr += '0';
                }
                this._rgb = SFColorUtil.hex2rgb(valueStr);
                break;
            }
            this.setColor(this._rgb);
        },

        _onSelectWebsafe : function() {
            this.setColor(this._websafe);
        },

        _updateDOM : function() {
            var picker = $(this.id + 'picker-thumb');
            if (picker) {
                updateStyle(picker, this._getPickerThumbStyle());
                updateStyle(this.id + 'hue-thumb', this._getHueThumbStyle());
                updateStyle(this.id + 'picker', this._getPickerStyle());
                updateStyle(this.id + 'swatch', this._getSwatchStyle());
                updateStyle(this.id + 'websafe-swatch', this._getWebsafeSwatchStyle());
                $(this.id + 'r').value = this._rgb[0];
                $(this.id + 'g').value = this._rgb[1];
                $(this.id + 'b').value = this._rgb[2];
                $(this.id + 'h').value = this._hsv[0];
                $(this.id + 's').value = Math.round(this._hsv[1] * 100);
                $(this.id + 'v').value = Math.round(this._hsv[2] * 100);
                $(this.id + 'hex').value = this._color;
            }
        },

        _getHueThumbStyle : function() {
            return {
                top :(Math.round(PICKER_SIZE * (359 - (this._hsv[0] % 360)) / 359) + HUE_THUMB_OFFSET) + 'px'
            };
        },

        _getPickerThumbStyle : function() {
            return {
                top :(Math.round(PICKER_SIZE * (1 - this._hsv[2])) + PICKER_THUMB_OFFSET) + 'px',
                left :(Math.round(PICKER_SIZE * this._hsv[1]) + PICKER_THUMB_OFFSET) + 'px'
            };
        },

        _getPickerStyle : function() {
            return {
                'background-color' :'#' + SFColorUtil.rgb2hex(SFColorUtil.hsv2rgb(this._hsv[0], 1, 1))
            };
        },

        _getSwatchStyle : function() {
            return {
                'background-color' :'#' + this._color
            };
        },

        _getWebsafeSwatchStyle : function() {
            return {
                'background-color' :'#' + this._websafe
            };
        },

        getColor : function() {
            return this._color;
        },

        setColor : function(color, noEvent) {
            if (typeof color == 'string') {
                this._color = color.toUpperCase();
            } else if (color instanceof Array) {
                this._color = SFColorUtil.rgb2hex(color);
            } else if (color == null) {
                this._color = DEFAULT_COLOR;
            } else {
                assert(false, 'Invalid color: ' + color);
            }
            this._rgb = SFColorUtil.hex2rgb(this._color);
            this._hsv = SFColorUtil.rgb2hsv(this._rgb);
            this._websafe = SFColorUtil.rgb2hex(SFColorUtil.websafe(this._rgb));
            this._updateDOM();

            if (!noEvent) {
                this.dispatch('change', {
                    color :this._color
                });
            }
        },

        _setPickerColor : function(xy) {
            var pickerRegion = YAHOO.util.Dom.getRegion(this.id + 'picker');
            xy[0] = Math.min(Math.max(xy[0], pickerRegion.left), pickerRegion.right);
            xy[1] = Math.min(Math.max(xy[1], pickerRegion.top), pickerRegion.bottom);
            this._hsv[1] = (xy[0] - pickerRegion.left) / PICKER_SIZE;
            this._hsv[2] = (pickerRegion.bottom - xy[1]) / PICKER_SIZE;
            this._rgb = SFColorUtil.hsv2rgb(this._hsv);
            this._color = SFColorUtil.rgb2hex(this._rgb);
            this._websafe = SFColorUtil.rgb2hex(SFColorUtil.websafe(this._rgb));
            this._updateDOM();
        },

        _setHueColor : function(yVal) {
            var hueRegion = YAHOO.util.Dom.getRegion(this.id + 'hue');
            yVal = Math.min(Math.max(yVal, hueRegion.top), hueRegion.bottom);
            this._hsv[0] = Math.round((hueRegion.bottom - yVal) * 359 / (PICKER_SIZE + 1));
            this._rgb = SFColorUtil.hsv2rgb(this._hsv);
            this._color = SFColorUtil.rgb2hex(this._rgb);
            this._websafe = SFColorUtil.rgb2hex(SFColorUtil.websafe(this._rgb));
            this._updateDOM();
        },

        handlePickerDragEvent : function(event) {
            switch (event.type) {
            case 'drag':
            case 'dragEnd':
                this._setPickerColor( [ event.point.x, event.point.y ]);
                break;
            }
        },

        handleHueDragEvent : function(event) {
            switch (event.type) {
            case 'drag':
            case 'dragEnd':
                this._setHueColor(event.point.y);
                break;
            }
        },

        _firePickerMouseDown : function(event) {
            this._setPickerColor(YAHOO.util.Event.getXY(event || window.event));
            var me = this;
            SFDragDropMgr.handleMouseDown(event, {
                handleDragEvent : function(event) {
                    me.handlePickerDragEvent(event);
                }
            });
        },

        _fireHueMouseDown : function(event) {
            this._setHueColor(YAHOO.util.Event.getPageY(event || window.event));
            var me = this;
            SFDragDropMgr.handleMouseDown(event, {
                handleDragEvent : function(event) {
                    me.handleHueDragEvent(event);
                }
            });
        },

        _fireNumericalKeyDown : function(event) {
            return this._fireHexKeyDown(event, true);
        },

        _fireHexKeyDown : function(event, numbersOnly) {
            var command = getCommand(event || window.event);

            switch (command) {
            case 6: /* return */
            case 5: /* special char */
            case 1: /* number */
                break;
            case 2: /* hex char (a-f) */
                if (numbersOnly !== true) {
                    break;
                }

                /* fallthrough is intentional */

            default: /* prevent alpha and punctuation */
                YAHOO.util.Event.stopEvent(event);
                return false;
            }
        }
    });
})();