from django.db import models

# Create your models here.

class Customer(models.Model):
  GENDER_CHOICES = (('M', 'Male'),('F', 'Female'),)  
  name=models.CharField(max_length=50)
  gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
  office_phone=models.CharField(max_length=50,blank=True)
  mobile_phone1=models.CharField(max_length=50,blank=True)
  mobile_phone2=models.CharField(max_length=50,blank=True)
  email=models.CharField(max_length=255,blank=True)
  
  class Meta:
    ordering=['name']
  
  
class Company(models.Model):
  name=models.CharField(max_length=255,unique=True)
  phone=models.CharField(max_length=50,blank=True)
  link_main=models.ForeignKey(Customer)
  address=models.CharField(max_length=1000)
  
  def __unicode__(self):
    return self.name
  
  class Meta:
      ordering=['name']
  

class NetBar(models.Model):
  name=models.CharField(max_length=255,unique=True)
  sort_name = models.CharField(max_length=20,blank=True)
  company = models.ForeignKey(Company)
  address=models.CharField(max_length=1000)
  def __unicode__(self):
    return self.name
  
  class Meta:
    ordering=['name']
    
