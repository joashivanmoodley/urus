/**
 * 
 */
package com.handle.csol.servlet;

import org.apache.log4j.Logger;

import nl.justobjects.pushlet.Version;
import nl.justobjects.pushlet.core.Config;
import nl.justobjects.pushlet.core.Dispatcher;
import nl.justobjects.pushlet.core.SessionManager;
import nl.justobjects.pushlet.util.Log;
import nl.justobjects.pushlet.util.PushletException;

/**
 * @author handle
 * 
 */
public final class ConfigInitializer {

	private static ConfigInitializer instance = null;
	private static boolean isInited = false;

	private ConfigInitializer() {
	}

	public static ConfigInitializer getInstance() {
		if (instance == null) {
			return new ConfigInitializer();
		}
		return instance;
	}

	public void init(String path) {
		Config.load(path);

		Log.init();

		// Start
		Log.info("init() Pushlet Webapp - version=" + Version.SOFTWARE_VERSION
				+ " built=" + Version.BUILD_DATE);
		try {
			// Start session manager
			SessionManager.getInstance().start();
			// Start event Dispatcher
			Dispatcher.getInstance().start();
		} catch (PushletException e) {
			Logger.getLogger(this.getClass()).error(e);
		}

	}

}
