# Create your views here.
#coding=utf-8
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.utils import simplejson
def main(request):
  return render_to_response('app/main.html')

def desktop(request):
  return render_to_response('app/desktop.html')


def category(request):
  return render_to_response('app/category.html')


def json(request):
  a={'totalCount':'1','records':[{'id':'1','name':'Handle','gender':r'男','office_phone':'12321231','mobile_phone1':'aaaa','mobile_phone2':'dfsdfds','email':r'a@sss'}]}
  from django.utils import simplejson
  return HttpResponse(simplejson.dumps(a))

def main_frame(request):
  return render_to_response('app/main_frame.html')
  
  
def content(request):
  return render_to_response('app/content.html')