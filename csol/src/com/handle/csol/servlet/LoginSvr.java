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

import com.handle.csol.core.CsSubjectMgr;
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

	/**
	 * @param req
	 * @param resp
	 * @throws Exception
	 */
	private void createChart(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		String userName,userPwd;
		userName = (String) req.getParameter(Constants.LOGIN_FIELD_USER_NAME);
		userPwd = (String) req.getParameter(Constants.LOGIN_FIELD_USER_NAME);
		Logger.getLogger(this.getClass()).info("CS  "+ userName);
		resp.setHeader(Constants.CS_ID, userName);
		CsSubjectMgr.getInstance().addSubject(userName+Constants.CHAT_SUFFIX,userName);
		resp.sendRedirect(Constants.DASHBOARD_PAGE+"?s="+userName);
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
