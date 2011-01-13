/**
 * 
 */
package com.handle.csol.core;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author handle
 * 
 */
public class CsSubjectMgr {

	private static CsSubjectMgr instance = null;

	private static Map<String,CsSubject> subjects = new HashMap<String,CsSubject>();
	
	private CsSubjectMgr() {

	}

	public static CsSubjectMgr getInstance() {
		if (instance == null) {
			instance = new CsSubjectMgr();
		}
		return instance;
	}
	
	public void addSubject(String subject,String createBy) throws Exception{
		if(subjects.containsKey(subject)){
			throw new Exception("subject already existed could not added again");
		}
		CsSubject csSubject = new CsSubject(subject,createBy);
		subjects.put(subject, csSubject);
	}
	
	public List<String> getSubjects(){
		List<String> ret = new ArrayList<String>();
		ret.addAll(subjects.keySet());
		return ret;
	}
	
	public void removeSubject(String subject) throws Exception{
		subjects.remove(subject);
	}

	public String querySubject() {
		// here just a hard code need add more logic to business balance.
		String key = subjects.keySet().iterator().next();
		return subjects.get(key).getName();
	}

}
