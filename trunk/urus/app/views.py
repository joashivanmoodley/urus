# Create your views here.
#coding=utf-8
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.utils import simplejson
from urus.app.util import *
from urus.app.models import *

def main(request):
  return render_to_response('app/main.html')

def desktop(request):
  return render_to_response('app/desktop.html')

def test(request):
  return render_to_response('app/test.html')





def json(request):
  a={'totalCount':'1','records':[{'id':'1','name':'Handle','gender':r'男','office_phone':'12321231','mobile_phone1':'aaaa','mobile_phone2':'dfsdfds','email':r'a@sss'}]}
  from django.utils import simplejson
  return HttpResponse(simplejson.dumps(a))



#json handler
def getAllCustomer(request):
  return render_jsonResponse(Customer.objects.all())

def addOrUpdateCustomer(request):
  if request.method=='POST':
    id=request.POST.get('id')
    if id=='':
      id=None
    name=request.POST.get('name')
    gender=request.POST.get('gender')
    op=request.POST.get('op')
    mp1=request.POST.get('mp1')
    mp2=request.POST.get('mp2')
    em=request.POST.get('em')
    newCustomer=Customer.objects.add_or_update_customer(id,name,gender,op,mp1,mp2,em)
  return HttpResponse('ok')


def getAllNetBar(request):
  return render_jsonResponse(NetBar.objects.all())

def main_frame(request):
  return render_to_response('app/main_frame.html')


def content(request):
  return render_to_response('app/content.html')

def category(request):
  return render_to_response('app/category.html')
