
class Compile {
    constructor(el,vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        let fragment = this.node2fragment(this.el);
        this.compile(fragment)
    }
    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach(attr => {
            let {name,value} = attr
            console.log(name,value)
        })
    }
    compile(fragment) {
        let childNodes = fragment.childNodes;
       [...childNodes].forEach(child => {
           if(this.isElementNode(child)) {
               this.compileElement(child)
           }else{
            console.log(child)
           }
       })
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
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data  = options.data;
        if(this.$el) {
            new Compile(this.$el,this)
        }
    }
}