//! include /ui/juic/js/core/component.js
//! include /ui/extlib/fckeditor_2.6.4/fckeditor.js
//! include /ui/extlib/fckeditor_sf_plugins/documentEditor/DocumentEditorUtil.js

/**
 * This is a JUIC wrapper on the open source WYSIWYG text editor FCKeditor available at http://docs.fckeditor.net/ .
 *
 * @param instanceName
 * @param sizeConfig  width and height of editor
 * @param config    this object specifies configurations you can make (toolbars, skins, etc)
 * @param value
 */
function SFDocumentEditor(instanceName, sizeConfig, config, value) {
  this.register();
  this.init(instanceName, sizeConfig, config, value);
}

SFDocumentEditor.prototype = (function() {

  return set(new Component(), {

    init : function(instanceName, sizeConfig, config, value) {
      assert(instanceName && instanceName.length > 0, 'SFFCKeditor: Please provide an instanceName');
      
      this._config = config;

      var width = '100%', height = '200';
      if (sizeConfig) {
        width = sizeConfig.width ? sizeConfig.width : width;
        height = sizeConfig.height ? sizeConfig.height : height; 
      }

      //instantiate fckeditor
      this._fck = new FCKeditor(instanceName, width, height);
      this._fck.BasePath = "/ui/extlib/fckeditor_2.6.4/";

      //set config params
      if (config) {
        if (config.customConfigPath)
          this._fck.Config["CustomConfigurationsPath"] = config.customConfigPath;

        if (config.toolbar)
          this._fck.ToolbarSet = config.toolbar;
      }

      if (value)
        this.setValue(value);

      // Give this object a unique id; store in global scope. This is used for the spellchecker plugin.
      // This variable will be present regardless if the spellchecker is confgured for this object
      this._spId = 'glui' + new Date().getTime();
      window.parent[this._spId] = this;
      this._fck.Config.documentEditorId = this._spId;
    },

    renderHtml : function (h) {
      h.push('<div id="' + this.id + '">' + this._fck.CreateHtml() + '</div>');
    },

    getText : function() {
      return FCKeditorAPI.GetInstance(this._fck.InstanceName).EditorWindow.parent.FCK.GetHTML() ;
    },

    setText : function(newText) {
      FCKeditorAPI.GetInstance(this._fck.InstanceName).EditorWindow.parent.FCK.SetData(newText) ;
    },

    setValue : function(value) {
      this.setText(value);
    },

    cleanup : function() {
      if (this._fck) this._fck = null;
      window.parent[this._spId] = null;
      
      this.unregister();
    },
    setPluginData : function(data /* Object */) {
      for (var key in data) {
        this._fck.Config[key] = data[key];
      }
    }

  });
})();
