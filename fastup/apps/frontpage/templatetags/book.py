#!/usr/bin/env python
#coding=utf-8
from django import template

register = template.Library()

class BookNode(template.Node):
  def __init__(self,bookObj):
    self.bookObj=bookObj
    
  def render(self, context):
    book=None
    if context.has_key(self.bookObj) :
       book=context.get(self.bookObj)
    strNode= """<div class='g-rcp'><div class='g-rcp-n'><div class='g-rcp-e'><div class='g-rcp-w'></div></div></div>
              <div class='g-rcp-head'><b>%s</b></div>
              <div class='g-rcp-mid'>
                <div class='g-rcp-mide'>
                  <div class='box book'>
                    <div class='f-left'>
                      <img src=%s></img>
                    </div>
                    <div class='f-left'>
                      <table cellspacing="0" cellpadding="0" >
                        <tr><td class='right'>书名: </td><td class='left'>%s</td></tr>
                        <tr><td class='right'>作者: </td><td class='left'>%s</td></tr> 
                        <tr><td class='right'>出版社: </td><td class='left'>%s</td></tr>
                        <tr><td class='right'>注释人员: </td><td class='left'>%s</td></tr>
                        <tr><td class='right'>类型: </td><td class='left'>%s</td></tr>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div class='g-rcp-s'><div class='g-rcp-e'><div class='g-rcp-w'></div></div></div>
            </div>""" % (book.name,
                         book.imgUrl,
                         book.name,
                         book.author,
                         book.publisher,
                         book.commenter,
                         book.formatType)
    return strNode
    
def do_book(parser,token):
  bookObj=token.contents.split(' ')[1]
  return BookNode(bookObj)
  
register.tag('book',do_book)