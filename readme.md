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
            new Compile(this.$el,this)
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







