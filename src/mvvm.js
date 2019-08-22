
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data  = options.data;
        if(this.$el) {
            new Compile(this.$el,this); //模板解析
            new Observer(this.$data); // 数据劫持
        }
    }
}

class Observer {
    constructor(data) {
      this.observer(data);
    }
    observer(data) {
        if(!data||typeof data !== 'object') return
        for(let key in data) {
            this.defineReactive(data[key]);
        }
    }
    defineReactive (key) {
        this.observer(key);
    }
}
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
