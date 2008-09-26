from django.conf.urls.defaults import *
from urus import settings

urlpatterns = patterns('',
    # Example:
    # (r'^urus/', include('urus.foo.urls')),

    # Uncomment this for admin:
      
      (r'^admin/', include('django.contrib.admin.urls')),
      (r'^site_media/(?P<path>.*)$', 'django.views.static.serve',{'document_root': settings.STATIC_PATH}),
      (r'^accounts/login/$', 'django.contrib.auth.views.login', {'template_name': 'personal/login.html'}),
      (r'^urus/',include('urus.app.urls')),
      (r'^$','urus.app.views.main'),
)
