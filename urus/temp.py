def f(var):
  b=str(var)
  e=b[-1:]+b[:-1]
  intC= int(e)
  if(intC*2==var):
    return True
  else:
    return False

  

if __name__=='__main__':
  for i in range(1,99999):
    flag=f(i)
    if(flag):
      print i
      break
  