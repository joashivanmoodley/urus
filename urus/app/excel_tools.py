#!/usr/bin/env python

##########excel_tools###################
#plug_in:pyExcelerator
#first install pyExcelerator
#
##############################

from pyExcelerator.Workbook import *

default_patch ='e:/python/urus/excel_file'

##contents output content list
## titles properties of content
## sheet_name  output sheet's name
## excel_name output excel's name
def output_sheet(contents,titles,sheet_name="test",excel_name="test.xls"):
    if len(contents)<=0 or len(titles)<=0:
        return
    wb = Workbook()
    ws0 =wb.add_sheet(sheet_name)
    for i in range(len(titles)):
       ws0.write(0,i,titles[i])
    
    for i in range(len(contents)):
        content =contents[i]
        for j in range(len(titles)):
            
            if type(content) is not type(dict()):
                ws0.write(i+1,j,getattr(content,titles[j]))
            else:
                ws0.write(i+1,j,content[titles[j]])
            #ws0.write(i+1,j,content.titles[j])
    wb.save(excel_name)
    return wb

def output_sheet_2(contents):
    if len(contents)<=0:
        return
    properties = contents[0].__dict__.keys()
    sheet_name = contents[0].__class__.__name__
    file_path  = default_patch+str("/")+sheet_name+".xls"
    output_sheet(contents,properties,sheet_name,file_path)
    return file_path

if __name__=='__main__':
    output_sheet([{"id":1,"name":"hello"},{"id":2,"name":"python"}],["id","name"]\
                ,"test","test.xls")
