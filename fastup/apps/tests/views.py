# Create your views here.
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from apps.tests.enties.BookMock import Book 

def book(request):
  b=Book()
  c=Book()
  print 'book --> ',b
  return render_to_response('apps/tests/tags/book.html',{'bs':b,'cs':c})