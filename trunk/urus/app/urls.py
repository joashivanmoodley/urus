from django.conf.urls.defaults import *

urlpatterns = patterns('urus.app.views',
    (r'^$', 'desktop'),
    (r'old/$', 'main'),
    (r'^category/$','category'),
    (r'^json/$','json'),
    
    (r'^main_frame/$','main_frame'),
    
    #json 
    (r'getAllCustomer/$','getAllCustomer'),
    (r'addOrUpdateCustomer/$','addOrUpdateCustomer'),
    (r'updateCustomer/$','updateCustomer'),
    
    (r'getAllNetBar/$','getAllNetBar'),
    (r'addOrUpdateNetbar/$','addOrUpdateNetbar'),
    
    #for test url
    
    (r'^test/$','test'),
    
)