;/**
 * @author Pak Konstantin
 * @version 0.7
 */


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
	initialize: function(target, objParent, objBase){
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
		
		(objParent)? this.parent = objParent : this.parent = null; 
		(objBase)? this.base = objBase : this.base = null; 
		if(this.parent){
			this.root = this.parent.root;
			this.parent.registerObject(this);
		}
		else{
			this.root = null;
		}
		this.children = [];
		this.eventsList = {};
		
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
		this.node.dispatchEvent(event);
		if(this.eventsList[event.type] != undefined){	
			for(let i = 0; i < this.children.length; i++){
				if(this.eventsList[event.type].indexOf(this.children[i].id) != -1){
					this.children[i].sendEvent(event);
				}
			}
		}
	},

	/**
	 * Запускает глобальное событие
	 * @param {Event} event
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
		this.node.addEventListener(eventName, func, options);
		// оповестить родителей
		if(this.parent) {this.addChildrenEvent(this.id, eventName);}
	},

	unlistenEvent: function(eventName, func){
		this.node.removeEventListener(eventName, func);
		// оповестить родителей
		if(this.parent) {this.removeChildrenEvent(this.id, eventName);}
	},

	/**
	 * Зарегистрировать событие, навешенное на дочерний компонент
	 */
	addChildrenEvent: function(childrenId , eventName){
		if(this.eventsList[eventName] == undefined){
			this.eventsList[eventName] = [];
			// передать родителю
			if(this.parent && this.eventsList[eventName]){
				this.parent.addChildrenEvent(this.id, eventName);
			}
		}

		// и добавить в свой список
		if(this.eventsList[eventName].indexOf(childrenId) == -1){
			this.eventsList[eventName].push(childrenId);
		}
	},

	/**
	 * Удалить дочернее событие. из своего списка событий и из родительских
	 */
	removeChildrenEvent: function(childrenId, eventName){
		if(this.eventsList[eventName] != undefined){
			this.eventsList[eventName].splice(this.eventsList[eventName].indexOf(childrenId));
			if(this.eventsList[eventName].length == 0){
				this.eventsList[eventName] = undefined;
				if(this.parent){
					this.parent.removeChildrenEvent(this.id, eventName);
				}
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
	elem.id = id;
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
