from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^tags/book$','apps.tests.views.book'),
)
