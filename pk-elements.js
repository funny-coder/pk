;/**
 * @author Pak Konstantin
 * @version 3.14
 */

(function () {
    if ( typeof window.CustomEvent === "function" ) return false; //If not IE

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;

    if ( typeof window.Event === "function" ) return false; //If not IE
    function Event (event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'Event' );
        evt.initEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    Event.prototype = window.Event.prototype;
    window.Event = Event;
})();


/**
 * Базовый компонент
 * 
 */	
let PKBaseComponent = {
	//root: null,
	//parent: null,
    //objParent - родительский компонент
	// objBase - базовый компонент
	//id: null, // nodeId
	//node: null,
	//children: [], // дочерние компоненты
	//eventsList: {}, // коллекция навешенных событий на дочерние компоненты 'eventName': nodesId[]
	initialize: function(target, objParent){
        
		if(typeof(target) == "string"){
			this.id = target;
			this.node = document.getElementById(this.id);
			if(!this.node){
				console.warn("element "+ this.id + " not found");
				return null;
			}
		}
		else if(typeof(target) == "object"){
			this.id = target.id;
			this.node = target;
		}
		else{
			console.warn("element '"+ target + "' must be string or object");
		}
        //obj = this;
		
		if(objParent){
            this.parent = objParent;
            if(objParent.base){
                this.base = objParent.base;
            }
            else{
                this.base = objParent;
            }
            
        }
        else{ 
            this.parent = null; 
            this.base = null;
        }
		
        if(this.parent){
			this.root = this.parent.root;
			this.parent.registerObject(this);
		}
		else{
			this.root = null;
		}
		this.children = [];
		this.eventsList = {};
        this.listeners = {};
	},
	// зарегистрировать подчиненный компонент
	registerObject : function(obj){
		if(this.children.indexOf(obj) == -1){
			this.children.push(obj);
		}
	},
	/** 
	 * рассылка события себе и в дочерние компоненты
	 * @param {Event} event
	 */
	sendEvent: function(event){
        for(let i = 0; i < this.children.length; i++){
            if(this.eventsList[event.type] == undefined) break;
            if(this.eventsList[event.type].indexOf(this.children[i]) != -1){
                this.children[i].sendEvent(event);
            }
		}
        this.node.dispatchEvent(event);
	},

	/**
	 * Запускает глобальное событие
	 * @param {Event} event
	 * @param {mixed} params
	 */
	globalEvent: function(event){
		(this.parent)? this.parent.globalEvent(event) : this.localEvent(event);
	},
	baseEvent: function(event){
		(this.base)? this.base.sendEvent(event) : this.sendEvent(event);
	},
	parentEvent: function(event){
		(this.parent)? this.parent.sendEvent(event): this.sendEvent(event);
	},

	localEvent: function(event){
		this.sendEvent(event);
	},

	// добавить прослушку события
	listenEvent: function(eventName, func, options){
        //this.listeners.push();
        this.node.addEventListener(eventName, func, options);
        // оповестить родителей
        this.listeners[eventName + '_' + func.name] = {'eventName': eventName, 'funcName':func.name ,'func': func}; 
        if(this.parent) {this.addChildrenEvent(this, eventName);}
        
	},

	unlistenEvent: function(eventName, func){
		this.node.removeEventListener(eventName, func);
        if(func && eventName){
            delete this.listeners[eventName + '_' + func.name];
        }
		// оповестить родителей
		if(this.parent) {this.removeChildrenEvent(this, eventName);}
	},

	/**
	 * Зарегистрировать событие, навешенное на дочерний компонент
	 */
	//addChildrenEvent: function(childrenId , eventName){
	addChildrenEvent: function(child , eventName){
		if(this.eventsList[eventName] == undefined){
			this.eventsList[eventName] = [];
			// передать родителю
			if(this.parent && this.eventsList[eventName]){
				this.parent.addChildrenEvent(this, eventName);
			}
		}

		// и добавить в свой список
        if(this.eventsList[eventName].indexOf(child) == -1){
			this.eventsList[eventName].push(child);
		}
	},

	/**
	 * Удалить дочернее событие. из своего списка событий и из родительских
	 */
	removeChildrenEvent: function(child, eventName){
		if(this.eventsList[eventName] != undefined){
			this.eventsList[eventName].splice(this.eventsList[eventName].indexOf(child),1);
			if(this.eventsList[eventName].length == 0){
                this.eventsList[eventName] = undefined;

				if(this.parent){
					this.parent.removeChildrenEvent(this, eventName);
				}
			}
		}
	},

    stopListening: function(){
        for(let i = 0; i < this.children.length; i++){
            this.children[i].stopListening();
        }
        for(key in this.listeners){
            if(this.listeners[key].func){
                this.unlistenEvent(this.listeners[key].eventName, this.listeners[key].func);
            }
        }
    }
};


/**
 * Создание нового элемента
 * Пример: elem = createNewElement('div', 'my-elem', ['cl1', 'cl2'], {data-type:'custom-element', data-status:'testing', 'my test data'});
 * @param {string} tagName
 * @param {string} id
 * @param {array} classes
 * @param {object} attributes 
 * @param {string} inner
 * @return {Node}
 */
let createNewElement = function(tagName, id, classes, attributes, inner){
	let elem = document.createElement(tagName);
    if(id) elem.id = id;
	//classes
	for(let i = 0; i < classes.length; i++){
		elem.classList.add(classes[i]);
	}
	// attributes
	if(attributes != undefined){
		let keys = Object.keys(attributes);
		for(let i = 0 ; i < keys.length; i++){
			elem.setAttribute(keys[i], attributes[keys[i]]);
		}
	}

	
	// innerHTML
	elem.innerHTML = inner;
	return elem;
};
