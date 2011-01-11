package com.handle.csol.servlet;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import nl.justobjects.pushlet.core.Command;
import nl.justobjects.pushlet.core.Event;
import nl.justobjects.pushlet.core.Protocol;
import nl.justobjects.pushlet.core.Session;
import nl.justobjects.pushlet.core.SessionManager;
import nl.justobjects.pushlet.util.Log;
import nl.justobjects.pushlet.util.PushletException;

import org.apache.log4j.Logger;

import com.handle.csol.utils.Constants;

public class LoginSvr extends HttpServlet implements Protocol {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5857511026794336838L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		this.doPost(req, resp);
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		String userName, userPwd;
		// check if login submit.
		try {
			if (null != req.getParameter(Constants.LOGIN_FIELD_USER_NAME)) {
				createChart(req, resp);
			} else {
				// forward to login page.
				RequestDispatcher dispatcher = req
						.getRequestDispatcher(Constants.LOGIN_PAGE);
				dispatcher.forward(req, resp);
			}
			return;
		} catch (Exception e) {
			e.printStackTrace();
			resp.sendRedirect(Constants.ERROR_PAGE);
		}

	}

	private void createChart(HttpServletRequest req, HttpServletResponse resp)
			throws PushletException, IOException {
		String userName;
		userName = (String) req.getParameter(Constants.LOGIN_FIELD_USER_NAME);
		userName = (String) req.getParameter(Constants.LOGIN_FIELD_USER_NAME);
		Logger.getLogger(this.getClass()).info(
				"customer service " + userName + " login ");
		Map<String, String> properties = new HashMap<String, String>();
		properties.put(Protocol.P_SUBJECT, userName + "_chart");
		Event event = new Event(Protocol.E_JOIN_LISTEN);
		//create char session
		Session session = null;
		session = SessionManager.getInstance().createSession(event);
		Logger.getLogger(this.getClass()).info("do command ...");
		if (session == null) {
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST,
					"No id specified");
			Log.warn("Pushlet: bad request, no id specified event=" + resp);
			return;
		}
		String userAgent = req.getHeader("User-Agent");
		if (userAgent != null) {
			userAgent = userAgent.toLowerCase();
		} else {
			userAgent = "unknown";
		}
		session.setUserAgent(userAgent);
		Command command = Command.create(session, event, req,
				resp);
		Logger.getLogger(this.getClass()).info("do command1 ...");
		session.getController().doCommand(command);
		Logger.getLogger(this.getClass()).info("do command2 ...");
		resp.sendRedirect(Constants.CHART_ROOM_PAGE);
	}

	@Override
	public void destroy() {
	}

	@Override
	public void init() throws ServletException {
		super.init();
		String webInfPath = getServletContext().getRealPath("/") + "/WEB-INF";
		ConfigInitializer.getInstance().init(webInfPath);
	}

}
