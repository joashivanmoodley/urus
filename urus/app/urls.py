from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^$', 'urus.app.views.desktop'),
    (r'old/$', 'urus.app.views.main'),
    (r'^category/$','urus.app.views.category'),
    (r'test/$','urus.app.views.content'),
    (r'^json/$','urus.app.views.json'),
    (r'^main_frame/$','urus.app.views.main_frame'),
    
)