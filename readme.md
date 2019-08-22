#### Vue实现原理 - 如何实现双向绑定及mvvm模式

![vue](https://s2.ax1x.com/2019/08/22/mwugoT.png)



1、数据挂载

```html
<div id="app">
    <input type="text" v-model="man.name">
    <div>{{man.name}}</div>
    <div>{{man.age}}</div>
</div>
```

```javascript
var app = new Vue({
    el: "#app",
    data: {
        man: {
            name: '张三',
            age: 20
        }
    }
})
```

上面代码，也许对于你再熟悉不过了

基于这样的形式，我们需要对数据进行挂载，将`data`的数据挂载到对应的DOM上

首先创建一个类来接收对象参数`options`

```javascript
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data  = options.data;
        if(this.$el) {
            new Compile(this.$el,this) ////模板解析
        }
    }
}
```

在创建`Compile`类，用于模板解析，它的工作内容主要为以下几点

```javascript
class Compile{
    constructor(el,vm) {
     	// 利用el获取相应的DOM节点
        // 获取DOM节点节点内的所有子元素
        // 解析子元素中存在v-开头的属性及文本节点中存在{{}}标识
        // 将vm中data数据挂载上去
    }
}
```

完整代码:

```javascript
class Compile {
    constructor(el,vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        let fragment = this.node2fragment(this.el);
        this.compile(fragment)
    }
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach(attr => {
            let {name,value} = attr
            if(this.isDirective(name)) {
                let [,directive] = name.split('-')
                CompileUtil[directive](node,value,this.vm);
            }
        })
    }
    compileText(node) {
        let content = node.textContent;
        let reg = /\{\{(.+?)}\}/;
        if(reg.test(content)) {
            CompileUtil['text'](node,content,this.vm);
        }
    }
    compile(fragment) {
       let childNodes = fragment.childNodes;
       [...childNodes].forEach(child => {
           if(this.isElementNode(child)) {
            this.compileElement(child);
            this.compile(child);
           }else{
            this.compileText(child);
           }
       })
       document.body.appendChild(fragment);
    }
    node2fragment(nodes) { 
        let fragment = document.createDocumentFragment(),firstChild;
        while(firstChild = nodes.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
}

CompileUtil = {
    getValue(vm,expr) {
        let value = expr.split('.').reduce((data,current) => {
            return data[current]
        },vm.$data)
        return value
    },
    model(node,expr,vm) {
       let data = this.getValue(vm,expr) 
       this.updater['modeUpdater'](node,data) 
    },
    text(node,expr,vm){
        let content = expr.replace(/\{\{(.+?)}\}/g, (...args) => {
            return this.getValue(vm,args[1])
        })
        this.updater['textUpdater'](node,content);
    },
    updater:{
        modeUpdater(node,value){
            node.value = value;
        },
        textUpdater(node,value){
            node.textContent = value;
        }
    }
}
```



2、数据劫持

> 上面已经完成了对模板的数据解析，接下来再对数据的变更进行监听，实现双向数据绑定

```javascript
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data  = options.data;
        if(this.$el) {
            new Compile(this.$el,this)
            new Observer(this.$data); // 数据劫持
        }
    }
}
```





更新中...



