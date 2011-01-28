function SFColorUtil() {
}

/**
 * Validate that the hex code input is valid.
 * 
 * @para hex {String} the hex to validate
 */
SFColorUtil.isValidHex = function(hex) {
    return typeof hex == 'string' && /^[A-F0-9]{6}$/i.test(hex);
}

/**
 * Converts 0-1 to 0-255
 * 
 * @method real2dec
 * @param nVal {float} the number to convert
 * @return {int} a number 0-255
 */
SFColorUtil.real2dec = function(nVal) {
    return Math.min(255, Math.round(nVal * 256));
}

/**
 * Converts an int 0...255 to hex pair 00...FF
 * 
 * @method dec2hex
 * @param nVal {int} the number to convert
 * @return {string} the hex equivalent
 */
SFColorUtil.dec2hex = function(nVal) {
    nVal = parseInt(nVal, 10) | 0;
    nVal = (nVal > 255 || nVal < 0) ? 0 : nVal;

    return ("0" + nVal.toString(16)).slice(-2).toUpperCase();
}

/**
 * Converts decimal rgb values into a hex string 255,255,255 -> FFFFFF
 * 
 * @method rgb2hex
 * @param rVal {int|[int, int, int]} the red value, or an array containing all
 *            three parameters
 * @param gVal {int} the green value
 * @param bVal {int} the blue value
 * @return {string} the hex string
 */
SFColorUtil.rgb2hex = function(rVal, gVal, bVal) {
    if (rVal instanceof Array) {
        return SFColorUtil.rgb2hex.apply(SFColorUtil, rVal);
    }
    return SFColorUtil.dec2hex(rVal) + SFColorUtil.dec2hex(gVal) + SFColorUtil.dec2hex(bVal);
}

/**
 * Converts a hex pair 00...FF to an int 0...255
 * 
 * @method hex2dec
 * @param str {string} the hex pair to convert
 * @return {int} the decimal
 */
SFColorUtil.hex2dec = function(str) {
    return parseInt(str, 16);
}

/**
 * Converts a hex string to rgb
 * 
 * @method hex2rgb
 * @param str {string} the hex string
 * @return {[int, int, int]} an array containing the rgb values
 */
SFColorUtil.hex2rgb = function(str) {
    assert(SFColorUtil.isValidHex(str), 'Invalid color: ' + this._color);
    return [ SFColorUtil.hex2dec(str.slice(0, 2)), SFColorUtil.hex2dec(str.slice(2, 4)),
            SFColorUtil.hex2dec(str.slice(4, 6)) ];
}

/**
 * Converts HSV (h[0-360], s[0-1]), v[0-1] to RGB [255,255,255]
 * 
 * @method hsv2rgb
 * @param h {int|[int, float, float]} the hue, or an array containing all three
 *            parameters
 * @param s {float} the saturation
 * @param v {float} the value/brightness
 * @return {[int, int, int]} the red, green, blue values in decimal.
 */
SFColorUtil.hsv2rgb = function(hVal, sVal, vVal) {
    if (hVal instanceof Array) {
        return SFColorUtil.hsv2rgb.apply(SFColorUtil, hVal);
    }

    var rVal, gVal, bVal;
    var iVal = Math.floor((hVal / 60) % 6);
    var fVal = (hVal / 60) - iVal;
    var pVal = vVal * (1 - sVal);
    var qVal = vVal * (1 - fVal * sVal);
    var tVal = vVal * (1 - (1 - fVal) * sVal);

    switch (iVal) {
    case 0:
        rVal = vVal;
        gVal = tVal;
        bVal = pVal;
        break;
    case 1:
        rVal = qVal;
        gVal = vVal;
        bVal = pVal;
        break;
    case 2:
        rVal = pVal;
        gVal = vVal;
        bVal = tVal;
        break;
    case 3:
        rVal = pVal;
        gVal = qVal;
        bVal = vVal;
        break;
    case 4:
        rVal = tVal;
        gVal = pVal;
        bVal = vVal;
        break;
    case 5:
        rVal = vVal;
        gVal = pVal;
        bVal = qVal;
        break;
    }

    return [ SFColorUtil.real2dec(rVal), SFColorUtil.real2dec(gVal), SFColorUtil.real2dec(bVal) ];
}

/**
 * Converts to RGB [255,255,255] to HSV (h[0-360], s[0-1]), v[0-1]
 * 
 * @method rgb2hsv
 * @param rVal {int|[int, int, int]} the red value, or an array containing all
 *            three parameters
 * @param gVal {int} the green value
 * @param bVal {int} the blue value
 * @return {[int, float, float]} the value converted to hsv
 */
SFColorUtil.rgb2hsv = function(rVal, gVal, bVal) {
    if (rVal instanceof Array) {
        return SFColorUtil.rgb2hsv.apply(SFColorUtil, rVal);
    }

    rVal /= 255;
    gVal /= 255;
    bVal /= 255;

    var hVal, sVal;
    var min = Math.min(Math.min(rVal, gVal), bVal);
    var max = Math.max(Math.max(rVal, gVal), bVal);
    var delta = max - min, hsv;

    switch (max) {
    case min:
        hVal = 0;
        break;
    case rVal:
        hVal = 60 * (gVal - bVal) / delta;
        if (gVal < bVal) {
            hVal += 360;
        }
        break;
    case gVal:
        hVal = (60 * (bVal - rVal) / delta) + 120;
        break;
    case bVal:
        hVal = (60 * (rVal - gVal) / delta) + 240;
        break;
    }

    sVal = (max === 0) ? 0 : 1 - (min / max);

    hsv = [ Math.round(hVal), sVal, max ];

    return hsv;
}

/**
 * Returns the closest websafe color to the supplied rgb value.
 * 
 * @method websafe
 * @param rVal {int|[int, int, int]} the red value, or an array containing all
 *            three parameters
 * @param gVal {int} the green value
 * @param bVal {int} the blue value
 * @return {[int, int, int]} an array containing the closes websafe rgb colors.
 */
SFColorUtil.websafe = function(rVal, gVal, bVal) {
    if (rVal instanceof Array) {
        return SFColorUtil.websafe.apply(SFColorUtil, rVal);
    }

    // returns the closest match [0, 51, 102, 153, 204, 255]
    var fn = function(val) {
        if (typeof val == 'number') {
            val = Math.min(Math.max(0, val), 255);
            var idx, next;
            for (idx = 0; idx < 256; idx = idx + 51) {
                next = idx + 51;
                if (val >= idx && val <= next) {
                    return (val - idx > 25) ? next : idx;
                }
            }
        }

        return val;
    };

    return [ fn(rVal), fn(gVal), fn(bVal) ];
}