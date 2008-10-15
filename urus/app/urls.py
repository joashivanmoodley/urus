from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^$', 'urus.app.views.desktop'),
    (r'old/$', 'urus.app.views.main'),
    (r'^category/$','urus.app.views.category'),
    (r'^json/$','urus.app.views.json'),
    
    (r'^main_frame/$','urus.app.views.main_frame'),
    
    #json 
    (r'getAllCustomer/$','urus.app.views.getAllCustomer'),
    (r'addOrUpdateCustomer/$','urus.app.views.addOrUpdateCustomer'),
    (r'updateCustomer/$','urus.app.views.updateCustomer'),
    
    (r'getAllNetBar/$','urus.app.views.getAllNetBar'),
    
    
    #for test url
    
    (r'^test/$','urus.app.views.test'),
    
)