// JavaScript Document
/**
*
*/

Boar.TestSuite=function(){
  this.category={};
  this.panels={};
};
Boar.TestSuite.prototype={
  cssRecordCell :'testcase-recorder-cell',
  cssRecordRow  :'testcase-recorder-row',
  cssTable      :'testcase-table',
  cssTableHead  :'testcase-table-head',
  add:function(testCase){
    if(this.category[testCase.category]==undefined){
      this.category[testCase.category]={};
    }
    this.category[testCase.category][testCase.name]=testCase.func;
    return this;
  },
  run:function(){
    this.preRun(); 
    for(c in this.category){
      for(testcase in this.category[c]){
        this.category[c][testcase].call();
      }
    }
  },
  
  preRun : function(){
    var panel=new BPanel();
    var tableTemplate=BDom.build('table',{'class':this.cssTable},[
                        BDom.build('thead',{'class':this.cssTableHead},[
                          BDom.build('tr',{'class':this.cssRecordRow},[
                              BDom.build('td',{'class':this.cssRecordCell},'Category'),
                              BDom.build('td',{'class':this.cssRecordCell},'Method'),
                              BDom.build('td',{'class':this.cssRecordCell},'Status')
                            ])
                          ])  
                      ]);
    var tbodyTemplate= BDom.build('tbody',{'class':'testcase-panel-tbody'});
    var failCaseStatusBar=BDom.build('div',{'style':'width:100px;height:10px;background:#D01E38'})
    var successCaseStatusBar=BDom.build('div',{'style':'width:100px;height:10px;background:#008000'})            
    for (c in this.category){
      var methods=this.category[c];
      for(m in methods){
        var result=methods[m].call(this);
        var record=BDom.build('tr',{'class':this.cssRecordRow},[
                        BDom.build('td',{'class':this.cssRecordCell},c),
                        BDom.build('td',{'class':this.cssRecordCell},m),
                        BDom.build('td',{'class':this.cssRecordCell},[
                          result ? successCaseStatusBar.cloneNode(true):failCaseStatusBar.cloneNode(true)
                        ])
                      ]);
       
      tbodyTemplate.append(record);
      }
    
      
    }
    tableTemplate.append(tbodyTemplate);
    panel.append(tableTemplate);
    document.body.appendChild(panel.element);
    panel.render();
  }
};

/**
*
*/
Boar.TestCase=function(category,testName,testFunc){
  this.category=category;
  this.name=testName;
  this.func=testFunc;
}
Boar.TestCase.prototype={
  run:function(){
    return this.func.call(this);
  }
}
