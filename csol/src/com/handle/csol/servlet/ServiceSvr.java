package com.handle.csol.servlet;

import java.io.IOException;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.handle.csol.core.CsSubjectMgr;
import com.handle.csol.utils.Constants;

/**
 * Servlet implementation class ServiceSvr
 */
public class ServiceSvr extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public ServiceSvr() {
		super();
	}

	/**
	 * @see Servlet#init(ServletConfig)
	 */
	public void init(ServletConfig config) throws ServletException {

	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		this.doPost(request, response);

	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String act = request.getParameter(Constants.S_ACTION);
		if (act.equals(Constants.S_QUERY_SUBJECT)) {
			String subject = CsSubjectMgr.getInstance().querySubject();
			Logger.getLogger(this.getClass()).debug(
					"S_QUERY_SUBJECT " + subject);
			response.getWriter().write(subject);
		}
		return;
	}

}
