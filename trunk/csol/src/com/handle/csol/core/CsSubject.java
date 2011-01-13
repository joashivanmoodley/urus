/**
 * 
 */
package com.handle.csol.core;

import java.util.Date;
import java.util.List;

/**
 * @author handle
 * 
 */
public class CsSubject {

	private String name;
	private List<Object> subscribers;
	private String createBy;
	private Date createDate;
	
	public CsSubject(String name,String createBy){
		this.name= name;
		this.createBy = createBy;
		this.createDate = new Date();
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public List<Object> getSubscribers() {
		return subscribers;
	}

	public void setSubscribers(List<Object> subscribers) {
		this.subscribers = subscribers;
	}
	
	public void addSubscriber(Object obj){
		if(obj != null){
			this.subscribers.add(obj);
		}
	}

	public String getCreateBy() {
		return createBy;
	}

	public void setCreateBy(String createBy) {
		this.createBy = createBy;
	}

	public Date getCreateDate() {
		return createDate;
	}

	public void setCreateDate(Date createDate) {
		this.createDate = createDate;
	}

}
