package com.handle.csol.servlet;

import java.io.IOException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import nl.justobjects.pushlet.core.Protocol;

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
		if (null != req.getParameter(Constants.LOGIN_FIELD_USER_NAME)) {
			userName = (String) req
					.getParameter(Constants.LOGIN_FIELD_USER_NAME);
			userName = (String) req
					.getParameter(Constants.LOGIN_FIELD_USER_NAME);
			Logger.getLogger(this.getClass()).info(
					"User " + userName + " login ");
			resp.sendRedirect(Constants.CHART_ROOM_PAGE);
		} else {
			// forward to login page.
			RequestDispatcher dispatcher = req
					.getRequestDispatcher(Constants.LOGIN_PAGE);
			dispatcher.forward(req, resp);
		}
		return;

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
