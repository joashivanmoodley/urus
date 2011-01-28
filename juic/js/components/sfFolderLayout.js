//! include /ui/juic/js/core/component.js
//! include /ui/uicore/css/bun_folder.css
//! include /ui/jsfcore/css/menuBar.css
//! include /ui/uicore/js/BunUtils.js

/**
 * Abstract layout component for the folder layout
 * Note that there is no value nor config associated with this object.
 * All content is loaded via the "set<Area>" methods.
 *
 * The fundamental idea behind this object construct is to follow the paradigm of an
 * object "has" as opposed to "is." We want to make the layout components as generic
 * as possible and provide the means to manipulate its various sub-components, but not
 * necessarily equate them to something.
 */
function SFFolderLayout() {
  this.register();
  this.init();
}

SFFolderLayout.prototype = (function() {
  return set(new Component(), {
      init : function() {
        this.setResizer();
        this._tab = new SFFolderTab();
        this._head = new SFFolderTopNav();
        this._body = new SFFolderBody();
        this._foot = new SFFolderFoot();
        this._overlay = new SFFolderOverlay();
      },
      renderHtml : function(h) {
        h.push("<div id=\"" + this.id + "\" class=\"hb_main\">");
        this._tab.renderHtml(h);
        h.push("<div class=\"round bun folder\">");
        this._head.renderHtml(h);
        this._body.renderHtml(h);
        this._foot.renderHtml(h);
        h.push("<span class=\"cb\"><span class=\"cl\">&nbsp;</span></span></div>");

        this._overlay.renderHtml(h);
      },
      setResizer : function() {
          YAHOO.util.Event.addListener(window,"resize", this.resize());
      },
      resize : function() {
          if (this._body) {
              var buns = [this._body.id];
              BunUtils.addBuns(buns);
              BunUtils.resizeHambun();
          }
      },
      getTab : function() {
        return this._tab;
      },
      setFolderTab : function(component) {
        this._tab.setFolderTabComponent(component);
      },
      setToolbar : function(component) {
        this._tab.setToolbarComponent(component);
      },
      setHead : function(component) {
        this._head.setComponent(component);
      },
      getHead : function() {
        return this._head;
      },
      setBody : function(component) {
        this._body.setComponent(component);
      },
      getBody : function() {
        return this._body;
      },
      setFoot : function(component) {
        this._foot.setComponent(component);
      },
      getFoot : function() {
        return this._foot;
      },
      setOverlay : function(component) {
        this._overlay.setComponent(component);
      },
      getOverlay : function() {
        return this._overlay;
      }
  });
})();

/**
 * This is abstract, so it has no value nor config.
 * All interaction with this component is done via the SFFolder itself.  This will render the folder text (or
 * whatever component is placed in it) and the menu bar that is placed next to the folder tab.  
 */
function SFFolderTab() {
  this.register();
}

SFFolderTab.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<div class=\"folder_tab\">");
            h.push("<div class=\"folder_tab_l\"></div>");
            h.push("<div class=\"folder_tab_m\">");
            h.push("<div id=\"" + this.id + "_tab\">");
            if (this._folderTabComponent) {
                this._folderTabComponent.renderHtml(h);
            }
            h.push("</div></div>");
            h.push("<div class=\"folder_tab_r\"></div>");
            h.push("<div class=\"toolbar\">");
            h.push("<div id=\"" + this.id + "_toolbar\">");
            if (this._toolbarComponent) {
                this._toolbarComponent.renderHtml(h);
            }
            h.push("</div>");
            h.push("</div></div>");
        },

        setFolderTabComponent : function(folderTabComponent) {
            this._folderTabComponent = folderTabComponent;
            if ($(this.id + "_tab")) {
                this._folderTabComponent.render(this.id + "_tab");
            }
        },

        getFolderTabComponent : function() {
            return this._folderTabComponent;
        },

        setToolbarComponent : function(toolbarComponent) {
            this._toolbarComponent = toolbarComponent;
            if ($(this.id + "_toolbar")) {
                this._toolbarComponent.render(this.id + "_toolbar");
            }
        },

        getToolbarComponent : function() {
            return this._toolbarComponent;
        }
  });
})();

/** Page top navigation component
 * Again, this is abstract, so it has no value nor config.
 * All interaction with this component is done via the SFFolder itself.
 */
function SFFolderTopNav() {
  this.register();
}

SFFolderTopNav.prototype = (function() {
  return set(new Component(), {
    renderHtml : function(h) {
        h.push("<div id=\"" + this.id + "\"><span class=\"ct\"><span class=\"cl\">&nbsp;</span></span>");
        h.push("<div class=\"hd\">");
        if (this._component) {
            this._component.renderHtml(h);
        }
        if (this._spacer) {
            h.push("<div class=\"spacer\"/>");
            h.push("<div class=\"spacer\"/>");

        }
        h.push("</div></div>");
    },
    setComponent : function(component) {
        this._component = component;
        if ($(this.id)) {
            this._component.render(this.id);
        }
    },

    setSpacer : function(spacer) {
      this._spacer = spacer;
    }

  });
})();

/**
 * This is kind of a compound component in that it provides the HTML structure,
 * while the viewpane that is created in its init handles all the content.
 * This makes it easier to isolate the control of padding and margin in
 * the content to a sub-component who's sole duty is to hold HTML.
 */
function SFFolderBody() {
  this.register();
}

SFFolderBody.prototype = (function() {
  return set(new Component(), {
    renderHtml : function(h) {
        h.push("<div id=\"" + this.id + "\" class=\"bd scrollable\">");
        if (this._component) {
            this._component.renderHtml(h);
        }
        h.push("</div>");
    },
    setComponent : function(component) {
        this._component = component;
        if ($(this.id)) {
            this._component.render(this.id);
        }
    }
  });
})();

/**
 * Abstract footer component for the SFFolder.  Since the footer has no wrapping html, the component is merely
 * embedded directly.
 */
function SFFolderFoot() {
  this.register();
}

SFFolderFoot.prototype = (function() {
  return set(new Component(), {
    renderHtml : function(h) {
        h.push("<div class=\"button_row\">");
        h.push("<div class=\"right\" id=\"" + this.id + "\">");
        if (this._component) {
            this._component.renderHtml(h);
        }
        h.push("</div>");
        h.push("</div>");
    },
    setComponent : function(component) {
        this._component = component;
        if ($(this.id)) {
            this._component.render(this.id);
        }
    }
  });
})();

/**
 * Abstract overlay component for the folder.
 */
function SFFolderOverlay() {
  this.register();
}

SFFolderOverlay.prototype = (function() {
  return set(new Component(), {
    renderHtml : function(h) {
      h.push("<div  id=\"" + this.id + "\"></div>");
    },
    setComponent : function(component) {
      if ($(this.id))
        component.render(this.id);
    }
  });
})();
