
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data  = options.data;
        Object.keys(this.$data).forEach(key => {
            this.proxyKeys(key);
        })
        if(this.$el) {
            new Observer(this.$data); // 数据劫持
            new Compile(this.$el,this); //模板解析
        }
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
        let dep = new Dep()
        Object.defineProperty(obj,key,{
            enumerable: true,
            configurable: false,
            get: () => {
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newValue) => {
                if(newValue !== value) {
                    console.log('监听',newValue)
                    this.observer(newValue);
                    value = newValue;
                    dep.notify();
                }
            }
        })

    }
}

class Compile {
    constructor(el,vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        let fragment = this.node2fragment(this.el);
        this.compile(fragment);
    }
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach(attr => {
            let {name,value} = attr
            if(this.isDirective(name)) {
                let [,directive] = name.split('-');
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
        // 解析表达式值 获取vm.$data内对应的数据
        let value = expr.split('.').reduce((data,current) => {
            return data[current]
        },vm.$data)
        return value
    },
    setValue(vm,expr,value) {
        expr.split('.').reduce((data,current,index,arr) => {
            if(index == arr.length - 1){
                data[current] = value
            }
            return data[current]
        },vm.$data)
    },
    model(node,expr,vm) { 
       let data = this.getValue(vm,expr);
       //观察者
       new Watcher(vm,expr,(newValue) => {
            this.updater['modeUpdater'](node,newValue);
       })
       node.addEventListener('input', el => {
          let value = el.target.value;
          console.log(value)
          this.setValue(vm,expr,value)
       })
       this.updater['modeUpdater'](node,data);
    },
    html(node,expr,vm){
        let data = this.getValue(vm,expr);
        new Watcher(vm,expr,(newValue) => {
            this.updater['htmlUpdater'](node,newValue);
       })
        this.updater['htmlUpdater'](node,data);
    },
    getContentValue(vm,expr) {
        let value =  expr.replace(/\{\{(.+?)}\}/g,(...agrs) => {
            return this.getValue(vm,agrs[1]);
        })
        return value
    },
    text(node,expr,vm){ 
        let content = expr.replace(/\{\{(.+?)}\}/g, (...args) => {
             /*
                为匹配多个{{}}字段
             */
            new Watcher(vm,args[1],() => {
                this.updater['textUpdater'](node,this.getContentValue(vm,expr));
            })
            return this.getValue(vm,args[1]);
        })
        console.log(content)
        this.updater['textUpdater'](node,content);
    },
    updater:{
        modeUpdater(node,value){
            node.value = value;
        },
        textUpdater(node,value){
            node.textContent = value;
        },
        htmlUpdater(node,value){
            node.innerHTML = value;
        }
    }
}

class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub)
    }
    notify() {
        console.log('开始广播')
        this.subs.forEach(sub => {
            sub.update()
        })
    }
}

class Watcher {
    constructor(vm,expr,cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldValue = this.get();
    }
    get() {
        Dep.target = this;
        let value = CompileUtil.getValue(this.vm,this.expr);
        Dep.target = null;
        return value;
    }
    update() {
        let newValue = CompileUtil.getValue(this.vm,this.expr);
        if(this.oldValue !== newValue) {
            this.cb(newValue)
        }
    }
}