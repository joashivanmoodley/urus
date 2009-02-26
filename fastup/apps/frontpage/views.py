# Create your views here.
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
import apps.frontpage.configuration as conf

def index(request):
  return render_to_response('apps/frontpage/index.html',{'tabs':conf.tab_list,'cur_tab':'Home'})