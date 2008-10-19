################################
#  create customer base info   #
################################

import datetime
from urus.app.models import *


_default_customer_name='NONE_CUSTOMER'
_default_company_name='NONE_COMPANY'
_default_netbar_name ='NONE_NET_BAR'
_default_limit_number =1000

def log(key,value=''):
  _now=datetime.datetime.now().isoformat()
  print '< %s > %s  : %s' % (_now,key,value)

def _init_customer(seq):
  try:
    c=Customer.objects.get(name=_default_customer_name+str(seq))
    log('default customer already exist')
  except:
    log('create default customer')
    _new=Customer(name=_default_customer_name+str(seq))
    _new.save()


def _init_company(seq):
  try:
    c=Company.objects.get(name=_default_company_name+str(seq))
    log('default company already exist')
  except:
    log('create default company')
    lm=Customer.objects.get(name=_default_customer_name+str(seq))
    _new=Company(name=_default_company_name+str(seq),link_main=lm)
    _new.save()

def _init_netBar(seq):
  try:
    c=NetBar.objects.get(name=_default_netbar_name+str(seq))
    log('default netBar already exist')
  except:
    log('create default netBar')
    lm=Customer.objects.get(name=_default_customer_name+str(seq))
    c=Company.objects.get(name=_default_company_name+str(seq))
    _new=NetBar(name=_default_netbar_name+str(seq),company=c,link_man=lm)
    _new.save()

def _init_class_data(className):
    clazzObject = className()
    properties = clazzObject.__dict__
    for key in properties:
      print 'key=%s,value=%s' % (key,properties[key])

def init_urus():
  for i in range(_default_limit_number):
    _init_customer(i)
    #_init_class_data(Customer)
    _init_company(i)
    _init_netBar(i)
