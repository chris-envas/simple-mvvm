#### 二百行代码实现双向数据绑定

![vue](https://github.com/DMQ/mvvm/raw/master/img/3.png)

图片来源： [剖析Vue实现原理 - 如何实现双向绑定mvvm](https://github.com/DMQ/mvvm)



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

`Compile`类，用于模板解析，它的工作内容主要为以下几点

```javascript
class Compile{
    constructor(el,vm) {
        // 创建文档碎片，接收el的里面所有子元素
        // 解析子元素中存在v-开头的属性及文本节点中存在{{}}标识
        // 将vm中$data对应的数据挂载上去
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
        return attrName.startsWith('v-'); //判断属性中是否存在v-字段 返回 布尔值
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
            new Compile(this.$el,this);
            new Observer(this.$data); //新增 数据劫持
        }
    }
}
```

`Observer`类，用于监听数据，它的工作内容主要为以下几点

```javascript
class Observer{
    constructor(el,vm) {
     	// 利用Object.defineProperty监听所有属性
        // 递归循环监听所有传入的对象
    }
}
```

基础代码:

```javascript
class Observer {
    constructor(data) {
      this.observer(data);
    }
    observer(data) {
        if(!data||typeof data !== 'object') return
        for(let key in data) {
            this.defineReactive(data,key,data[key]);
        }
    }
    defineReactive (obj,key,value) {
        this.observer(value);
        Object.defineProperty(obj,key,{
            get: () => {
                return value;
            },
            set: (newValue) => {
                if(newValue !== value) {
                    this.observer(newValue);
                    value = newValue;
                }
            }
        })

    }
}
```



3、发布订阅

> 将监听到的数据变更，实时的更替上去

首先我们需要一个`Watcher`类，它的工作内容如下

```javascript
class Watcher {
   // 存储当前观察属性对象的数据
   // 当前观察属性对象数据变更时，更新数据
}
```

基础代码：

```javascript
class Watcher {
    /*
		vm 对象实例
		expr 需要监听的对象表达式
		cb 更新数据的回调函数
	*/
    constructor(vm,expr,cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldValue = this.get();
    }
    get() {
        let value = CompileUtil.getValue(this.vm,this.expr);
        return value;
    }
    update() {
        let newValue = CompileUtil.getValue(this.vm,this.expr);
        if(this.oldValue !== newValue) {
            this.cb(newValue)
        }
    }
}
```

再来一个发布订阅`Dep`的类

```javascript
class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub)
    }
    notify() {
        this.subs.forEach(sub => {
            sub.update()
        })
    }
}
```

接下来，让我们把`Watcher`和`Dep`类关联起来

在`CompileUtil`的`model`、`text`方法中分别新建`Watcher`实例

> `Watcher`在接收到`Dep`的广播时，需要一个对应的回调函数，更新数据

```javascript
CompileUtil = {
    getValue(vm,expr) {
        // 解析表达式值 获取vm.$data内对应的数据
        let value = expr.split('.').reduce((data,current) => {
            return data[current]
        },vm.$data)
        return value
    },
    ...
    model(node,expr,vm) { 
       let data = this.getValue(vm,expr);
       //新增 观察者
       new Watcher(vm,expr,(newValue) => {
            this.updater['modeUpdater'](node,newValue);
       })
       this.updater['modeUpdater'](node,data);
    },
    ...
    text(node,expr,vm){ 
        let content = expr.replace(/\{\{(.+?)}\}/g, (...args) => {
             /*
             	新增 观察者
                匹配多个{{}}字段
             */
            new Watcher(vm,args[1],() => {
                this.updater['textUpdater'](node,this.getContentValue(vm,expr));
            })
            return this.getValue(vm,args[1]);
        })
        this.updater['textUpdater'](node,content);
    },
}
```

实例化一个`Watcher`的同时会调用`this.get()`方法，`this.get()`在取值时，会触发被监听对象的`getter`

```javascript
class Watcher {
    ...
    get() {
        // 在Dep设置一个全局属性
        Dep.target = this;
        // 取值会触发被监听对象的getter函数
        let value = CompileUtil.getValue(this.vm,this.expr);
        Dep.target = null;
        return value;
    }
	...
}
```

来到`Observer`中，此时在`get`函数中，我们就可以将`Watcher`实例放进`Dep`的容器`subs`中

> 这里dep,利用了闭包的特性，每次广播不会通知所有用户，提高了性能

```javascript
class Observer {
    ...
    defineReactive (obj,key,value) {
        this.observer(value);
        let dep = new Dep()
        Object.defineProperty(obj,key,{
            get: () => {
                //新增 订阅
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newValue) => {
                if(newValue !== value) {
                    console.log('监听',newValue)
                    this.observer(newValue);
                    value = newValue;
                    //广播
                    dep.notify();
                }
            }
        })
    }
}
```

此时，`Watcher`和`Dep`已形成关联，一旦被监听的对象数据发生变更，就会触发`Dep`的`notify`广播功能，进而触发`Watcher`的`update`方法执行回调函数！

测试：

```javascript
setTimeout(function(){
    app.$data.test = "123"
},3000)
```

结果：

![测试](https://s2.ax1x.com/2019/08/24/msv7Wt.gif)

到这里，我们已经完成了最核心的部分，**数据驱动视图**，但是众所周知,`v-model`是可以视图驱动数据的，于是我们再增加一个监听事件

```javascript
CompileUtil = {
    ...
	setValue(vm,expr,value) {
    	//迭代属性赋值
        expr.split('.').reduce((data,current,index,arr) => {
            if(index == arr.length - 1){
                data[current] = value
            }
            return data[current]
        },vm.$data)
    },
    model(node,expr,vm) { 
       let data = this.getValue(vm,expr);
       new Watcher(vm,expr,(newValue) => {
            this.updater['modeUpdater'](node,newValue);
       })
        //事件监听
       node.addEventListener('input', el => {
          let value = el.target.value;
          console.log(value)
          this.setValue(vm,expr,value)
       })
       this.updater['modeUpdater'](node,data);
    },
        ...
}
```

效果如下:

![](https://s2.ax1x.com/2019/08/24/myR75Q.gif)

最后为Vue实例添加一个属性代理的方法，使访问`vm`的属性代理为访问`vm._data`的属性

```javascript

class Vue {
    constructor(options) {
        ...
        this.$data  = options.data;
        Object.keys(this.$data).forEach(key => {
            this.proxyKeys(key);
        })
      	...
    }
    proxyKeys(key) {
        console.log(key)
        Object.defineProperty(this,key,{
            enumerable: true,
            configurable: false,
            get: () => {
                return this.$data[key];
            },
            set: (newValue) => {
                console.log('newValue',newValue)
                this.$data[key] = newValue;
            }
        })
    }
}
```

大功告成！

### 结束

源码：https://github.com/luojinxu520/simple-mvvm/blob/master/src/mvvm.js

参考 :  [剖析Vue实现原理 - 如何实现双向绑定mvvm](https://github.com/DMQ/mvvm)





