﻿#!/usr/bin/env python
#coding=utf-8
from django import template

register = template.Library()

class RcpNode(template.Node):
  def __init__(self):
    pass
    
  def render(self, context):
    return r"""<div class='g-rcp'><div class='g-rcp-n'><div class='g-rcp-e'><div class='g-rcp-w'></div></div></div>
              <div class='g-rcp-head'><b>jQuery实战</b></div>
              <div class='g-rcp-mid'>
                <div class='g-rcp-mide'>
                  <div class='box book'>
                    <div class='f-left'>
                      <img src='/site_media/img/books/lastTS00252037__.jpg'></img>
                    </div>
                    <div class='f-left'>
                      <table cellspacing="0" cellpadding="0" >
                        <tr><td class='right'>书名: </td><td class='left'>jQuery实战</td></tr>
                        <tr><td class='right'>作者: </td><td class='left'>Bear Bibeault;Yehuda Katz</td></tr> 
                        <tr><td class='right'>出版社: </td><td class='left'>人民邮电出版社</td></tr>
                        <tr><td class='right'>注释人员: </td><td class='left'>Handle</td></tr>
                        <tr><td class='right'>类型: </td><td class='left'>PDF</td></tr>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div class='g-rcp-s'><div class='g-rcp-e'><div class='g-rcp-w'></div></div></div>
            </div>"""
    
def do_rcp(parser,token):
  return RcpNode()
  
register.tag('rcp',do_rcp)