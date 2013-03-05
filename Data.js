/*!
 * Data.js Library
 * Version 0.1
 * 
 * Copyright(c) 2013 Gregory Jacobs.
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 * 
 * https://github.com/gregjacobs/Data.js
 */
// Note: Data.js license header automatically injected by build process.

/*global define */
(function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		// AMD loader - Register as module, and also create browser global.
		define( function() {
			return ( root.Data = factory( root ) );
		} );
	} else {
		root.Data = factory( root );   // Browser global only (no AMD loader available)
	}
	
}( this, function( window ) {
	
	/**
	 * @class Data
	 * @singleton
	 * 
	 * Main singleton class, namespace, and a few utility functions for the 
	 * Data library. 
	 */
	var Data = {
		
		/**
		 * An empty function. This can be referred to in cases where you want a function
		 * but do not want to create a new function object. Used for performance and clarity
		 * reasons.
		 *
		 * @method emptyFn
		 */
		emptyFn : function() {},
		
		
		/**
		 * Creates namespaces to be used for scoping variables and classes so that they are not global.
		 * Specifying the last node of a namespace implicitly creates all other nodes. Usage:
		 * 
		 *     Data.namespace( 'Company', 'Company.data' );
		 *     Data.namespace( 'Company.data' ); // equivalent and preferable to above syntax
		 *     Company.Widget = function() { ... }
		 *     Company.data.CustomStore = function(config) { ... }
		 * 
		 * @param {String} namespace1
		 * @param {String} namespace2
		 * @param {String} etc...
		 * @return {Object} The namespace object. (If multiple arguments are passed, this will be the last namespace created)
		 * @method namespace
		 */
		namespace : function(){
			var o, d, i, len, j, jlen, ns,
			    args = arguments;   // var for minification collapse
			    
			for( i = 0, len = args.length; i < len; i++ ) {
				d = args[ i ].split( '.' );
				
				// First in the dot delimited string is the global
				o = window[ d[ 0 ] ] = window[ d[ 0 ] ] || {};
				
				// Now start at the second namespace in, to continue down the line of dot delimited namespaces to create
				for( j = 1, jlen = d.length; j < jlen; j++ ) {
					ns = d[ j ];  // the current namespace
					o = o[ ns ] = o[ ns ] || {};
				}
			}
			return o;
		}
		
	};
	
	return Data;
} ) );

/*global Data */
Data.namespace(
	'Data.attribute',
	'Data.data',
	'Data.persistence'
);

/**
 * @abstract
 * @class Data.persistence.Proxy
 * @extends Observable
 * 
 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) operations on the server.
 * 
 * @param {Object} config The configuration options for this class, specified in an object (hash).
 */
/*global _, Class, Observable, Data */
Data.persistence.Proxy = Class.extend( Observable, {
	
	abstractClass : true,
	
	
	constructor : function( config ) {
		// Apply the config
		_.assign( this, config );
	},
	
	
	/**
	 * Creates a Model on the server.
	 * 
	 * @abstract
	 * @method create
	 * @param {Data.Model} model The Model instance to create on the server.
	 */
	create : Class.abstractMethod,
	
	
	/**
	 * Reads a Model from the server.
	 * 
	 * @abstract
	 * @method read
	 * @param {Data.Model} model The Model instance to read from the server.
	 */
	read : Class.abstractMethod,
	
	
	/**
	 * Updates the Model on the server, using the provided `data`.  
	 * 
	 * @abstract
	 * @method update
	 * @param {Data.Model} model The model to persist to the server. 
	 */
	update : Class.abstractMethod,
	
	
	/**
	 * Destroys (deletes) the Model on the server. This method is not named "delete" as "delete" is a JavaScript reserved word.
	 * 
	 * @abstract
	 * @method destroy
	 * @param {Data.Model} model The Model instance to delete on the server.
	 */
	destroy : Class.abstractMethod
	
} );


// Apply Static Properties
_.assign( Data.persistence.Proxy, {
	
	/**
	 * An object (hashmap) of persistence proxy name -> Proxy class key/value pairs, used to look up
	 * a Proxy subclass by name.
	 * 
	 * @private
	 * @static
	 * @property {Object} proxies
	 */
	proxies : {},
	
	/**
	 * Registers a Proxy subclass by name, so that it may be created by an anonymous object
	 * with a `type` attribute when set to the prototype of a {@link Data.Model}.
	 *
	 * @static  
	 * @method register
	 * @param {String} type The type name of the persistence proxy.
	 * @param {Function} proxyClass The class (constructor function) to register.
	 */
	register : function( type, proxyClass ) {
		var Proxy = Data.persistence.Proxy;  // quick reference to this class's constructor
		
		type = type.toLowerCase();
		if( typeof proxyClass !== 'function' ) {
			throw new Error( "A Proxy subclass constructor function must be provided to registerProxy()" );
		}
		
		if( !Proxy.proxies[ type ] ) { 
			Proxy.proxies[ type ] = proxyClass;
		} else {
			throw new Error( "Error: Proxy type '" + type + "' already registered." );
		}
	},
	
	
	/**
	 * Creates (instantiates) a {@link Data.persistence.Proxy} based on its type name, given
	 * a configuration object that has a `type` property. If an already-instantiated 
	 * {@link Data.persistence.Proxy Proxy} is provided, it will simply be returned unchanged.
	 * 
	 * @static
	 * @method create
	 * @param {Object} config The configuration object for the Proxy. Config objects should have the property `type`, 
	 *   which determines which type of {@link Data.persistence.Proxy} will be instantiated. If the object does not
	 *   have a `type` property, an error will be thrown. Note that already-instantiated {@link Data.persistence.Proxy Proxies} 
	 *   will simply be returned unchanged. 
	 * @return {Data.persistence.Proxy} The instantiated Proxy.
	 */
	create : function( config ) {
		var Proxy = Data.persistence.Proxy;  // quick reference to this class's constructor
		var type = config.type ? config.type.toLowerCase() : undefined;
		
		if( config instanceof Data.persistence.Proxy ) {
			// Already a Proxy instance, return it
			return config;
			
		} else if( Proxy.proxies[ type ] ) {
			return new Proxy.proxies[ type ]( config );
			
		} else if( !( 'type' in config ) ) {
			// No `type` property provided on config object
			throw new Error( "Data.persistence.Proxy.create(): No `type` property provided on persistenceProxy config object" );
			 
		} else {
			// No registered Proxy type with the given type, throw an error
			throw new Error( "Data.persistence.Proxy.create(): Unknown Proxy type: '" + type + "'" );
		}
	}

} );

/**
 * @private
 * @abstract
 * @class Data.DataComponent
 * @extends Observable
 * 
 * Base class for data-holding classes ({@link Data.Model} and {@link Data.Collection}), that abstracts out some
 * of the commonalities between them.
 * 
 * This class is used internally by the framework, and shouldn't be used directly.
 */
/*global _, Class, Observable, Data */
Data.DataComponent = Observable.extend( {
	
	abstractClass : true,
	
	
	/**
	 * @protected
	 * @property {String} clientId (readonly)
	 * 
	 * A unique ID for the Model on the client side. This is used to uniquely identify each Model instance.
	 * Retrieve with {@link #getClientId}.
	 */
	
	
	constructor : function() {
		// Call the superclass's constructor (Observable)
		this._super( arguments );
		
		// Create a client ID for the DataComponent
		this.clientId = 'c' + _.uniqueId();
	},
	
	
	/**
	 * Retrieves the DataComponent's unique {@link #clientId}.
	 * 
	 * @method getClientId
	 * @return {String} The DataComponent's unique {@link #clientId}. 
	 */
	getClientId : function() {
		return this.clientId;
	},
	
	
	/**
	 * Retrieves the native JavaScript value for the DataComponent.
	 * 
	 * @abstract
	 * @method getData
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
	 *   the {@link Data.data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
	 *   that the {@link Data.data.NativeObjectConverter#convert} method does. See that method for details.
	 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link Data.attribute.Attribute Attribute} values.
	 */
	getData : Class.abstractMethod,
	
	
	/**
	 * Determines if the DataComponent has any modifications.
	 * 
	 * @abstract
	 * @method isModified
	 * 
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method.  Options may include:
	 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link Data.attribute.Attribute#persist persisted} 
	 *   attribute of a Model is modified within the DataComponent. 
	 * 
	 * @return {Boolean}
	 */
	isModified : Class.abstractMethod,
	
	
	/**
	 * Commits the data in the DataComponent, so that it is no longer considered "modified".
	 * 
	 * @abstract
	 * @method commit
	 */
	commit : Class.abstractMethod,
	
	
	/**
	 * Rolls the data in the DataComponent back to its state before the last {@link #commit}
	 * or rollback.
	 * 
	 * @abstract
	 * @method rollback
	 */
	rollback : Class.abstractMethod
	
} );

/**
 * @class Data.Model
 * @extends Data.DataComponent
 * 
 * Generalized key/value data storage class, which has a number of data-related features, including the ability to persist its data to a backend server.
 * Basically, a Model represents some object of data that your application uses. For example, in an online store, one might define two Models: 
 * one for Users, and the other for Products. These would be `User` and `Product` models, respectively. Each of these Models would in turn,
 * have the {@link Data.attribute.Attribute Attributes} (data values) that each Model is made up of. Ex: A User model may have: `userId`, `firstName`, and 
 * `lastName` Attributes.
 */
/*global window, jQuery, _, Data */
/*jslint forin:true, eqnull:true */
Data.Model = Data.DataComponent.extend( {
	
	/**
	 * @cfg {Data.persistence.Proxy} persistenceProxy
	 * The persistence proxy to use (if any) to persist the data to the server.
	 */
	persistenceProxy : null,
	
	/**
	 * @cfg {String[]/Object[]} attributes
	 * Array of {@link Data.attribute.Attribute Attribute} declarations. These are objects with any number of properties, but they
	 * must have the property 'name'. See the configuration options of {@link Data.attribute.Attribute} for more information. 
	 * 
	 * Anonymous config objects defined here will become instantiated {@link Data.attribute.Attribute} objects. An item in the array may also simply 
	 * be a string, which will specify the name of the {@link Data.attribute.Attribute Attribute}, with no other {@link Data.attribute.Attribute Attribute} 
	 * configuration options.
	 * 
	 * Attributes defined on the prototype of a Model, and its superclasses, are concatenated together come
	 * instantiation time. This means that the Data.Model base class can define the 'id' attribute, and then subclasses
	 * can define their own attributes to append to it. So if a subclass defined the attributes `[ 'name', 'phone' ]`, then the
	 * final concatenated array of attributes for the subclass would be `[ 'id', 'name', 'phone' ]`. This works for however many
	 * levels of subclasses there are.
	 * 
	 * Example:
	 * 
	 *     attributes : [
	 *         'id',    // name-only; no other configs for this attribute (not recommended! should declare the {@link Data.attribute.Attribute#type type})
	 *         { name: 'firstName', type: 'string' },
	 *         { name: 'lastName', type: 'string' },
	 *         {
	 *             name : 'fullName',
	 *             get  : function( value, model ) {
	 *                 return model.get( 'firstName' ) + ' ' + model.get( 'lastName' );
	 *             }
	 *         }
	 *     ]
	 * 
	 * Note: If using hierarchies of more than one Model subclass deep, consider using the {@link #addAttributes} alias instead of this
	 * config, which does the same thing (defines attributes), but better conveys that attributes in subclasses are being *added* to the
	 * attributes of the superclass, rather than *overriding* attributes of the superclass.
	 */
	
	/**
	 * @cfg {String[]/Object[]} addAttributes
	 * Alias of {@link #cfg-attributes}, which may make more sense to use in hierarchies of models that go past more than one level of nesting, 
	 * as it conveys the meaning that the attributes are being *added* to the attributes that are already defined in its superclass, not
	 * replacing them.
	 */
	
	/**
	 * @cfg {String} idAttribute
	 * The attribute that should be used as the ID for the Model. 
	 */
	idAttribute : 'id',
	
	
	/**
	 * @private
	 * @property {Object} attributes
	 * 
	 * A hash of the combined Attributes, which have been put together from the current Model subclass, and all of
	 * its superclasses.
	 */
	
	/**
	 * @private
	 * @property {Object} data
	 * 
	 * A hash that holds the current data for the {@link Data.attribute.Attribute Attributes}. The property names in this object match 
	 * the attribute names.  This hash holds the current data as it is modified by {@link #set}.
	 */
	
	/**
	 * @private
	 * @property {Boolean} dirty
	 * 
	 * Flag for quick-testing if the Model currently has un-committed data.
	 */
	dirty : false,
	
	/**
	 * @private 
	 * @property {Object} modifiedData
	 * A hash that serves two functions:
	 * 
	 * 1) Properties are set to it when an attribute is modified. The property name is the attribute {@link Data.attribute.Attribute#name}. 
	 *    This allows it to be used to determine which attributes have been modified. 
	 * 2) The *original* (non-committed) data of the attribute (before it was {@link #set}) is stored as the value of the 
	 *    property. When rolling back changes (via {@link #method-rollback}), these values are copied back onto the {@link #data} object
	 *    to overwrite the data to be rolled back.
	 * 
	 * Went back and forth with naming this `originalData` and `modifiedData`, because it stores original data, but is used
	 * to determine which data is modified... 
	 */
	
	/**
	 * @private
	 * @property {Number} setCallCount
	 * 
	 * This variable supports the {@link #changeset} event, by keeping track of the number of calls to {@link #method-set}.
	 * When {@link #method-set} is called, this variable is incremented by 1. Just before {@link #method-set} returns, this variable is decremented
	 * by 1. If at the end of the {@link #method-set} method this variable reaches 0 again, the {@link #changeset} event is fired
	 * with all of the attribute changes since the first call to {@link #method-set}. This handles the recursive nature of the {@link #method-set} method,
	 * and the fact that {@link #method-set} may be called by Attribute {@link Data.attribute.Attribute#cfg-set set} functions, and handlers of the
	 * {@link #change} event.
	 */
	setCallCount : 0,
	
	/**
	 * @private
	 * @property {Object} changeSetNewValues
	 * 
	 * A hashmap which holds the changes to attributes for the {@link #changeset} event to fire with. This hashmap collects the 
	 * changed values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
	 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
	 */
	
	/**
	 * @private
	 * @property {Object} changeSetOldValues
	 * 
	 * A hashmap which holds the changes to attributes for the {@link #changeset} event to fire with. This hashmap collects the 
	 * previous ("old") values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
	 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
	 */
	
	/**
	 * @private
	 * @property {String} id (readonly)
	 * The id for the Model. This property is set when the attribute specified by the {@link #idAttribute} config
	 * is {@link #set}. 
	 * 
	 * *** Note: This property is here solely to maintain compatibility with Backbone's Collection, and should
	 * not be accessed or used, as it will most likely be removed in the future.
	 */
	
	/**
	 * @protected
	 * @property {Boolean} destroyed
	 * 
	 * Flag that is set to true once the Model is successfully destroyed.
	 */
	destroyed : false,
	
	
	inheritedStatics : {
		/**
		 * A static property that is unique to each Data.Model subclass, which uniquely identifies the subclass.
		 * This is used as part of the Model cache, where it is determined if a Model instance already exists
		 * if two models are of the same type (i.e. have the same __Data_modelTypeId), and instance id.
		 * 
		 * @private
		 * @inheritable
		 * @static
		 * @property {String} __Data_modelTypeId
		 */
		
		
		// Subclass-specific setup
		/**
		 * @ignore
		 */
		onClassExtended : function( newModelClass ) {
			// Assign a unique id to this class, which is used in hashmaps that hold the class
			newModelClass.__Data_modelTypeId = _.uniqueId();
			
			
			// Now handle initializing the Attributes, merging this subclass's attributes with the superclass's attributes
			var classPrototype = newModelClass.prototype,
			    superclassPrototype = newModelClass.superclass,
			    superclassAttributes = superclassPrototype.attributes || {},    // will be an object (hashmap) of attributeName -> Attribute instances
			    newAttributes = {},
			    attributeDefs = [],  // will be an array of Attribute configs (definitions) on the new subclass 
			    attributeObj,   // for holding each of the attributeDefs, one at a time
			    i, len;
			
			// Grab the 'attributes' or 'addAttributes' property from the new subclass's prototype. If neither of these are present,
			// will use the empty array instead.
			if( classPrototype.hasOwnProperty( 'attributes' ) ) {
				attributeDefs = classPrototype.attributes;
			} else if( classPrototype.hasOwnProperty( 'addAttributes' ) ) {
				attributeDefs = classPrototype.addAttributes;
			}
			
			// Instantiate each of the new subclass's Attributes, and then merge them with the superclass's attributes
			for( i = 0, len = attributeDefs.length; i < len; i++ ) {
				attributeObj = attributeDefs[ i ];
				
				// Normalize to a Data.attribute.Attribute configuration object if it is a string
				if( typeof attributeObj === 'string' ) {
					attributeObj = { name: attributeObj };
				}
				
				// Create the actual Attribute instance
				var attribute = Data.attribute.Attribute.create( attributeObj );
				newAttributes[ attribute.getName() ] = attribute;
			}
			
			newModelClass.prototype.attributes = _.defaults( _.clone( newAttributes ), superclassAttributes );  // newAttributes take precedence; superclassAttributes are used in the case that a newAttribute doesn't exist for a given attributeName
		},
		
		
		/**
		 * Retrieves the Attribute objects that are present for the Model, in an object (hashmap) where the keys
		 * are the Attribute names, and the values are the {@link Data.attribute.Attribute} objects themselves.
		 * 
		 * @inheritable
		 * @static
		 * @method getAttributes
		 * @return {Object} An Object (hashmap) where the keys are the attribute {@link Data.attribute.Attribute#name names},
		 *   and the values are the {@link Data.attribute.Attribute Attribute} instances themselves.
		 */
		getAttributes : function() {
			// Note: `this` refers to the class (constructor function) that the static method was called on
			return this.prototype.attributes;
		}
		
	},
	
	
	
	/**
	 * Creates a new Model instance.
	 * 
	 * @constructor 
	 * @param {Object} [data] Any initial data for the {@link #cfg-attributes attributes}, specified in an object (hash map). See {@link #set}.
	 */
	constructor : function( data ) {
		var me = this;
		
		// Default the data to an empty object
		data = data || {};
		
		
		// --------------------------
		
		// Handle this new model being a duplicate of a model that already exists (with the same id)
				
		// If there already exists a model of the same type, with the same ID, update that instance,
		// and return that instance from the constructor. We don't create duplicate Model instances
		// with the same ID.
		me = Data.ModelCache.get( me, data[ me.idAttribute ] );
		if( me !== this ) {
			me.set( data );   // set any provided initial data to the already-existing instance (as to combine them),
			return me;        // and then return the already-existing instance
		}
		
		
		// --------------------------
		
		
		// Call superclass constructor
		this._super( arguments );
		
		// If this class has a persistenceProxy definition that is an object literal, instantiate it *onto the prototype*
		// (so one Proxy instance can be shared for every model)
		if( me.persistenceProxy && typeof me.persistenceProxy === 'object' && !( me.persistenceProxy instanceof Data.persistence.Proxy ) ) {
			me.constructor.prototype.persistenceProxy = Data.persistence.Proxy.create( me.persistenceProxy );
		}
		
		
		me.addEvents(
			/**
			 * Fires when a {@link Data.attribute.Attribute} in the Model has changed its value. This is a 
			 * convenience event to respond to just a single attribute's change. Ex: if you want to
			 * just respond to the `title` attribute's change, you could subscribe to `change:title`. Ex:
			 * 
			 *     model.addListener( 'change:title', function( model, newValue ) { ... } );
			 * 
			 * @event change:[attributeName]
			 * @param {Data.Model} model This Model instance.
			 * @param {Mixed} newValue The new value, processed by the attribute's {@link Data.attribute.Attribute#get get} function if one exists. 
			 * @param {Mixed} oldValue The old (previous) value, processed by the attribute's {@link Data.attribute.Attribute#get get} function if one exists. 
			 */
			
			/**
			 * Fires when a {@link Data.attribute.Attribute} in the Model has changed its value.
			 * 
			 * @event change
			 * @param {Data.Model} model This Model instance.
			 * @param {String} attributeName The name of the attribute that was changed.
			 * @param {Mixed} newValue The new value, processed by the attribute's {@link Data.attribute.Attribute#get get} function if one exists. 
			 * @param {Mixed} oldValue The old (previous) value, processed by the attribute's {@link Data.attribute.Attribute#get get} function if one exists. 
			 */
			'change',
			
			/**
			 * Fires once at the end of one of more (i.e. a set) of Attribute changes to the model. Multiple changes may be made to the model in a "set" by
			 * providing the first argument to {@link #method-set} as an object, and/or may also result from having {@link Data.attribute.Attribute#cfg-set Attribute set} 
			 * functions which modify other Attributes. Or, one final way that changes may be counted in a "set" is if handlers of the {@link #change} event end up
			 * setting Attributes on the Model as well.
			 * 
			 * Note: This event isn't quite production-ready, as it doesn't take into account changes from nested {@Link Data.DataComponent DataComponents}
			 * ({@link Data.Model Models} and {@link Data.Collection Collections}), but can be used for a set of flat changes in the Model.
			 * 
			 * @event changeset
			 * @param {Data.Model} model This Model instance.
			 * @param {Object} newValues An object (hashmap) of the new values of the Attributes that changed. The object's keys (property names) are the
			 *   {@link Data.attribute.Attribute#name Attribute names}, and the object's values are the new values for those Attributes.
			 * @param {Object} oldValues An object (hashmap) of the old values of the Attributes that changed. The object's keys (property names) are the
			 *   {@link Data.attribute.Attribute#name Attribute names}, and the object's values are the old values that were held for those Attributes.
			 */
			'changeset',
			
			/**
			 * Fires when the data in the model is {@link #method-commit committed}. This happens if the
			 * {@link #method-commit commit} method is called, and after a successful {@link #save}.
			 * 
			 * @event commit
			 * @param {Data.Model} model This Model instance.
			 */
			'commit',
			
			/**
			 * Fires when the data in the model is {@link #method-rollback rolled back}. This happens when the
			 * {@link #method-rollback rollback} method is called.
			 * 
			 * @event rollback
			 * @param {Data.Model} model This Model instance.
			 */
			'rollback',
			
			/**
			 * Fires when the Model has been destroyed (via {@link #method-destroy}).
			 * 
			 * @event destroy
			 * @param {Data.Model} model This Model instance.
			 */
			'destroy'
		);
		
		
		// Set the default values for attributes that don't have an initial value.
		var attributes = me.attributes,  // me.attributes is a hash of the Attribute objects, keyed by their name
		    attributeDefaultValue;
		for( var name in attributes ) {
			if( data[ name ] === undefined && ( attributeDefaultValue = attributes[ name ].getDefaultValue() ) !== undefined ) {
				data[ name ] = attributeDefaultValue;
			}
		}
		
		// Initialize the underlying data object, which stores all attribute values
		me.data = {};
		
		// Initialize the data hash for storing attribute names of modified data, and their original values (see property description)
		me.modifiedData = {};
		
		// Set the initial data / defaults, if we have any
		me.set( data );
		me.commit();  // and because we are initializing, the data is not dirty
		
		// Call hook method for subclasses
		me.initialize();
	},
	
	
	/**
	 * Hook method for subclasses to initialize themselves. This method should be overridden in subclasses to 
	 * provide any model-specific initialization.
	 * 
	 * Note that it is good practice to always call the superclass `initialize` method from within yours (even if
	 * your class simply extends Data.Model, which has no `initialize` implementation itself). This is to future proof it
	 * from being moved under another superclass, or if there is ever an implementation made in this class.
	 * 
	 * Ex:
	 * 
	 *     MyModel = Data.Model.extend( {
	 *         initialize : function() {
	 *             MyModel.superclass.initialize.apply( this, arguments );   // or could be MyModel.__super__.initialize.apply( this, arguments );
	 *             
	 *             // my initialization logic goes here
	 *         }
	 *     }
	 * 
	 * @protected
	 * @method initialize
	 */
	initialize : Data.emptyFn,
	
	
	/**
	 * Retrieves the Attribute objects that are present for the Model, in an object (hashmap) where the keys
	 * are the Attribute names, and the values are the {@link Data.attribute.Attribute} objects themselves.
	 * 
	 * @method getAttributes
	 * @return {Object} An Object (hashmap) where the keys are the attribute {@link Data.attribute.Attribute#name names},
	 *   and the values are the {@link Data.attribute.Attribute Attribute} instances themselves.
	 */
	getAttributes : function() {
		return this.attributes;
	},
	
	
	// --------------------------------
	
	
	/**
	 * Retrieves the ID for the Model. This uses the configured {@link #idAttribute} to retrieve
	 * the correct ID attribute for the Model.
	 * 
	 * @method getId
	 * @return {Mixed} The ID for the Model.
	 */
	getId : function() {
		// Provide a friendlier error message than what get() provides if the idAttribute is not an Attribute of the Model
		if( !( this.idAttribute in this.attributes ) ) {
			throw new Error( "Error: The `idAttribute` (currently set to an attribute named '" + this.idAttribute + "') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it." );
		}
		return this.get( this.idAttribute );
	},
	
	
	/**
	 * Retrieves the "ID attribute" for the Model, if there is a valid id attribute. The Model has a valid ID attribute if there exists
	 * an attribute which is referenced by the {@link #idAttribute} config. Otherwise, returns null.
	 * 
	 * @method getIdAttribute
	 * @return {Data.attribute.Attribute} The Attribute that represents the ID attribute, or null if there is no valid ID attribute.
	 */
	getIdAttribute : function() {
		return this.attributes[ this.idAttribute ] || null;
	},
	
	
	/**
	 * Retrieves the name of the "ID attribute" for the Model. This will be the attribute referenced by the {@link #idAttribute}
	 * config.
	 * 
	 * @method getIdAttributeName
	 * @return {String} The name of the "ID attribute".
	 */
	getIdAttributeName : function() {
		return this.idAttribute;
	},
	
	
	/**
	 * Determines if the Model has a valid {@link #idAttribute}. Will return true if there is an {@link #cfg-attributes attribute}
	 * that is referenced by the {@link #idAttribute}, or false otherwise.
	 * 
	 * @method hasIdAttribute
	 * @return {Boolean}
	 */
	hasIdAttribute : function() {
		return !!this.attributes[ this.idAttribute ];
	},

	
	// --------------------------------
	
	
	/**
	 * Sets the value for a {@link Data.attribute.Attribute Attribute} given its `name`, and a `value`. For example, a call could be made as this:
	 * 
	 *     model.set( 'attribute1', 'value1' );
	 * 
	 * As an alternative form, multiple valuse can be set at once by passing an Object into the first argument of this method. Ex:
	 * 
	 *     model.set( { key1: 'value1', key2: 'value2' } );
	 * 
	 * Note that in this form, the method will ignore any property in the object (hash) that don't have associated Attributes.
	 * 
	 * When attributes are set, their {@link Data.attribute.Attribute#cfg-set} method is run, if they have one defined.
	 * 
	 * @method set
	 * @param {String/Object} attributeName The attribute name for the Attribute to set, or an object (hash) of name/value pairs.
	 * @param {Mixed} [newValue] The value to set to the attribute. Required if the `attributeName` argument is a string (i.e. not a hash). 
	 */
	set : function( attributeName, newValue ) {
		// If coming into the set() method for the first time (non-recursively, not from an attribute setter, not from a 'change' handler, etc),
		// reset the hashmaps which will hold the newValues and oldValues that will be provided to the 'changeset' event.
		if( this.setCallCount === 0 ) {
			this.changeSetNewValues = {};
			this.changeSetOldValues = {};
		}
		
		// Increment the setCallCount, for use with the 'changeset' event. The 'changeset' event only fires when all calls to set() have exited.
		this.setCallCount++;
		
		var attributes = this.attributes,
		    changeSetNewValues = this.changeSetNewValues,
		    changeSetOldValues = this.changeSetOldValues;
		
		if( typeof attributeName === 'object' ) {
			// Hash provided
			var values = attributeName,  // for clarity
			    attrsWithSetters = [];
			
			for( var fldName in values ) {  // a new variable, 'fldName' instead of 'attributeName', so that JSLint stops whining about "Bad for in variable 'attributeName'" (for whatever reason it does that...)
				if( values.hasOwnProperty( fldName ) ) {
					// <debug>
					if( !attributes[ fldName ] ) {
						throw new Error( "Data.Model.set(): An attribute with the attributeName '" + fldName + "' was not found." );
					}
					// </debug>
					if( attributes[ fldName ].hasUserDefinedSetter() ) {   // defer setting the values on attributes with user-defined setters until all attributes without user-defined setters have been set
						attrsWithSetters.push( fldName );
					} else {
						this.set( fldName, values[ fldName ] );
					}
				}
			}
			
			for( var i = 0, len = attrsWithSetters.length; i < len; i++ ) {
				fldName = attrsWithSetters[ i ];
				this.set( fldName, values[ fldName ] );
			}
			
		} else {
			// attributeName and newValue provided
			var attribute = attributes[ attributeName ];
			
			// <debug>
			if( !attribute ) {
				throw new Error( "Data.Model.set(): An attribute with the attributeName '" + attributeName + "' was not found." );
			}
			// </debug>
			
			// Get the current (old) value of the attribute, and its current "getter" value (to provide to the 'change' event as the oldValue)
			var oldValue = this.data[ attributeName ],
			    oldGetterValue = this.get( attributeName );
						
			// Allow the Attribute to pre-process the newValue
			newValue = attribute.beforeSet( this, newValue, oldValue );
			
			// Now call the Attribute's set() method (or user-provided 'set' config function)
			newValue = attribute.doSet( this, newValue, oldValue );  // doSet() is a method which provides a level of indirection for calling the 'set' config function, or set() method
			
			// *** Temporary workaround to get the 'change' event to fire on an Attribute whose set() config function does not
			// return a new value to set to the underlying data. This will be resolved once dependencies are 
			// automatically resolved in the Attribute's get() function. 
			if( attribute.hasOwnProperty( 'set' ) && newValue === undefined ) {  // the attribute will only have a 'set' property of its own if the 'set' config was provided
				// This is to make the following block below think that there is already data in for the attribute, and
				// that it has the same value. If we don't have this, the change event will fire twice, the
				// the model will be set as 'dirty', and the old value will be put into the `modifiedData` hash.
				if( !( attributeName in this.data ) ) {
					this.data[ attributeName ] = undefined;
				}
				
				// Fire the events with the value of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// Store the 'change' in the 'changeset' hashmaps
				this.changeSetNewValues[ attributeName ] = newValue;
				if( !( attributeName in changeSetOldValues ) ) {  // only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple sets occur for an attribute during the changeset.
					this.changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// Now manually fire the events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
			
			// Allow the Attribute to post-process the newValue
			newValue = attribute.afterSet( this, newValue );
			
			// Only change if there is no current value for the attribute, or if newValue is different from the current
			if( !( attributeName in this.data ) || !attribute.valuesAreEqual( oldValue, newValue ) ) {   // let the Attribute itself determine if two values of its datatype are equal
				// Store the attribute's *current* value (not the newValue) into the "modifiedData" attributes hash.
				// This should only happen the first time the attribute is set, so that the attribute can be rolled back even if there are multiple
				// set() calls to change it.
				if( !( attributeName in this.modifiedData ) ) {
					this.modifiedData[ attributeName ] = oldValue;
				}
				this.data[ attributeName ] = newValue;
				this.dirty = true;
				
				
				// Now that we have set the new raw value to the internal `data` hash, we want to fire the events with the value
				// of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// If the attribute is the "idAttribute", set the `id` property on the model for compatibility with Backbone's Collection
				if( attributeName === this.idAttribute ) {
					this.id = newValue;

					// Re-submit to ModelCache, so new ID will be used.  This is particularly relevant on 'create', where the ID isn't known
					// at the time the model is instantiated.
					Data.ModelCache.get( this, newValue );
				}
				
				// Store the 'change' values in the changeset hashmaps, for use when the 'changeset' event fires
				changeSetNewValues[ attributeName ] = newValue;
				if( !( attributeName in changeSetOldValues ) ) {  // Only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple set()'s occur for an attribute during the changeset.
					changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// And finally, fire the 'change' events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
		}
		
		// Handle firing the 'changeset' event, which fires once for all of the attribute changes to the Model (i.e. when all calls to set() have exited)
		this.setCallCount--;
		if( this.setCallCount === 0 ) {
			this.fireEvent( 'changeset', this, changeSetNewValues, changeSetOldValues );
		}
	},
	
	
	/**
	 * Retrieves the value for the attribute given by `attributeName`. If the {@link Data.attribute.Attribute Attribute} has a
	 * {@link Data.attribute.Attribute#get get} function defined, that function will be called, and its return value
	 * will be used as the return of this method.
	 * 
	 * @method get
	 * @param {String} attributeName The name of the Attribute whose value to retieve.
	 * @return {Mixed} The value of the attribute returned by the Attribute's {@link Data.attribute.Attribute#get get} function (if
	 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link Data.attribute.Attribute#get get}
	 * function, and the value has never been set.  
	 */
	get : function( attributeName ) {
		// <debug>
		if( !( attributeName in this.attributes ) ) {
			throw new Error( "Data.Model::get() error: attribute '" + attributeName + "' was not found on the Model." );
		}
		// </debug>
		
		var value = this.data[ attributeName ],
		    attribute = this.attributes[ attributeName ];
		
		// If there is a `get` function on the Attribute, run it now to convert the value before it is returned.
		if( typeof attribute.get === 'function' ) {
			value = attribute.get.call( this, value );  // provided the underlying value
		}
		
		return value;
	},
	
	
	/**
	 * Retrieves the *raw* value for the attribute given by `attributeName`. If the {@link Data.attribute.Attribute Attributes} has a
	 * {@link Data.attribute.Attribute#raw raw} function defined, that function will be called, and its return value will be used
	 * by the return of this method. If not, the underlying data that is currently stored will be returned, bypassing any
	 * {@link Data.attribute.Attribute#get get} function defined on the {@link Data.attribute.Attribute Attribute}.
	 * 
	 * @method raw
	 * @param {String} attributeName The name of the Attribute whose raw value to retieve.
	 * @return {Mixed} The value of the attribute returned by the Attribute's {@link Data.attribute.Attribute#raw raw} function (if
	 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link Data.attribute.Attribute#raw raw}
	 * function, and the value has never been set.
	 */
	raw : function( attributeName ) {
		// <debug>
		if( !( attributeName in this.attributes ) ) {
			throw new Error( "Data.Model::raw() error: attribute '" + attributeName + "' was not found on the Model." );
		}
		// </debug>
		
		var value = this.data[ attributeName ],
		    attribute = this.attributes[ attributeName ];
		    
		// If there is a `raw` function on the Attribute, run it now to convert the value before it is returned.
		if( typeof attribute.raw === 'function' ) {
			value = attribute.raw.call( this, value, this );  // provided the value, and the Model instance
		}
		
		return value;
	},
	
	
	/**
	 * Returns the default value specified for an Attribute.
	 * 
	 * @method getDefault
	 * @param {String} attributeName The attribute name to retrieve the default value for.
	 * @return {Mixed} The default value for the attribute.
	 */
	getDefault : function( attributeName ) {
		return this.attributes[ attributeName ].getDefaultValue();
	},
	
	
	/**
	 * Determines if the Model has a given attribute (attribute).
	 * 
	 * @method has
	 * @param {String} attributeName The name of the attribute (attribute) name to test for.
	 * @return {Boolean} True if the Model has the given attribute name.
	 */
	has : function( attributeName ) {
		return !!this.attributes[ attributeName ];
	},	
	
	
	// --------------------------------
	
	
	/**
	 * Determines if the Model is a new model, and has not yet been persisted to the server.
	 * It is a new Model if it lacks an id.
	 * 
	 * @method isNew
	 * @return {Boolean} True if the model is new, false otherwise.
	 */
	isNew : function() {
		if( !this.hasIdAttribute() ) {
			return true;
		} else {
			var id = this.getId();
			return id == null;  // returns true if id === null or id === undefined
		}
	},
	
	
	/**
	 * Determines if this Model itself (excluding child Models and {@link Data.Collection Collections}) currently has un-committed (i.e. changed) data.
	 * Prefer to use {@link #isModified} instead.
	 * 
	 * @method isDirty
	 * @return {Boolean}
	 */
	isDirty : function() {
		return this.dirty;
	},
	
	
	/**
	 * Determines if any attribute(s) in the model are modified, or if a given attribute has been modified, since the last 
	 * {@link #method-commit} or {@link #method-rollback}.
	 * 
	 * @override
	 * @method isModified
	 * @param {String} [attributeName] Provide this argument to test if a particular attribute has been modified. If this is not 
	 *   provided, the model itself will be checked to see if there are any modified attributes. 
	 * 
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This may be provided as the first argument to the
	 *   method if no `attributeName` is to be provided. Options may include:
	 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link Data.attribute.Attribute#persist persisted} 
	 *   attribute is modified. 
	 * 
	 * @return {Boolean} True if the attribute has been modified, false otherwise.
	 */
	isModified : function( attributeName, options ) {
		if( typeof attributeName === 'object' ) {  // 'options' provided as first argument, fix the parameter variables
			options = attributeName;
			attributeName = undefined;
		}
		
		options = options || {};
		
		var attributes = this.attributes,
		    data = this.data,
		    modifiedData = this.modifiedData;
		
		if( !attributeName ) {
			// First, check if there are any modifications to primitives (i.e. non-nested Models/Collections).
			// If the 'persistedOnly' option is true, we only consider attributes that are persisted.
			for( var attr in modifiedData ) {
				if( modifiedData.hasOwnProperty( attr ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attr ].isPersisted() ) ) ) {
					return true;  // there is any property in the modifiedData hashmap, return true (unless 'persistedOnly' option is set, in which case we only consider persisted attributes)
				}
			}
			
			// No local modifications to primitives, check all embedded collections/models to see if they have changes
			var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
			    dataComponent;
			
			for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
				var attrName = embeddedDataComponentAttrs[ i ].getName();
				
				if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
					return true;
				}
			}
			return false;
			
		} else {
			// Handle an attributeName being provided to this method
			var attribute = attributes[ attributeName ];
			
			if( attribute instanceof Data.attribute.DataComponent && attribute.isEmbedded() && data[ attributeName ].isModified( options ) ) {   // DataComponent (Model or Collection) attribute is modified
				return true;
			} else if( modifiedData.hasOwnProperty( attributeName ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attributeName ].isPersisted() ) ) ) {  // primitive (non Model or Collection) attribute is modified
				return true;
			}
			
			return false;
		}
	},
	
	
	/**
	 * Retrieves the values for all of the attributes in the Model. The Model attributes are retrieved via the {@link #get} method,
	 * to pre-process the data before it is returned in the final hash, unless the `raw` option is set to true,
	 * in which case the Model attributes are retrieved via {@link #raw}. 
	 * 
	 * @override
	 * @method getData
	 * 
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
	 *   the {@link Data.data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
	 *   that the {@link Data.data.NativeObjectConverter#convert} method does. See that method for details.
	 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link Data.attribute.Attribute Attribute} values.
	 */
	getData : function( options ) {
		return Data.data.NativeObjectConverter.convert( this, options );
	},
	
	
	/**
	 * Retrieves the values for all of the {@link Data.attribute.Attribute attributes} in the Model whose values have been changed since
	 * the last {@link #method-commit} or {@link #method-rollback}. 
	 * 
	 * The Model attributes are retrieved via the {@link #get} method, to pre-process the data before it is returned in the final hash, 
	 * unless the `raw` option is set to true, in which case the Model attributes are retrieved via {@link #raw}.
	 * 
	 * @method getChanges
	 * 
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
	 *   the {@link Data.data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
	 *   that the {@link Data.data.NativeObjectConverter#convert} method does. See that method for details. Options specific to this method include:
	 * @param {Boolean} [options.persistedOnly=false] True to have the method only return only changed attributes that are 
	 *   {@link Data.attribute.Attribute#persist persisted}. In the case of nested models, a nested model will only be returned in the resulting
	 *   hashmap if one if its {@link Data.attribute.Attribute#persist persisted} attributes are modified. 
	 * 
	 * @return {Object} A hash of the attributes that have been changed since the last {@link #method-commit} or {@link #method-rollback}.
	 *   The hash's property names are the attribute names, and the hash's values are the new values.
	 */
	getChanges : function( options ) {
		options = options || {};
		
		// Provide specific attribute names to the NativeObjectConverter's convert() method, which are only the
		// names for attributes which hold native JS objects that have changed (not embedded models/arrays)
		options.attributeNames = _.keys( this.modifiedData );
		
		// Add any modified embedded model/collection to the options.attributeNames array
		var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
		    data = this.data,
		    dataComponent,
		    collection,
		    attrName,
		    i, len;
	
		for( i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
			attrName = embeddedDataComponentAttrs[ i ].getName();
			
			if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
				options.attributeNames.push( attrName );
			}
		}
		
		// Add any shallow-modified 'related' (i.e. non-embedded) collections to the options.attributeNames array
		var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
		for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
			attrName = relatedCollectionAttrs[ i ].getName();
			
			if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
				options.attributeNames.push( attrName );
			}
		}
		
		return Data.data.NativeObjectConverter.convert( this, options );
	},
	
	
	/**
	 * Commits dirty attributes' data. Data can no longer be reverted after a commit has been performed. Note: When developing with a {@link #persistenceProxy},
	 * this method should normally not need to be called explicitly, as it will be called upon the successful persistence of the Model's data
	 * to the server.
	 * 
	 * @override
	 * @method commit
	 */
	commit : function() {
		this.modifiedData = {};  // reset the modifiedData hash. There is no modified data.
		this.dirty = false;
		
		// Go through all embedded models/collections, and "commit" those as well
		var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
		    data = this.data,
		    attrName,
		    dataComponent,
		    collection;
		
		for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
			attrName = embeddedDataComponentAttrs[ i ].getName();
			
			if( ( dataComponent = data[ attrName ] ) ) {
				dataComponent.commit();
			}
		}
		
		// Shallowly commit any 'related' (i.e. non-embedded) collections
		var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
		for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
			attrName = relatedCollectionAttrs[ i ].getName();
			
			if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
				collection.commit( { shallow: true } );
			}
		}
		
		this.fireEvent( 'commit', this );
	},
	
	
	/**
	 * Rolls back the Model attributes that have been changed since the last commit or rollback.
	 * 
	 * @override
	 * @method rollback
	 */
	rollback : function() {
		// Loop through the modifiedData hash, which holds the *original* values, and set them back to the data hash.
		var modifiedData = this.modifiedData;
		for( var attributeName in modifiedData ) {
			if( modifiedData.hasOwnProperty( attributeName ) ) {
				this.data[ attributeName ] = modifiedData[ attributeName ];
			}
		}
		
		this.modifiedData = {};
		this.dirty = false;
		
		this.fireEvent( 'rollback', this );
	},
	
	
	// --------------------------------
	
	
	/**
	 * Creates a clone of the Model, by copying its instance data. Note that the cloned model will *not* have a value
	 * for its {@link #idAttribute} (as it is a new model, and multiple models of the same type cannot exist with
	 * the same id). You may optionally provide a new id for the clone with the `id` parameter. 
	 * 
	 * Note: This is a very early, alpha version of the method, where the final version will most likely
	 * account for embedded models, while copying embedded models and other such nested data. Will also handle 
	 * circular dependencies. I don't recommend using it just yet.
	 * 
	 * @method clone
	 * @param {Mixed} [id] A new id for the Model. Defaults to undefined.
	 * @return {Data.Model} The new Model instance, which is a clone of the Model this method was called on.
	 */
	clone : function( id ) {
		var data = _.cloneDeep( this.getData() );
		
		// Remove the id, so that it becomes a new model. If this is kept here, a reference to this exact
		// model will be returned instead of a new one, as the framework does not allow duplicate models with
		// the same id. Otherwise, if a new id is passed, it will be set to the new model.
		if( typeof id === 'undefined' ) {
			delete data[ this.idAttribute ];
		} else {
			data[ this.idAttribute ] = id;
		}
		
		return new this.constructor( data );
	},
	
	
	// --------------------------------
	
	
	/**
	 * Gets the {@link #persistenceProxy} that is currently configured for this Model. Note that
	 * the same persistenceProxy instance is shared between all instances of the model.
	 * 
	 * @method getPersistenceProxy
	 * @return {Data.persistence.Proxy} The persistenceProxy, or null if there is no persistenceProxy currently set.
	 */
	getPersistenceProxy : function() {
		return this.persistenceProxy;
	},
	
	
	/**
	 * Reloads the Model data from the server (discarding any changed data), using the configured {@link #persistenceProxy}.
	 * 
	 * @method reload
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the save is successful.
	 * @param {Function} [options.failure] Function to call if the save fails.
	 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of a success or fail state.
	 * @param {Object} [options.scope=window] The object to call the `success`, `failure`, and `complete` callbacks in.
	 */
	reload : function( options ) {
		options = options || {};
		
		// No persistenceProxy, cannot load. Throw an error
		if( !this.persistenceProxy ) {
			throw new Error( "Data.Model::reload() error: Cannot load. No persistenceProxy." );
		}
		
		var proxyOptions = {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,   // defaults to true
			success  : options.success  || Data.emptyFn,
			failure  : options.failure  || Data.emptyFn,
			complete : options.complete || Data.emptyFn,
			scope    : options.scope    || window
		};
		
		// Make a request to update the data on the server
		this.persistenceProxy.read( this, proxyOptions );
	},
	
	
	/**
	 * Persists the Model data to the backend, using the configured {@link #persistenceProxy}. If the request to persist the Model's data is successful,
	 * the Model's data will be {@link #method-commit committed} upon completion.
	 * 
	 * @method save
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * 
	 * @param {Function} [options.success] Function to call if the save is successful.
	 * @param {Data.Model} options.success.model This Model instance.
	 * @param {Object} options.success.data The data returned from the server, or if there was none, the data of the Model.
	 * 
	 * @param {Function} [options.error] Function to call if the save fails.
	 * @param {Data.Model} options.error.model This Model instance.
	 * 
	 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
	 * @param {Data.Model} options.complete.model This Model instance.
	 * 
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in. This may also
	 *   be provided as `context` if you prefer.
	 * 
	 * @return {jQuery.Promise} A Promise object which may have handlers attached. This Model is provided as the first argument to
	 *   `done`, `fail`, and `always` handlers.
	 */
	save : function( options ) {
		options = options || {};
		var scope = options.scope || options.context || window;
		
		
		// No persistenceProxy, cannot save. Throw an error
		if( !this.persistenceProxy ) {
			throw new Error( "Data.Model::save() error: Cannot save. No persistenceProxy." );
		}
		
		// No id attribute, throw an error
		if( !this.hasIdAttribute ) {
			throw new Error( "Data.Model::save() error: Cannot save. Model does not have an idAttribute that relates to a valid attribute." );
		}
		
		
		// Callbacks for the options
		var completeCallback = function() {
			if( options.complete ) {
				options.complete.call( scope, this );
			}
		};
		var successCallback = function( data ) {
			if( options.success ) {
				options.success.call( scope, this, data );
			}
			completeCallback();
		};
		var errorCallback = function() {
			if( options.error ) {
				options.error.call( scope, this );
			}
			completeCallback();
		};
		
		
		// First, synchronize any nested related (i.e. non-embedded) Collections of the model.
		var collectionSyncPromises = [],
		    relatedCollectionAttributes = this.getRelatedCollectionAttributes();
		for( var i = 0, len = relatedCollectionAttributes.length; i < len; i++ ) {
			var collection = this.get( relatedCollectionAttributes[ i ].getName() );
			if( collection ) {  // make sure there is actually a Collection (i.e. it's not null)
				collectionSyncPromises.push( collection.sync() );
			}
		}
		
		var collectionsSyncPromise = jQuery.when.apply( null, collectionSyncPromises );  // create a single Promise object out of all the Collection synchronization promises
		
		// Use the pipe() method to do the actual save of this Model, after all related collections have been 
		// synchronized to the server
		var me = this;
		var modelSavePromise = collectionsSyncPromise.pipe( 
			function() { return me.doSave( options ); }   // New `done` handler, which waits for the save of this Model to complete before considering itself resolved
		);
		
		modelSavePromise
			.done( jQuery.proxy( successCallback, this ) )
			.fail( jQuery.proxy( errorCallback, this ) );
		
		return modelSavePromise;
	},
	
	
	/**
	 * Private method that performs the actual save (persistence) of this Model. This method is called from {@link #save} at the appropriate
	 * time. It is delayed from being called if the Model first has to persist non-{@link Data.attribute.DataComponent#embedded embedded}) 
	 * child collections.
	 * 
	 * @private
	 * @method doSave
	 * @param {Object} options The original `options` object provided to {@link #save}.
	 * @return {jQuery.Promise} The observable Promise object which can be used to determine if the save call has completed
	 *   successfully (`done` callback) or errored (`fail` callback), and to perform any actions that need to be taken in either
	 *   case with the `always` callback.
	 */
	doSave : function( options ) {
		var deferred = new jQuery.Deferred();
		
		// Store a "snapshot" of the data that is being persisted. This is used to compare against the Model's current data at the time of when the persistence operation 
		// completes. Anything that does not match this persisted snapshot data must have been updated while the persistence operation was in progress, and the Model must 
		// be marked as dirty for those attributes after its commit() runs. This is a bit roundabout that a commit() operation runs when the persistence operation is complete
		// and then data is manually modified, but this is also the correct time to run the commit() operation, as we still want to see the changes if the request fails. 
		// So, if a persistence request fails, we should have all of the data still marked as dirty, both the data that was to be persisted, and any new data that was set 
		// while the persistence operation was being attempted.
		var persistedData = _.cloneDeep( this.getData() );
		
		var successCallback = function( data ) {
			data = data || this.getData();

			// The request to persist the data was successful, commit the Model
			this.commit();
			
			// Loop over the persisted snapshot data, and see if any Model attributes were updated while the persistence request was taking place.
			// If so, those attributes should be marked as modified, with the snapshot data used as the "originals". See the note above where persistedData was set. 
			var currentData = this.getData();
			for( var attributeName in persistedData ) {
				if( persistedData.hasOwnProperty( attributeName ) && !_.isEqual( persistedData[ attributeName ], currentData[ attributeName ] ) ) {
					this.modifiedData[ attributeName ] = persistedData[ attributeName ];   // set the last persisted value on to the "modifiedData" object. Note: "modifiedData" holds *original* values, so that the "data" object can hold the latest values. It is how we know an attribute is modified as well.
					this.dirty = true;
				}
			}
			
			deferred.resolve( data );  // calls `done` handlers on the Deferred with the data as the first argument
		};
		
		var errorCallback = function() {
			deferred.reject();  // calls `fail` handlers on the Deferred
		};
		
		var proxyOptions = {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,   // defaults to true
			success  : successCallback,
			error    : errorCallback,
			scope    : this
		};
		
		// Make a request to create or update the data on the server
		this.persistenceProxy[ this.isNew() ? 'create' : 'update' ]( this, proxyOptions );
		
		return deferred.promise();  // return only the observable Promise object of the Deferred
	},
	
	
	
	/**
	 * Destroys the Model on the backend, using the configured {@link #persistenceProxy}.
	 * 
	 * @method destroy
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * 
	 * @param {Function} [options.success] Function to call if the destroy (deletion) is successful.
	 * @param {Data.Model} options.success.model This Model instance.
	 * @param {Object} options.success.data The data returned from the server, or if there was none, the data of the Model.
	 * 
	 * @param {Function} [options.error] Function to call if the destroy (deletion) fails.
	 * @param {Data.Model} options.error.model This Model instance.
	 * 
	 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
	 * @param {Data.Model} options.complete.model This Model instance.
	 * 
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in. This may also
	 *   be provided as `context` if you prefer.
	 * 
	 * @return {jQuery.Promise} A Promise object which may have handlers attached. This Model is provided as the first argument to
	 *   `done`, `fail`, and `always` handlers.
	 */
	destroy : function( options ) {
		options = options || {};
		var scope = options.scope || options.context || window,
		    deferred = new jQuery.Deferred();  // for the return
		
		var completeCallback = function() {
			if( options.complete ) {
				options.complete.call( scope, this );
			}
		};
		var successCallback = function() {
			this.destroyed = true;
			this.fireEvent( 'destroy', this );
			
			if( options.success ) {
				options.success.call( scope, this );
			}
			completeCallback();
			
			deferred.resolve( this );  // calls `done` handlers on the Deferred with this Model as the first argument
		};
		var errorCallback = function() {
			if( options.error ) {
				options.error.call( scope, this );
			}
			completeCallback();
			
			deferred.reject( this );  // calls `fail` handlers on the Deferred with this Model as the first argument
		};
		
		
		if( this.isNew() ) {
			// If it is a new model, there is nothing on the server to destroy. Simply fire the event and call the callback
			successCallback.call( this );
			completeCallback.call( this );
			
		} else {
			// No persistenceProxy, cannot destroy. Throw an error
			// <debug>
			if( !this.persistenceProxy ) {
				throw new Error( "Data.Model::destroy() error: Cannot destroy model on server. No persistenceProxy." );
			}
			// </debug>
			
			var proxyOptions = {
				async    : ( typeof options.async === 'undefined' ) ? true : options.async,   // defaults to true
				success  : successCallback,
				error    : errorCallback,
				scope    : this
			};
			
			// Make a request to destroy the data on the server
			this.persistenceProxy.destroy( this, proxyOptions );
		}
		
		return deferred.promise();  // return just the observable Promise object of the Deferred
	},
	
	
	// --------------------------
	
	// Protected utility methods
	
	
	/**
	 * Retrieves an array of the Attributes configured for this model that are {@link Data.attribute.DataComponent DataComponent Attributes}.
	 * 
	 * @protected
	 * @method getDataComponentAttributes
	 * @return {Data.attribute.DataComponent[]}
	 */
	getDataComponentAttributes : function() {
		var attributes = this.attributes,
		    attribute,
		    DataComponentAttribute = Data.attribute.DataComponent,  // quick reference to constructor
		    dataComponentAttributes = [];
		
		for( var attrName in attributes ) {
			if( attributes.hasOwnProperty( attrName ) && ( attribute = attributes[ attrName ] ) instanceof DataComponentAttribute ) {
				dataComponentAttributes.push( attribute );
			}
		}
		return dataComponentAttributes;
	},
	
	
	/**
	 * Retrieves an array of the Attributes configured for this model that are {@link Data.attribute.DataComponent DataComponent Attributes} 
	 * which are also {@link Data.attribute.DataComponent#embedded}. This is a convenience method that supports the methods which
	 * use the embedded DataComponent Attributes. 
	 * 
	 * @protected
	 * @method getEmbeddedDataComponentAttributes
	 * @return {Data.attribute.DataComponent[]} The array of embedded DataComponent Attributes.
	 */
	getEmbeddedDataComponentAttributes : function() {
		var dataComponentAttributes = this.getDataComponentAttributes(),
		    dataComponentAttribute,
		    embeddedAttributes = [];
		
		for( var i = 0, len = dataComponentAttributes.length; i < len; i++ ) {
			dataComponentAttribute = dataComponentAttributes[ i ];
			
			if( dataComponentAttribute.isEmbedded() ) {
				embeddedAttributes.push( dataComponentAttribute );
			}
		}
		return embeddedAttributes;
	},
	
	
	/**
	 * Retrieves an array of the Attributes configured for this model that are {@link Data.attribute.Collection Collection Attributes}.
	 * 
	 * @protected
	 * @method getCollectionAttributes
	 * @return {Data.attribute.Collection[]}
	 */
	getCollectionAttributes : function() {
		var dataComponentAttributes = this.getDataComponentAttributes(),
		    dataComponentAttribute,
		    CollectionAttribute = Data.attribute.Collection,  // quick reference to constructor
		    collectionAttributes = [];
		
		for( var i = 0, len = dataComponentAttributes.length; i < len; i++ ) {
			dataComponentAttribute = dataComponentAttributes[ i ];
			
			if( dataComponentAttribute instanceof CollectionAttribute ) {
				collectionAttributes.push( dataComponentAttribute );
			}
		}
		return collectionAttributes;
	},
	
	
	/**
	 * Retrieves an array of the Attributes configured for this model that are {@link Data.attribute.Collection Collection Attributes},
	 * but are *not* {@link Data.attribute.Collection#embedded embedded} attributes (i.e. they are "related" attributes).
	 * 
	 * @protected
	 * @method getRelatedCollectionAttributes
	 * @return {Data.attribute.Collection[]} 
	 */
	getRelatedCollectionAttributes : function() {
		var collectionAttributes = this.getCollectionAttributes(),
		    relatedCollectionAttributes = [];
		
		for( var i = 0, len = collectionAttributes.length; i < len; i++ ) {
			if( !collectionAttributes[ i ].isEmbedded() ) {
				relatedCollectionAttributes.push( collectionAttributes[ i ] );
			}
		}
		return relatedCollectionAttributes;
	}
	
} );


/**
 * Alias of {@link #reload}. See {@link #reload} for description and arguments.
 * 
 * @method fetch
 */
Data.Model.prototype.fetch = Data.Model.prototype.reload;

/**
 * Backward compatibility alias of {@link #reload}. See {@link #reload} for description and arguments.
 * 
 * @method load
 */
Data.Model.prototype.load = Data.Model.prototype.reload;


/**
 * Alias of {@link #getData}, which is currently just for compatibility with 
 * Backbone's Collection. Do not use. Use {@link #getData} instead.
 * 
 * @method toJSON
 */
Data.Model.prototype.toJSON = Data.Model.prototype.getData;


/**
 * For compatibility with Backbone's Collection, when it is called from Collection's `_onModelEvent()`
 * method. `_onModelEvent()` asks for the previous `id` of the Model when the id attribute changes,
 * such as when a Model is created on the server. This method simply returns undefined for this purpose,
 * but if more compatibility is needed, it could return the original data for a given attribute (which is
 * a little different than Backbone's notion of "previous" data, which is the previous data from before any
 * current 'change' event).
 * 
 * @method previous
 * @param {String} attributeName
 */
Data.Model.prototype.previous = function( attributeName ) {
	return undefined;
};

/**
 * @class Data.Collection
 * @extends Data.DataComponent
 * 
 * Manages an ordered set of {@link Data.Model Models}. This class itself is not meant to be used directly, 
 * but rather extended and configured for the different collections in your application.
 * 
 * Ex:
 *     
 *     myApp.Todos = Data.Collection.extend( {
 *         model: myApp.Todo
 *     } );
 * 
 * 
 * Note: Configuration options should be placed on the prototype of a Collection subclass.
 * 
 * 
 * ### Model Events
 * 
 * Collections automatically relay all of their {@link Data.Model Models'} events as if the Collection
 * fired it. The collection instance provides itself in the handler though. For example, Models' 
 * {@link Data.Model#event-change change} events:
 *     
 *     var Model = Data.Model.extend( {
 *         attributes: [ 'name' ]
 *     } );
 *     var Collection = Data.Collection.extend( {
 *         model : Model
 *     } );
 * 
 *     var model1 = new Model( { name: "Greg" } ),
 *         model2 = new Model( { name: "Josh" } );
 *     var collection = new Collection( [ model1, model2 ] );
 *     collection.on( 'change', function( collection, model, attributeName, newValue, oldValue ) {
 *         console.log( "A model changed its '" + attributeName + "' attribute from '" + oldValue + "' to '" + newValue + "'" );
 *     } );
 * 
 *     model1.set( 'name', "Gregory" );
 *       // "A model changed its 'name' attribute from 'Greg' to 'Gregory'"
 */
/*global window, jQuery, _, Data */
Data.Collection = Data.DataComponent.extend( {
	
	/**
	 * @cfg {Function} model
	 * 
	 * The Data.Model (sub)class which will be used to convert any anonymous data objects into
	 * its appropriate Model instance for the Collection. 
	 * 
	 * Note that if a factory method is required for the creation of models, where custom processing may be needed,
	 * override the {@link #createModel} method in a subclass.
	 * 
	 * It is recommended that you subclass Data.Collection, and add this configuration as part of the definition of the 
	 * subclass. Ex:
	 * 
	 *     myApp.MyCollection = Data.Collection.extend( {
	 *         model : myApp.MyModel
	 *     } );
	 */
	
	/**
	 * @cfg {Function} sortBy
	 * A function that is used to keep the Collection in a sorted ordering. Without one, the Collection will
	 * simply keep models in insertion order.
	 * 
	 * This function takes two arguments: each a {@link Data.Model Model}, and should return `-1` if the 
	 * first model should be placed before the second, `0` if the models are equal, and `1` if the 
	 * first model should come after the second.
	 * 
	 * Ex:
	 *     
	 *     sortBy : function( model1, model2 ) { 
	 *         var name1 = model1.get( 'name' ),
	 *             name2 = model2.get( 'name' );
	 *         
	 *         return ( name1 < name2 ) ? -1 : ( name1 > name2 ) ? 1 : 0;
	 *     }
	 * 
	 * It is recommended that you subclass Data.Collection, and add the sortBy function in the definition of the subclass. Ex:
	 * 
	 *     myApp.MyCollection = Data.Collection.extend( {
	 *         sortBy : function( model1, model2 ) {
	 *             // ...
	 *         }
	 *     } );
	 *     
	 *     
	 *     // And instantiating:
	 *     var myCollection = new myApp.MyCollection();
	 */
	
	/**
	 * @cfg {Object/Data.Model/Object[]/Data.Model[]} models
	 * If providing a configuration object to the Data.Collection constructor instead of an array of initial models, the initial 
	 * model(s) may be specified using this configuration option. Can be a single model or an array of models (or object / array of
	 * objects that will be converted to models).
	 * 
	 * Ex:
	 * 
	 *     // Assuming you have created a myApp.MyModel subclass of {@link Data.Model},
	 *     // and a myApp.MyCollection subclass of Data.Collection
	 *     var model1 = new myApp.MyModel(),
	 *         model2 = new myApp.MyModel();
	 *     
	 *     var collection = new myApp.MyCollection( {
	 *         models: [ model1, model2 ]
	 *     } );
	 */
	
	
	
	/**
	 * @protected
	 * @property {Data.Model[]} models
	 * 
	 * The array that holds the Models, in order.
	 */
	
	/**
	 * @protected
	 * @property {Object} modelsByClientId
	 * 
	 * An object (hashmap) of the models that the Collection is currently holding, keyed by the models' {@link Data.Model#clientId clientId}.
	 */
	
	/**
	 * @protected
	 * @property {Object} modelsById
	 * 
	 * An object (hashmap) of the models that the Collection is currently holding, keyed by the models' {@link Data.Model#id id}, if the model has one.
	 */
	
	/**
	 * @protected
	 * @property {Data.Model[]} removedModels
	 * 
	 * An array that holds Models removed from the Collection, which haven't yet been {@link #sync synchronized} to the server yet (by 
	 * {@link Data.Model#method-destroy destroying} them).
	 */
	
	/**
	 * @private
	 * @property {Boolean} modified
	 * 
	 * Flag that is set to true whenever there is an addition, insertion, or removal of a model in the Collection.
	 */
	modified : false,
	
	
	
	/**
	 * Creates a new Collection instance.
	 * 
	 * @constructor
	 * @param {Object/Object[]/Data.Model[]} config This can either be a configuration object (in which the options listed
	 *   under "configuration options" can be provided), or an initial set of Models to provide to the Collection. If providing
	 *   an initial set of models, they must be wrapped in an array. Note that an initial set of models can be provided when using
	 *   a configuration object with the {@link #cfg-models} config.
	 */
	constructor : function( config ) {
		this._super( arguments );
		
		this.addEvents(
			/**
			 * Fires when one or more models have been added to the Collection. This event is fired once for each
			 * model that is added. To respond to a set of model adds all at once, use the {@link #event-addset} 
			 * event instead. 
			 * 
			 * @event add
			 * @param {Data.Collection} collection This Collection instance.
			 * @param {Data.Model} model The model instance that was added. 
			 */
			'add',
			
			/**
			 * Responds to a set of model additions by firing after one or more models have been added to the Collection. 
			 * This event fires with an array of the added model(s), so that the additions may be processed all at 
			 * once. To respond to each addition individually, use the {@link #event-add} event instead. 
			 * 
			 * @event addset
			 * @param {Data.Collection} collection This Collection instance.
			 * @param {Data.Model[]} models The array of model instances that were added. This will be an
			 *   array of the added models, even in the case that a single model is added.
			 */
			'addset',
			
			/**
			 * Fires when a model is reordered within the Collection. A reorder can be performed
			 * by calling the {@link #insert} method with a given index of where to re-insert one or
			 * more models. If the model did not yet exist in the Collection, it will *not* fire a 
			 * reorder event, but will be provided with an {@link #event-add add} event instead. 
			 * 
			 * This event is fired once for each model that is reordered.
			 * 
			 * @event reorder
			 * @param {Data.Collection} collection This Collection instance.
			 * @param {Data.Model} model The model that was reordered.
			 * @param {Number} newIndex The new index for the model.
			 * @param {Number} oldIndex The old index for the model.
			 */
			'reorder',
			
			/**
			 * Fires when one or more models have been removed from the Collection. This event is fired once for each
			 * model that is removed. To respond to a set of model removals all at once, use the {@link #event-removeset} 
			 * event instead.
			 * 
			 * @event remove
			 * @param {Data.Collection} collection This Collection instance.
			 * @param {Data.Model} model The model instances that was removed.
			 * @param {Number} index The index that the model was removed from.
			 */
			'remove',
			
			/**
			 * Responds to a set of model removals by firing after one or more models have been removed from the Collection. 
			 * This event fires with an array of the removed model(s), so that the removals may be processed all at once. 
			 * To respond to each removal individually, use the {@link #event-remove} event instead.
			 * 
			 * @event removeset
			 * @param {Data.Collection} collection This Collection instance.
			 * @param {Data.Model[]} models The array of model instances that were removed. This will be an
			 *   array of the removed models, even in the case that a single model is removed.
			 */
			'removeset'
		);
		
		
		var initialModels;
		
		// If the "config" is an array, it must be an array of initial models
		if( _.isArray( config ) ) {
			initialModels = config;
			
		} else if( typeof config === 'object' ) {
			_.assign( this, config );
			
			initialModels = this.models;  // grab any initial models in the config
		}
		
		
		// If a 'sortBy' exists, and it is a function, create a bound function to bind it to this Collection instance
		// for when it is passed into Array.prototype.sort()
		if( typeof this.sortBy === 'function' ) {
			this.sortBy = _.bind( this.sortBy, this );
		}
		
		
		this.models = [];
		this.modelsByClientId = {};
		this.modelsById = {};
		this.removedModels = [];
		
		
		if( initialModels ) {
			this.add( initialModels );
			this.modified = false;  // initial models should not make the collection "modified". Note: NOT calling commit() here, because we may not want to commit changed model data. Need to figure that out.
		}
		
		// Call hook method for subclasses
		this.initialize();
	},
	
	
	/**
	 * Hook method for subclasses to initialize themselves. This method should be overridden in subclasses to 
	 * provide any model-specific initialization.
	 * 
	 * Note that it is good practice to always call the superclass `initialize` method from within yours (even if
	 * your class simply extends Data.Collection, which has no `initialize` implementation itself). This is to future proof it
	 * from being moved under another superclass, or if there is ever an implementation made in this class.
	 * 
	 * Ex:
	 * 
	 *     MyCollection = Data.Collection.extend( {
	 *         initialize : function() {
	 *             MyCollection.superclass.initialize.apply( this, arguments );   // or could be MyCollection.__super__.initialize.apply( this, arguments );
	 *             
	 *             // my initialization logic goes here
	 *         }
	 *     }
	 * 
	 * @protected
	 * @method initialize
	 */
	initialize : Data.emptyFn,
	
	
	
	// -----------------------------
	
	
	/**
	 * If a model is provided as an anonymous data object, this method will be called to transform the data into 
	 * the appropriate {@link Data.Model model} class, using the {@link #model} config.
	 * 
	 * This may be overridden in subclasses to allow for custom processing, or to create a factory method for Model creation.
	 * 
	 * @protected
	 * @method createModel
	 * @param {Object} modelData
	 * @return {Data.Model} The instantiated model.
	 */
	createModel : function( modelData ) {
		if( !this.model ) {
			throw new Error( "Cannot instantiate model from anonymous data, 'model' config not provided to Collection." );
		}
		
		return new this.model( modelData );
	},
	
	
	
	/**
	 * Adds one or more models to the Collection.
	 * 
	 * @method add
	 * @param {Data.Model/Data.Model[]/Object/Object[]} models One or more models to add to the Collection. This may also
	 *   be one or more anonymous objects, which will be converted into models based on the {@link #model} config.
	 */
	add : function( models ) {
		this.insert( models );
	},
	
	
	/**
	 * Inserts (or moves) one or more models into the Collection, at the specified `index`.
	 * Fires the {@link #event-add add} event for models that are newly inserted into the Collection,
	 * and the {@link #event-reorder} event for models that are simply moved within the Collection.
	 * 
	 * @method insert
	 * @param {Data.Model/Data.Model[]} models The model(s) to insert.
	 * @param {Number} index The index to insert the models at.
	 */
	insert : function( models, index ) {
		var indexSpecified = ( typeof index !== 'undefined' ),
		    i, len, model, modelId,
		    addedModels = [];
		
		// First, normalize the `index` if it is out of the bounds of the models array
		if( typeof index !== 'number' ) {
			index = this.models.length;  // append by default
		} else if( index < 0 ) {
			index = 0;
		} else if( index > this.models.length ) {
			index = this.models.length;
		}
		
		// Normalize the argument to an array
		if( !_.isArray( models ) ) {
			models = [ models ];
		}
		
		// No models to insert, return
		if( models.length === 0 ) {
			return;
		}
		
		for( i = 0, len = models.length; i < len; i++ ) {
			model = models[ i ];
			if( !( model instanceof Data.Model ) ) {
				model = this.createModel( model );
			}
						
			// Only add if the model does not already exist in the collection
			if( !this.has( model ) ) {
				this.modified = true;  // model is being added, then the Collection has been modified
				
				addedModels.push( model );
				this.modelsByClientId[ model.getClientId() ] = model;
				
				// Insert the model into the models array at the correct position
				this.models.splice( index, 0, model );  // 0 elements to remove
				index++;  // increment the index for the next model to insert / reorder
				
				if( model.hasIdAttribute() ) {  // make sure the model actually has a valid idAttribute first, before trying to call getId()
					modelId = model.getId();
					if( modelId !== undefined && modelId !== null ) {
						this.modelsById[ modelId ] = model;
					}
					
					// Respond to any changes on the idAttribute
					model.on( 'change:' + model.getIdAttribute().getName(), this.onModelIdChange, this );
				}
				
				// Subscribe to the special 'all' event on the model, so that the Collection can relay all of the model's events
				model.on( 'all', this.onModelEvent, this );
				
				this.fireEvent( 'add', this, model );
				
			} else {
				// Handle a reorder, but only actually move the model if a new index was specified.
				// In the case that add() is called, no index will be specified, and we don't want to
				// "re-add" models
				if( indexSpecified ) {
					this.modified = true;  // model is being reordered, then the Collection has been modified
					
					var oldIndex = this.indexOf( model );
					
					// Move the model to the new index
					this.models.splice( oldIndex, 1 );
					this.models.splice( index, 0, model );
					
					this.fireEvent( 'reorder', this, model, index, oldIndex );
					index++; // increment the index for the next model to insert / reorder
				}
			}
		}
		
		// If there is a 'sortBy' config, use that now
		if( this.sortBy ) {
			this.models.sort( this.sortBy );  // note: the sortBy function has already been bound to the correct scope
		}
		
		// Fire the 'add' event for models that were actually inserted into the Collection (meaning that they didn't already
		// exist in the collection). Don't fire the event though if none were actually inserted (there could have been models
		// that were simply reordered).
		if( addedModels.length > 0 ) {
			this.fireEvent( 'addset', this, addedModels );
		}
	},
	
	
	
	/**
	 * Removes one or more models from the Collection. Fires the {@link #event-remove} event with the
	 * models that were actually removed.
	 * 
	 * @method remove
	 * @param {Data.Model/Data.Model[]} models One or more models to remove from the Collection.
	 */
	remove : function( models ) {
		var collectionModels = this.models,
		    removedModels = [],
		    i, len, model, modelIndex;
		
		// Normalize the argument to an array
		if( !_.isArray( models ) ) {
			models = [ models ];
		}
		
		for( i = 0, len = models.length; i < len; i++ ) {
			model = models[ i ];
			modelIndex = this.indexOf( model );
			
			// Don't bother doing anything to remove the model if we know it doesn't exist in the Collection
			if( modelIndex > -1 ) {
				this.modified = true;  // model is being removed, then the Collection has been modified
				
				delete this.modelsByClientId[ model.getClientId() ];
				
				if( model.hasIdAttribute() ) {   // make sure the model actually has a valid idAttribute first, before trying to call getId()
					delete this.modelsById[ model.getId() ];
					
					// Remove the listener for changes on the idAttribute
					model.un( 'change:' + model.getIdAttribute().getName(), this.onModelIdChange, this );
				}
				
				// Unsubscribe the special 'all' event listener from the model
				model.un( 'all', this.onModelEvent, this );
				
				// Remove the model from the models array
				collectionModels.splice( modelIndex, 1 );
				this.fireEvent( 'remove', this, model, modelIndex );
				
				removedModels.push( model );
				this.removedModels.push( model );  // Add reference to the model just removed, for when synchronizing the collection (using sync()). This is an array of all non-destroyed models that have been removed from the Collection, and is reset when those models are destroyed.
			}
		}
		
		if( removedModels.length > 0 ) {
			this.fireEvent( 'removeset', this, removedModels );
		}
	},
	
	
	/**
	 * Removes all models from the Collection. Fires the {@link #event-remove} event with the models
	 * that were removed.
	 * 
	 * @method removeAll
	 */
	removeAll : function() {
		this.remove( _.clone( this.models ) );  // make a shallow copy of the array to send to this.remove()
	},
	
	
	/**
	 * Handles a change to a model's {@link Data.Model#idAttribute}, so that the Collection's 
	 * {@link #modelsById} hashmap can be updated.
	 * 
	 * Note that {@link #onModelEvent} is still called even when this method executes.
	 * 
	 * @protected
	 * @method onModelIdChange
	 * @param {Data.Model} model The model that fired the change event.
	 * @param {Mixed} newValue The new value.
	 * @param {Mixed} oldValue The old value. 
	 */
	onModelIdChange : function( model, newValue, oldValue ) {
		delete this.modelsById[ oldValue ];
		
		if( newValue !== undefined && newValue !== null ) {
			this.modelsById[ newValue ] = model;
		}
	},
	
	
	/**
	 * Handles an event fired by a Model in the Collection by relaying it from the Collection
	 * (as if the Collection had fired it).
	 * 
	 * @protected
	 * @method onModelEvent
	 * @param {String} eventName
	 * @param {Mixed...} args The original arguments passed to the event.
	 */
	onModelEvent : function( eventName ) {
		// If the model was destroyed, we need to remove it from the collection
		if( eventName === 'destroy' ) {
			var model = arguments[ 1 ];  // arguments[ 1 ] is the model for the 'destroy' event
			this.remove( model );   // if the model is destroyed on its own, remove it from the collection. If it has been destroyed from the collection's sync() method, then this will just have no effect.
			
			// If the model was destroyed manually on its own, remove the model from the removedModels array, so we don't try to destroy it (again)
			// when sync() is executed.
			var removedModels = this.removedModels;
			for( var i = 0, len = removedModels.length; i < len; i++ ) {
				if( removedModels[ i ] === model ) {
					removedModels.splice( i, 1 );
					break;
				}
			}
		}
		
		// Relay the event from the collection, passing the collection itself, and the original arguments
		this.fireEvent.apply( this, [ eventName, this ].concat( Array.prototype.slice.call( arguments, 1 ) ) );
	},
	
	
	// ----------------------------
	
	
	/**
	 * Retrieves the Model at a given index.
	 * 
	 * @method getAt
	 * @param {Number} index The index to to retrieve the model at.
	 * @return {Data.Model} The Model at the given index, or null if the index was out of range.
	 */
	getAt : function( index ) {
		return this.models[ index ] || null;
	},
	
	
	/**
	 * Convenience method for retrieving the first {@link Data.Model model} in the Collection.
	 * If the Collection does not have any models, returns null.
	 * 
	 * @method getFirst
	 * @return {Data.Model} The first model in the Collection, or null if the Collection does not have
	 *   any models.
	 */
	getFirst : function() {
		return this.models[ 0 ] || null;
	},
	
	
	/**
	 * Convenience method for retrieving the last {@link Data.Model model} in the Collection.
	 * If the Collection does not have any models, returns null.
	 * 
	 * @method getLast
	 * @return {Data.Model} The last model in the Collection, or null if the Collection does not have
	 *   any models.
	 */
	getLast : function() {
		return this.models[ this.models.length - 1 ] || null;
	},
	
	
	/**
	 * Retrieves a range of {@link Data.Model Models}, specified by the `startIndex` and `endIndex`. These values are inclusive.
	 * For example, if the Collection has 4 Models, and `getRange( 1, 3 )` is called, the 2nd, 3rd, and 4th models will be returned.
	 * 
	 * @method getRange
	 * @param {Number} [startIndex=0] The starting index.
	 * @param {Number} [endIndex] The ending index. Defaults to the last Model in the Collection.
	 * @return {Data.Model[]} The array of models from the `startIndex` to the `endIndex`, inclusively.
	 */
	getRange : function( startIndex, endIndex ) {
		var models = this.models,
		    numModels = models.length,
		    range = [],
		    i;
		
		if( numModels === 0 ) {
			return range;
		}
		
		startIndex = Math.max( startIndex || 0, 0 ); // don't allow negative indexes
		endIndex = Math.min( typeof endIndex === 'undefined' ? numModels - 1 : endIndex, numModels - 1 );
		
		for( i = startIndex; i <= endIndex; i++ ) {
			range.push( models[ i ] );
		}
		return range; 
	},
	
	
	/**
	 * Retrieves all of the models that the Collection has, in order.
	 * 
	 * @method getModels
	 * @return {Data.Model[]} An array of the models that this Collection holds.
	 */
	getModels : function() {
		return this.getRange();  // gets all models
	},
	
	
	/**
	 * Retrieves the Array representation of the Collection, where all models are converted into native JavaScript Objects.  The attribute values
	 * for each of the models are retrieved via the {@link Data.Model#get} method, to pre-process the data before they are returned in the final 
	 * array of objects, unless the `raw` option is set to true, in which case the Model attributes are retrieved via {@link Data.Model#raw}. 
	 * 
	 * @override
	 * @method getData
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
	 *   the {@link Data.data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
	 *   that the {@link Data.data.NativeObjectConverter#convert} method does. See that method for details.
	 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link Data.attribute.Attribute Attribute} values.
	 */
	getData : function( options ) {
		return Data.data.NativeObjectConverter.convert( this, options );
	},
	
	
	
	/**
	 * Retrieves the number of models that the Collection currently holds.
	 * 
	 * @method getCount
	 * @return {Number} The number of models that the Collection currently holds.
	 */
	getCount : function() {
		return this.models.length;
	},
	
	
	/**
	 * Retrieves a Model by its {@link Data.Model#clientId clientId}.
	 * 
	 * @method getByClientId
	 * @param {Number} clientId
	 * @return {Data.Model} The Model with the given {@link Data.Model#clientId clientId}, or null if there is 
	 *   no Model in the Collection with that {@link Data.Model#clientId clientId}.
	 */
	getByClientId : function( clientId ) {
		return this.modelsByClientId[ clientId ] || null;
	},
	
	
	/**
	 * Retrieves a Model by its {@link Data.Model#id id}. Note: if the Model does not yet have an id, it will not
	 * be able to be retrieved by this method.
	 * 
	 * @method getById
	 * @param {Mixed} id The id value for the {@link Data.Model Model}.
	 * @return {Data.Model} The Model with the given {@link Data.Model#id id}, or `null` if no Model was found 
	 *   with that {@link Data.Model#id id}.
	 */
	getById : function( id ) {
		return this.modelsById[ id ] || null;
	},
	
	
	/**
	 * Determines if the Collection has a given {@link Data.Model model}.
	 * 
	 * @method has
	 * @param {Data.Model} model
	 * @return {Boolean} True if the Collection has the given `model`, false otherwise.
	 */
	has : function( model ) {
		return !!this.getByClientId( model.getClientId() );
	},
	
	
	/**
	 * Retrieves the index of the given {@link Data.Model model} within the Collection. 
	 * Returns -1 if the `model` is not found.
	 * 
	 * @method indexOf
	 * @param {Data.Model} model
	 * @return {Number} The index of the provided `model`, or of -1 if the `model` was not found.
	 */
	indexOf : function( model ) {
		var models = this.models,
		    i, len;
		
		if( !this.has( model ) ) {
			// If the model isn't in the Collection, return -1 immediately
			return -1;
			
		} else {
			for( i = 0, len = models.length; i < len; i++ ) {
				if( models[ i ] === model ) {
					return i;
				}
			}
		}
	},
	
	
	/**
	 * Retrieves the index of a given {@link Data.Model model} within the Collection by its
	 * {@link Data.Model#idAttribute id}. Returns -1 if the `model` is not found.
	 * 
	 * @method indexOfId
	 * @param {Mixed} id The id value for the model.
	 * @return {Number} The index of the model with the provided `id`, or of -1 if the model was not found.
	 */
	indexOfId : function( id ) {
		var model = this.getById( id );
		if( model ) {
			return this.indexOf( model );
		}
		return -1;
	},
	
	
	// ----------------------------
	
	
	/**
	 * Commits any changes in the Collection, so that it is no longer considered "modified".
	 * 
	 * @override
	 * @method commit
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.shallow=false] True to only commit only the additions/removals/reorders
	 *   of the Collection itself, but not its child Models.
	 */
	commit : function( options ) {
		options = options || {};
		
		this.modified = false;  // reset flag
		
		if( !options.shallow ) {
			var models = this.models;
			for( var i = 0, len = models.length; i < len; i++ ) {
				models[ i ].commit();
			}
		}
	},
	
	
	
	/**
	 * Rolls any changes to the Collection back to its state when it was last {@link #commit committed}
	 * or rolled back.
	 * 
	 * @override
	 * @method rollback 
	 */
	rollback : function() {
		this.modified = false;  // reset flag
		
		// TODO: Implement rolling back the collection's state to the array of models that it had before any
		// changes were made
		
		
		// TODO: Determine if child models should also be rolled back. Possibly a flag argument for this?
		// But for now, maintain consistency with isModified()
		var models = this.models;
		for( var i = 0, len = models.length; i < len; i++ ) {
			models[ i ].rollback();
		}
	},
	
	
	/**
	 * Determines if the Collection has been added to, removed from, reordered, or 
	 * has any {@link Data.Model models} which are modified.
	 * 
	 * @method isModified
	 * 
	 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This may be provided as the first argument to the
	 *   method if no `attributeName` is to be provided. Options may include:
	 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true only if a Model exists within it that has a 
	 *   {@link Data.attribute.Attribute#persist persisted} attribute which is modified. However, if the Collection itself has been modified
	 *   (by adding/reordering/removing a Model), this method will still return true.
	 * @param {Boolean} [options.shallow=false] True to only check if the Collection itself has been added to, remove from, or has had its Models
	 *   reordered. The method will not check child models if they are modified.
	 * 
	 * @return {Boolean} True if the Collection has any modified models, false otherwise.
	 */
	isModified : function( options ) {
		options = options || {};
		
		// First, if the collection itself has been added to / removed from / reordered, then it is modified
		if( this.modified ) {
			return true;
			
		} else if( !options.shallow ) {
			// Otherwise, check to see if any of its child models are modified.
			var models = this.models,
			    i, len;
			
			for( i = 0, len = models.length; i < len; i++ ) {
				if( models[ i ].isModified( options ) ) {
					return true;
				}
			}
			return false;
		}
	},
	
	
	// ----------------------------
	
	// Searching methods
	
	/**
	 * Finds the first {@link Data.Model Model} in the Collection by {@link Data.attribute.Attribute Attribute} name, and a given value.
	 * Uses `===` to compare the value. If a more custom find is required, use {@link #findBy} instead.
	 * 
	 * Note that this method is more efficient than using {@link #findBy}, so if it can be used, it should.
	 * 
	 * @method find
	 * @param {String} attributeName The name of the attribute to test the value against.
	 * @param {Mixed} value The value to look for.
	 * @param {Object} [options] Optional arguments for this method, provided in an object (hashmap). Accepts the following:
	 * @param {Number} [options.startIndex] The index in the Collection to start searching from.
	 * @return {Data.Model} The model where the attribute name === the value, or `null` if no matching model was not found.
	 */
	find : function( attributeName, value, options ) {
		options = options || {};
		
		var models = this.models,
		    startIndex = options.startIndex || 0;
		for( var i = startIndex, len = models.length; i < len; i++ ) {
			if( models[ i ].get( attributeName ) === value ) {
				return models[ i ];
			}
		}
		return null;
	},
	
	
	/**
	 * Finds the first {@link Data.Model Model} in the Collection, using a custom function. When the function returns true,
	 * the model is returned. If the function does not return true for any models, `null` is returned.
	 * 
	 * @method findBy
	 * 
	 * @param {Function} fn The function used to find the Model. Should return an explicit boolean `true` when there is a match. 
	 *   This function is passed the following arguments:
	 * @param {Data.Model} fn.model The current Model that is being processed in the Collection.
	 * @param {Number} fn.index The index of the Model in the Collection.
	 * 
	 * @param {Object} [options]
	 * @param {Object} [options.scope] The scope to run the function in.
	 * @param {Number} [options.startIndex] The index in the Collection to start searching from.
	 * 
	 * @return {Data.Model} The model that the function returned `true` for, or `null` if no match was found.
	 */
	findBy : function( fn, options ) {
		options = options || {};
		
		var models = this.models,
		    scope = options.scope || window,
		    startIndex = options.startIndex || 0;
		    
		for( var i = startIndex, len = models.length; i < len; i++ ) {
			if( fn.call( scope, models[ i ], i ) === true ) {
				return models[ i ];
			}
		}
		return null;
	},
	
	
	// ----------------------------
	
	// Persistence methods
	
	
	/**
	 * Synchronizes the Collection by persisting each of the {@link Data.Model Models} that have changes. New Models are created,
	 * existing Models are modified, and removed Models are deleted.
	 * 
	 * @method sync
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the synchronization is successful.
	 * @param {Function} [options.error] Function to call if the synchronization fails. The sychronization will be considered
	 *   failed if one or more Models does not persist successfully.
	 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in. This may also
	 *   be provided as `context` if you prefer.
	 * @return {jQuery.Promise} A Promise object which may have handlers attached. 
	 */
	sync : function( options ) {
		options = options || {};
		var scope = options.scope || options.context || window;
		
				
		var models = this.getModels(),
		    newModels = [],
		    modifiedModels = [],
		    removedModels = this.removedModels,
		    i, len;
		
		// Put together an array of all of the new models, and the modified models
		for( i = 0, len = models.length; i < len; i++ ) {
			var model = models[ i ];
			
			if( model.isNew() ) {
				newModels.push( model );
			} else if( model.isModified( { persistedOnly: true } ) ) {  // only check "persisted" attributes
				modifiedModels.push( model );
			}
		}
		
		
		// Callbacks for the options to this function
		var successCallback = function() {
			if( options.success ) { options.success.call( scope ); }
		};
		var errorCallback = function() {
			if( options.error ) { options.error.call( scope ); }
		};
		var completeCallback = function() {
			if( options.complete ) { options.complete.call( scope ); }
		};
		
		// A callback where upon successful destruction of a model, remove the model from the removedModels array, so that we don't try to destroy it again from another call to sync()
		var destroySuccess = function( model ) {
			for( var i = 0, len = removedModels.length; i < len; i++ ) {
				if( removedModels[ i ] === model ) {
					removedModels.splice( i, 1 );
					break;
				}
			}
		};
		
		
		// Now synchronize the models
		var promises = [],
		    modelsToSave = newModels.concat( modifiedModels );
		
		for( i = 0, len = modelsToSave.length; i < len; i++ ) {
			var savePromise = modelsToSave[ i ].save( {
				async   : options.async
			} );
			promises.push( savePromise );
		}
		for( i = removedModels.length - 1; i >= 0; i-- ) {  // Loop this one backwards, as destroyed models will be removed from the array as they go if they happen synchronously
			var destroyPromise = removedModels[ i ].destroy( {
				async   : options.async
			} );
			destroyPromise.done( destroySuccess );  // Upon successful destruction, we want to remove the model from the removedModels array, so that we don't try to destroy it again
			promises.push( destroyPromise );
		}
		
		// The "overall" promise that will either succeed if all persistence requests are made successfully, or fail if just one does not.
		var overallPromise = jQuery.when.apply( null, promises );  // apply all of the promises as arguments
		overallPromise.done( successCallback, completeCallback );
		overallPromise.fail( errorCallback, completeCallback );
		
		return overallPromise;  // Return a jQuery.Promise object for all the promises
	}

} );

/**
 * @abstract
 * @class Data.attribute.Attribute
 * @extends Object
 * 
 * Base attribute definition class for {@link Data.Model Models}. The Attribute itself does not store data, but instead simply
 * defines the behavior of a {@link Data.Model Model's} attributes. A {@link Data.Model Model} is made up of Attributes. 
 * 
 * Note: You will most likely not instantiate Attribute objects directly. This is used by {@link Data.Model} with its
 * {@link Data.Model#cfg-attributes attributes} prototype config. Anonymous config objects provided to {@link Data.Model#cfg-attributes attributes}
 * will be passed to the Attribute constructor.
 */
/*global _, Class, Data */
Data.attribute.Attribute = Class.extend( Object, {
	
	abstractClass: true,
	
	
	/**
	 * @cfg {String} name (required)
	 * The name for the attribute, which is used by the owner Model to reference it.
	 */
	name : "",
	
	/**
	 * @cfg {String} type
	 * Specifies the type of the Attribute, in which a conversion of the raw data will be performed.
	 * This accepts the following general types, but custom types may be added using the {@link Data.attribute.Attribute#registerType} method.
	 * 
	 * - {@link Data.attribute.Mixed mixed}: Performs no conversions, and no special processing of given values. This is the default Attribute type (not recommended).
	 * - {@link Data.attribute.String string}
	 * - {@link Data.attribute.Integer int} / {@link Data.attribute.Integer integer}
	 * - {@link Data.attribute.Float float} (really a "double")
	 * - {@link Data.attribute.Boolean boolean} / {@link Data.attribute.Boolean bool}
	 * - {@link Data.attribute.Date date}
	 * - {@link Data.attribute.Model model}
	 * - {@link Data.attribute.Collection collection}
	 */
	
	/**
	 * @cfg {Mixed/Function} defaultValue
	 * The default value for the Attribute, if it has no value of its own. This can also be specified as the config 'default', 
	 * but must be wrapped in quotes (as `default` is a reserved word in JavaScript).
	 *
	 * If the defaultValue is a function, the function will be executed each time a Model is created, and its return value used as 
	 * the defaultValue. This is useful, for example, to assign a new unique number to an attribute of a model. Ex:
	 * 
	 *     MyModel = Data.Model.extend( {
	 *         attributes : [
	 *             {
	 *                 name: 'uniqueId', 
	 *                 defaultValue: function( attribute ) {
	 *                     return _.uniqueId(); 
	 *                 }
	 *             }
	 *         ]
	 *     } );
	 * 
	 * Note that the function is passed the Attribute as its first argument, which may be used to query Attribute properties/configs.
	 * 
	 * If an Object is provided as the defaultValue, its properties will be recursed and searched for functions. The functions will
	 * be executed to provide default values for nested properties of the object in the same way that providing a Function for this config
	 * will do.
	 */
	
	/**
	 * @cfg {Function} set
	 * A function that can be used to convert the raw value provided to the attribute, to a new value which will be stored
	 * on the {@link Data.Model Model}. This function is passed the following arguments:
	 * 
	 * @cfg {Mixed} set.newValue The provided new data value to the attribute. If the attribute has no initial data value, its {@link #defaultValue}
	 *   will be provided to this argument upon instantiation of the {@link Data.Model Model}.
	 * @cfg {Mixed} set.oldValue The old value that the attribute held (if any).
	 * 
	 * The function should then do any processing that is necessary, and return the value that the Attribute should hold. For example,
	 * this `set` function will convert a string value to a 
	 * <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date" target="_blank">Date</a>
	 * object. Otherwise, it will return the value unchanged:
	 *     
	 *     {
	 *         name : 'myDateAttr',
	 *         
	 *         set : function( newValue, oldValue ) {
	 *             if( typeof value === 'string' ) {
	 *                 value = new Date( value );
	 *             }
	 *             return value;
	 *         }
	 *     }
	 * 
	 * Just as with {@link #get}, the `set` function is called in the scope of the {@link Data.Model Model} that owns the attribute. 
	 * This can be used to set other attributes of a "computed" attribute. Ex:
	 * 
	 *     {
	 *         // A "computed" attribute which combines the 'firstName' and 'lastName' attributes in this model (assuming they are there)
	 *         name : 'fullName',
	 *         
	 *         set : function( newValue, oldValue ) {
	 *             // A setter which takes the first and last name given (such as "Gregory Jacobs"), and splits them up into 
	 *             // their appropriate parts, to set the appropriate attributes for the computed attribute
	 *             var names = newValue.split( ' ' );  // split on the space between first and last name
	 *             
	 *             // Note: `this` refers to the model which is setting the value, so we can call the set() method
	 *             this.set( 'firstName', names[ 0 ] );
	 *             this.set( 'lastName', names[ 1 ] );
	 *         },
	 * 
	 *         get : function( value ) {
	 *             return this.get( 'firstName' ) + " " + this.get( 'lastName' );  // Combine firstName and lastName for the computed attribute. `this` refers to the model
	 *         }
	 *     }
	 * 
	 * The function is run in the context (the `this` reference) of the {@link Data.Model Model} instance that owns the attribute, in the that case 
	 * that other Attributes need to be queried, or need to be {@link Data.Model#set set} by the `set` function. However, in the case of querying 
	 * other Attributes for their value, be careful in that they may not be set to the expected value when the `set` function executes. For creating 
	 * computed Attributes that rely on other Attributes' values, use a {@link #get} function instead.
	 * 
	 * Notes:
	 * 
	 * - Both a `set` and a {@link #get} function can be used in conjunction.
	 * - The `set` function is called upon instantiation of the {@link Data.Model Model} if the Model is passed an initial value
	 *   for the Attribute, or if the Attribute has a {@link #defaultValue}.
	 * 
	 * 
	 * When using {@link #type typed} Attributes, providing a `set` function overrides the Attribute's {@link #method-set set} method, which
	 * does the automatic conversion that the Attribute subclass advertises. If you would like to still use the original {@link #method-set set}
	 * method in conjunction with pre-processing and/or post-processing the value, you can call the original {@link #method-set set} method as
	 * such:
	 * 
	 *     {
	 *         // Some integer value attribute, which may need to convert string values (such as "123") to an actual integer 
	 *         // (done behind the scenes via `parseInt()`)
	 *         name : 'myValue',
	 *         type : 'int',
	 *         
	 *         set : function( newValue, oldValue ) {
	 *             // Pre-process the raw newValue here, if desired
	 *             
	 *             // Call the original `set` method, which does the conversion to an integer if need be
	 *             newValue = this._super( arguments );
	 *             
	 *             // Post-process the converted newValue here, if desired
	 *             
	 *             // And finally, return the value that should be stored for the attribute
	 *             return newValue;
	 *         }
	 *     }
	 */
	
	/**
	 * @cfg {Function} get
	 * A function that can be used to change the value that is returned when the Model's {@link Data.Model#get get} method is called
	 * on the Attribute. This is useful to create "computed" attributes, which may be created based on other Attributes' values.  The function is 
	 * passed the argument of the underlying stored value, and should return the computed value.
	 * 
	 * @cfg {Mixed} get.value The value that the Attribute currently has stored in the {@link Data.Model Model}.
	 * 
	 * For example, if we had a {@link Data.Model Model} with `firstName` and `lastName` Attributes, and we wanted to create a `fullName` 
	 * Attribute, this could be done as in the example below. Note that just as with {@link #cfg-set}, the `get` function is called in the 
	 * scope of the {@link Data.Model Model} that owns the attribute. 
	 * 
	 *     {
	 *         name : 'fullName',
	 *         get : function( value ) {  // in this example, the Attribute has no value of its own, so we ignore the arg
	 *             return this.get( 'firstName' ) + " " + this.get( 'lastName' );   // `this` refers to the model that owns the Attribute
	 *         }
	 *     }
	 * 
	 * Note: if the intention is to convert a provided value which needs to be stored on the {@link Data.Model Model} in a different way,
	 * use a {@link #cfg-set} function instead. 
	 * 
	 * However, also note that both a {@link #cfg-set} and a `get` function can be used in conjunction.
	 */
	
	/**
	 * @cfg {Function} raw
	 * A function that can be used to convert an Attribute's value to a raw representation, usually for persisting data on a server.
	 * This function is automatically called (if it exists) when a persistence {@link Data.persistence.Proxy proxy} is collecting
	 * the data to send to the server. The function is passed two arguments, and should return the raw value.
	 * 
	 * @cfg {Mixed} raw.value The underlying value that the Attribute currently has stored in the {@link Data.Model Model}.
	 * @cfg {Data.Model} raw.model The Model instance that this Attribute belongs to.
	 * 
	 * For example, a Date object is normally converted to JSON with both its date and time components in a serialized string (such
	 * as "2012-01-26T01:20:54.619Z"). To instead persist the Date in m/d/yyyy format, one could create an Attribute such as this:
	 * 
	 *     {
	 *         name : 'eventDate',
	 *         set : function( value, model ) { return new Date( value ); },  // so the value is stored as a Date object when used client-side
	 *         raw : function( value, model ) {
	 *             return (value.getMonth()+1) + '/' + value.getDate() + '/' + value.getFullYear();  // m/d/yyyy format 
	 *         }
	 *     }
	 * 
	 * The value that this function returns is the value that is used when the Model's {@link Data.Model#raw raw} method is called
	 * on the Attribute.
	 */
	
	/**
	 * @cfg {Boolean} persist
	 * True if the attribute should be persisted by its {@link Data.Model Model} using the Model's {@link Data.Model#persistenceProxy persistenceProxy}.
	 * Set to false to prevent the attribute from being persisted.
	 */
	persist : true,
	
	
	
	
	statics : {
		/**
		 * An object (hashmap) which stores the registered Attribute types. It maps type names to Attribute subclasses.
		 * 
		 * @private
		 * @static
		 * @property {Object} attributeTypes
		 */
		attributeTypes : {},
		
		
		/**
		 * Static method to instantiate the appropriate Attribute subclass based on a configuration object, based on its `type` property.
		 * 
		 * @static
		 * @method create
		 * @param {Object} config The configuration object for the Attribute. Config objects should have the property `type`, 
		 *   which determines which type of Attribute will be instantiated. If the object does not have a `type` property, it will default 
		 *   to `mixed`, which accepts any data type, but does not provide any type checking / data consistency. Note that already-instantiated 
		 *   Attributes will simply be returned unchanged. 
		 * @return {Data.attribute.Attribute} The instantiated Attribute.
		 */
		create : function( config ) {
			var type = config.type ? config.type.toLowerCase() : undefined;
		
			if( config instanceof Data.attribute.Attribute ) {
				// Already an Attribute instance, return it
				return config;
				
			} else if( this.hasType( type || "mixed" ) ) {
				return new this.attributeTypes[ type || "mixed" ]( config );
				
			} else {
				// No registered type with the given config's `type`, throw an error
				throw new Error( "Data.attribute.Attribute: Unknown Attribute type: '" + type + "'" );
			}
		},
		
		
		/**
		 * Static method used to register implementation Attribute subclass types. When creating an Attribute subclass, it 
		 * should be registered with the Attribute superclass (this class), so that it can be instantiated by a string `type` 
		 * name in an anonymous configuration object. Note that type names are case-insensitive.
		 * 
		 * This method will throw an error if a type name is already registered, to assist in making sure that we don't get
		 * unexpected behavior from a type name being overwritten.
		 * 
		 * @static
		 * @method registerType
		 * @param {String} typeName The type name of the registered class. Note that this is case-insensitive.
		 * @param {Function} jsClass The Attribute subclass (constructor function) to register.
		 */
		registerType : function( type, jsClass ) {
			type = type.toLowerCase();
			
			if( !this.attributeTypes[ type ] ) { 
				this.attributeTypes[ type ] = jsClass;
			} else {
				throw new Error( "Error: Attribute type '" + type + "' already exists" );
			}
		},
		
		
		/**
		 * Retrieves the Component class (constructor function) that has been registered by the supplied `type` name. 
		 * 
		 * @method getType
		 * @param {String} type The type name of the registered class.
		 * @return {Function} The class (constructor function) that has been registered under the given type name.
		 */
		getType : function( type ) {
			return this.attributeTypes[ type.toLowerCase() ];
		},
		
		
		/**
		 * Determines if there is a registered Attribute type with the given `typeName`.
		 * 
		 * @method hasType
		 * @param {String} typeName
		 * @return {Boolean}
		 */
		hasType : function( typeName ) {
			if( !typeName ) {  // any falsy type value given, return false
				return false;
			} else {
				return !!this.attributeTypes[ typeName.toLowerCase() ];
			}
		}
	},
	
	
	// End Statics
	
	// -------------------------------
	
	
	
	/**
	 * Creates a new Attribute instance. Note: You will normally not be using this constructor function, as this class
	 * is only used internally by {@link Data.Model}.
	 * 
	 * @constructor 
	 * @param {Object/String} config An object (hashmap) of the Attribute object's configuration options, which is its definition. 
	 *   Can also be its Attribute {@link #name} provided directly as a string.
	 */
	constructor : function( config ) {
		var me = this;
		
		// If the argument wasn't an object, it must be its attribute name
		if( typeof config !== 'object' ) {
			config = { name: config };
		}
		
		// Copy members of the attribute definition (config) provided onto this object
		_.assign( me, config );
		
		
		// Each Attribute must have a name.
		var name = me.name;
		if( name === undefined || name === null || name === "" ) {
			throw new Error( "no 'name' property provided to Data.attribute.Attribute constructor" );
			
		} else if( typeof me.name === 'number' ) {  // convert to a string if it is a number
			me.name = name.toString();
		}
		
		
		// Normalize defaultValue
		if( me[ 'default' ] ) {  // accept the key as simply 'default'
			me.defaultValue = me[ 'default' ];
		}
	},
	
	
	/**
	 * Retrieves the name for the Attribute.
	 * 
	 * @method getName
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Retrieves the default value for the Attribute. 
	 * 
	 * @method getDefaultValue
	 * @return {Mixed}
	 */
	getDefaultValue : function() {
		var defaultValue = this.defaultValue;
		
		if( typeof defaultValue === "function" ) {
			defaultValue = defaultValue( this );
		}
		
		// If defaultValue is an object, clone it, to not edit the original object structure
		if( typeof defaultValue === 'object' ) {
			defaultValue = _.cloneDeep( defaultValue );
		}
		
		return defaultValue;
	},
	
	
	
	/**
	 * Determines if the Attribute should be persisted.
	 * 
	 * @method isPersisted
	 * @return {Boolean}
	 */
	isPersisted : function() {
		return this.persist;
	},
	
	
	/**
	 * Determines if the Attribute has a user-defined setter (i.e. the {@link #cfg-set set} config was provided).
	 * 
	 * @method hasUserDefinedSetter
	 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-set set} function. 
	 */
	hasUserDefinedSetter : function() {
		return this.hasOwnProperty( 'set' );
	},
	
	
	/**
	 * Determines if the Attribute has a user-defined getter (i.e. the {@link #cfg-get get} config was provided).
	 * 
	 * @method hasUserDefinedGetter
	 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-get get} function. 
	 */
	hasUserDefinedGetter : function() {
		return this.hasOwnProperty( 'get' );
	},
	
	
	// ---------------------------
	
	
	/**
	 * Allows the Attribute to determine if two values of its data type are equal, and the model
	 * should consider itself as "changed". This method is passed the "old" value and the "new" value
	 * when a value is {@link Data.Model#set set} to the Model, and if this method returns `false`, the
	 * new value is taken as a "change".
	 * 
	 * This may be overridden by subclasses to provide custom comparisons, but the default implementation is
	 * to directly compare primitives, and deep compare arrays and objects.
	 * 
	 * @method valuesAreEqual
	 * @param {Mixed} oldValue
	 * @param {Mixed} newValue
	 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
	 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
	 */
	valuesAreEqual : function( oldValue, newValue ) {
		return _.isEqual( oldValue, newValue );
	},
	
	
	// ---------------------------
	
	
	/**
	 * Method that allows pre-processing for the value that is to be set to a {@link Data.Model}.
	 * After this method has processed the value, it is provided to the {@link #cfg-set} function (if
	 * one exists) or the {@link #method-set set} method, and then finally, the return value from 
	 * {@link #cfg-set set} will be provided to {@link #afterSet}, and then set as the data on the 
	 * {@link Data.Model Model}.
	 * 
	 * Note that the default implementation simply returns the raw value unchanged, but this may be overridden
	 * in subclasses to provide a conversion.
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Mixed} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		return newValue;
	},
	
	
	/**
	 * Indirection method that is called by a {@link Data.Model} when the {@link #method-set} method is to be called. This method provides
	 * a wrapping function that allows for `this._super( arguments )` to be called when a {@link #cfg-set} config is provided, to call the 
	 * original conversion method from a {@link #cfg-set} config function.
	 * 
	 * Basically, it allows:
	 *     var MyModel = Data.Model.extend( {
	 *         attributes: [
	 *             {
	 *                 name: 'myAttr',
	 *                 type: 'int',
	 *                 set: function( newValue, oldValue ) {
	 *                     // Preprocess the new value (if desired)
	 *                     
	 *                     newValue = this._super( [ newValue, oldValue ] );  // run original conversion provided by 'int' attribute
	 *                     
	 *                     // post process the new value (if desired)
	 *                 }
	 *             }
	 *         ]
	 *     } );
	 * 
	 * @method doSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method, after it has been processed
	 *   by the {@link #beforeSet} method..
	 * @param {Mixed} oldValue The old (previous) value that the model held.
	 */
	doSet : function( model, newValue, oldValue ) {
		if( this.hasOwnProperty( 'set' ) ) {  // a 'set' config was provided
			// Call the provided 'set' function in the scope of the model
			return this.set.call( model, newValue, oldValue );
			
		} else {
			// No 'set' config provided, just call the set() method on the prototype
			return this.set( model, newValue, oldValue );
		}
	},
	
	
	
	/**
	 * Method that allows processing of the value that is to be set to a {@link Data.Model}. This method is executed after
	 * the {@link #beforeSet} method, and before the {@link #afterSet} method, and can be overridden by the {@link #cfg-set set}
	 * config. 
	 * 
	 * @method set
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method, after it has been processed
	 *   by the {@link #beforeSet} method..
	 * @param {Mixed} oldValue The old (previous) value that the model held.
	 */
	set : function( model, newValue, oldValue ) {
		return newValue;
	},
	
	
	/**
	 * Method that allows post-processing for the value that is to be set to a {@link Data.Model}.
	 * This method is executed after the {@link #beforeSet} method, and the {@link #cfg-set} function (if one is provided), and is given 
	 * the value that the {@link #cfg-set} function returns. If no {@link #cfg-set} function exists, this will simply be executed 
	 * immediately after {@link #beforeSet}, after which the return from this method will be set as the data on the {@link Data.Model Model}.
	 * 
	 * Note that the default implementation simply returns the value unchanged, but this may be overridden
	 * in subclasses to provide a conversion.
	 * 
	 * @method afterSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} value The value provided to the {@link Data.Model#set} method, after it has been processed by the
	 *   {@link #beforeSet} method, and any provided {@link #cfg-set} function.
	 * @return {Mixed} The converted value.
	 */
	afterSet : function( model, value ) {
		return value;
	}
	
} );

/**
 * @abstract
 * @class Data.attribute.Primitive
 * @extends Data.attribute.Attribute
 * 
 * Base Attribute definition class for an Attribute that holds a JavaScript primitive value 
 * (i.e. A Boolean, Number, or String).
 */
/*global Data */
Data.attribute.Primitive = Data.attribute.Attribute.extend( {
	
	abstractClass: true,
	
	/**
	 * @cfg {Boolean} useNull
	 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
	 * Attribute is "unset", and it shouldn't take an actual default value).
	 * 
	 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
	 * cannot be "easily" parsed into a valid representation of its primitive type, `null` will be used 
	 * instead of converting to the primitive type's default.
	 */
	useNull : false
	
} );

/**
 * @abstract
 * @class Data.attribute.Number
 * @extends Data.attribute.Primitive
 * 
 * Abstract base class for an Attribute that takes a number data value.
 */
/*global Data */
Data.attribute.Number = Data.attribute.Primitive.extend( {
	
	abstractClass: true,
	
	/**
	 * @cfg {Mixed/Function} defaultValue
	 * @inheritdoc
	 * 
	 * The Number Attribute defaults to 0, unless the {@link #useNull} config is 
	 * set to `true`, in which case it defaults to `null` (to denote the Attribute being "unset").
	 */
	defaultValue: function( attribute ) {
		return attribute.useNull ? null : 0;
	},
	
	
	/**
	 * @cfg {Boolean} useNull
	 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
	 * Attribute is "unset", and it shouldn't take an actual default value).
	 * 
	 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
	 * cannot be "easily" parsed into an integer (i.e. if it's undefined, null, or empty string), `null` will be used 
	 * instead of converting to 0.
	 */
	
	
	/**
	 * @protected
	 * @property {RegExp} stripCharsRegex 
	 * 
	 * A regular expression for stripping non-numeric characters from a numeric value. Defaults to `/[\$,%]/g`.
	 * This should be overridden for localization. A way to do this globally is, for example:
	 * 
	 *     Data.attribute.Number.prototype.stripCharsRegex = /newRegexHere/g;
	 */
	stripCharsRegex : /[\$,%]/g
	
} );

/**
 * @class Data.attribute.Object
 * @extends Data.attribute.Attribute
 * 
 * Attribute definition class for an Attribute that takes an object value.
 */
/*global Data */
Data.attribute.Object = Data.attribute.Attribute.extend( {
	
	/**
	 * @cfg {Object} defaultValue
	 * @inheritdoc
	 */
	defaultValue : null,
	
	
	/**
	 * Overridden `beforeSet` method used to normalize the value provided. All non-object values are converted to null,
	 * while object values are returned unchanged.
	 * 
	 * @override
	 * @method beforeSet
	 * @inheritdoc
	 */
	beforeSet : function( model, newValue, oldValue ) {
		if( typeof newValue !== 'object' ) {
			newValue = null;  // convert all non-object values to null
		}
		
		return newValue;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'object', Data.attribute.Object );

/**
 * @abstract
 * @class Data.attribute.DataComponent
 * @extends Data.attribute.Object
 * 
 * Attribute definition class for an Attribute that allows for a nested {@link Data.DataComponent} value.
 */
/*global window, Data */
Data.attribute.DataComponent = Data.attribute.Object.extend( {
	
	abstractClass: true,
	
	
	/**
	 * @cfg {Boolean} embedded
	 * Setting this config to true has the parent {@link Data.Model Model} treat the child {@link Data.DataComponent DataComponent} as if it is a part of itself. 
	 * Normally, a child DataComponent that is not embedded is treated as a "relation", where it is considered as independent from the parent Model.
	 * 
	 * What this means is that, when true:
	 * 
	 * - The parent Model is considered as "changed" when there is a change in the child DataComponent is changed. This Attribute 
	 *   (the attribute that holds the child DataComponent) is the "change".
	 * - The parent Model's {@link Data.Model#change change} event is fired when an attribute on the child DataComponent (Model or Collection) has changed.
	 * - The child DataComponent's data is persisted with the parent Model's data, unless the {@link #persistIdOnly} config is set to true,
	 *   in which case just the child DataComponent's {@link Data.Model#idAttribute id} is persisted with the parent Model. In the case of a {@link Data.Collection},
	 *   the ID's of the models are only persisted if {@link #persistIdOnly} is true.
	 */
	embedded : false,
	
	/**
	 * @cfg {Boolean} persistIdOnly
	 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link Data.Model#idAttribute id} of the embedded 
	 * model(s) be persisted, rather than all of the Model/Collection data. Normally, when {@link #embedded} is false (the default), the child 
	 * {@link Data.DataComponent DataComponent} is treated as a relation, and only its {@link Data.Model#idAttribute ids} is/are persisted.
	 */
	persistIdOnly : false,
	
	
	// -------------------------------
	
	
	/**
	 * Determines if the Attribute is an {@link #embedded} Attribute.
	 * 
	 * @method isEmbedded
	 * @return {Boolean}
	 */
	isEmbedded : function() {
		return this.embedded;
	},
	
	
	
	/**
	 * Utility method to resolve a string path to an object from the global scope to the
	 * actual object.
	 * 
	 * @protected
	 * @method resolveGlobalPath
	 * @param {String} path A string in the form "a.b.c" which will be resolved to the actual `a.b.c` object
	 *   from the global scope (`window`).
	 * @return {Mixed} The value at the given path under the global scope. Returns undefined if the value at the
	 *   path was not found (or this method errors if an intermediate path is not found).
	 */
	resolveGlobalPath : function( path ) {
		var paths = path.split( '.' );
		
		// Loop through the namespaces down to the end of the path, and return the value.
		var value;
		for( var i = 0, len = paths.length; i < len; i++ ) {
			value = ( value || window )[ paths[ i ] ];
		}
		return value;
	}
	
} );

/**
 * @class Data.attribute.Boolean
 * @extends Data.attribute.Primitive
 * 
 * Attribute definition class for an Attribute that takes a boolean (i.e. true/false) data value.
 */
/*global Data */
Data.attribute.Boolean = Data.attribute.Primitive.extend( {
	
	/**
	 * @cfg {Mixed/Function} defaultValue
	 * @inheritdoc
	 * 
	 * The Boolean Attribute defaults to `false`, unless the {@link #useNull} config is set to `true`, 
	 * in which case it defaults to `null` (to denote the Attribute being "unset").
	 */
	defaultValue: function( attribute ) {
		return attribute.useNull ? null : false;
	},
	
	
	/**
	 * @cfg {Boolean} useNull
	 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
	 * Attribute is "unset", and it shouldn't take an actual default value).
	 * 
	 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
	 * cannot be "easily" parsed into a Boolean (i.e. if it's undefined, null, or an empty string), 
	 * `null` will be used instead of converting to `false`.
	 */
	
	
	/**
	 * Converts the provided data value into a Boolean. If {@link #useNull} is true, "unparsable" values
	 * will return null. 
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Boolean} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		if( this.useNull && ( newValue === undefined || newValue === null || newValue === '' ) ) {
			return null;
		}
		return newValue === true || newValue === 'true' || newValue === 1 || newValue === "1";
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'boolean', Data.attribute.Boolean );
Data.attribute.Attribute.registerType( 'bool', Data.attribute.Boolean );

/**
 * @class Data.attribute.Collection
 * @extends Data.attribute.DataComponent
 * 
 * Attribute definition class for an Attribute that allows for a nested {@link Data.Collection} value.
 * 
 * This class enforces that the Attribute hold a {@link Data.Collection Collection} value, or null. However, it will
 * automatically convert an array of {@link Data.Model models} or anonymous data objects into the appropriate 
 * {@link Data.Collection Collection} subclass, using the Collection provided to the {@link #collectionClass} config.
 * Anonymous data objects in this array will be converted to the model type provided to the collection's 
 * {@link Data.Collection#model}. 
 * 
 * Otherwise, you must either provide a {@link Data.Collection} subclass as the value, or use a custom {@link #cfg-set} 
 * function to convert any anonymous array to a Collection in the appropriate way. 
 */
/*global window, Class, Data */
Data.attribute.Collection = Data.attribute.DataComponent.extend( {
		
	/**
	 * @cfg {Array/Data.Collection} defaultValue
	 * @inheritdoc
	 * 
	 * Defaults to an empty array, to create an empty Collection of the given {@link #collectionClass} type.
	 */
	//defaultValue : [],  -- Not yet fully implemented on a general level. Can use this in code though.
	
	/**
	 * @cfg {Data.Collection/String/Function} collectionClass (required)
	 * The specific {@link Data.Collection} subclass that will be used in the Collection Attribute. This config is needed
	 * to perform automatic conversion of an array of models / anonymous data objects into the approperiate Collection subclass.
	 * 
	 * This config may be provided as:
	 * 
	 * - A direct reference to a Collection (ex: `myApp.collections.MyCollection`),
	 * - A String which specifies the object path to the Collection (which must be able to be referenced from the global scope, 
	 *   ex: 'myApp.collections.MyCollection'),
	 * - Or a function, which will return a reference to the Collection that should be used. 
	 * 
	 * The reason that this config may be specified as a String or a Function is to allow for late binding to the Collection class 
	 * that is used, where the Collection class that is to be used does not have to exist in the source code until a value is 
	 * actually set to the Attribute. This allows for the handling of circular dependencies as well.
	 */
	
	/**
	 * @cfg {Boolean} embedded
	 * Setting this config to true has the parent {@link Data.Model Model} treat the child {@link Data.Collection Collection} as if it is 
	 * a part of itself. Normally, a child Collection that is not embedded is treated as a "relation", where it is considered as independent 
	 * from the parent Model.
	 * 
	 * What this means is that, when true:
	 * 
	 * - The parent Model is considered as "changed" when a model in the child Collection is changed, or one has been added/removed. This Attribute 
	 *   (the attribute that holds the child collection) is the "change".
	 * - The parent Model's {@link Data.Model#change change} event is fired when a model on the child Collection has changed, or one has 
	 *   been added/removed.
	 * - The child Collection's model data is persisted with the parent Collection's data, unless the {@link #persistIdOnly} config is set to true,
	 *   in which case just the child Collection's models' {@link Data.Model#idAttribute ids} are persisted with the parent Model.
	 */
	embedded : false,
	
	/**
	 * @cfg {Boolean} persistIdOnly
	 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link Data.Model#idAttribute id} of the embedded 
	 * collection's models be persisted, rather than all of the collection's model data. Normally, when {@link #embedded} is false (the default), 
	 * the child {@link Data.Collection Collection} is treated as a relation, and only its model's {@link Data.Model#idAttribute ids} are persisted.
	 */
	persistIdOnly : false,
	
	
	// -------------------------------
	
	
	constructor : function() {
		this._super( arguments );
		
		// Check if the user did not provide a collectionClass, or the value is undefined (which means that they specified
		// a class that either doesn't exist, or doesn't exist yet, and we should give them an error to alert them).
		// <debug>
		if( 'collectionClass' in this && this.collectionClass === undefined ) {
			throw new Error( "The 'collectionClass' config provided to an Attribute with the name '" + this.getName() + "' either doesn't exist, or doesn't " +
			                 "exist just yet. Consider using the String or Function form of the collectionClass config for late binding, if needed" );
		}
		// </debug>
	},
	
	
	/**
	 * Overridden method used to determine if two collections are equal.
	 * @inheritdoc
	 * 
	 * @override
	 * @method valuesAreEqual
	 * @param {Mixed} oldValue
	 * @param {Mixed} newValue
	 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
	 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
	 */
	valuesAreEqual : function( oldValue, newValue ) {
		// If the references are the same, they are equal. Many collections can be made to hold the same models.
		return oldValue === newValue;
	},
	
	
	/**
	 * Overridden `beforeSet` method used to convert any arrays into the specified {@link #collectionClass}. The array
	 * will be provided to the {@link #collectionClass collectionClass's} constructor.
	 * 
	 * @override
	 * @method beforeSet
	 * @inheritdoc
	 */
	beforeSet : function( model, newValue, oldValue ) {
		// Now, normalize the newValue to an object, or null
		newValue = this._super( arguments );
		
		if( newValue !== null ) {
			var collectionClass = this.collectionClass;
			
			// Normalize the collectionClass
			if( typeof collectionClass === 'string' ) {
				collectionClass = this.resolveGlobalPath( collectionClass );  // changes the string "a.b.c" into the value at `window.a.b.c`
				
				if( !collectionClass ) {
					throw new Error( "The string value 'collectionClass' config did not resolve to a Collection class for attribute '" + this.getName() + "'" );
				}
			} else if( typeof collectionClass === 'function' && !Class.isSubclassOf( collectionClass, Data.Collection ) ) {  // it's not a Data.Collection subclass, so it must be an anonymous function. Run it, so it returns the Collection reference we need
				this.collectionClass = collectionClass = collectionClass();
				if( !collectionClass ) {
					throw new Error( "The function value 'collectionClass' config did not resolve to a Collection class for attribute '" + this.getName() + "'" );
				}
			}
			
			if( newValue && typeof collectionClass === 'function' && !( newValue instanceof collectionClass ) ) {
				newValue = new collectionClass( newValue );
			}
		}
		
		return newValue;
	},
	
	
	/**
	 * Overridden `afterSet` method used to subscribe to add/remove/change events on a set child {@link Data.Collection Collection}.
	 * 
	 * @override
	 * @method afterSet
	 * @inheritdoc
	 */
	afterSet : function( model, value ) {
		// Enforce that the value is either null, or a Data.Collection
		if( value !== null && !( value instanceof Data.Collection ) ) {
			throw new Error( "A value set to the attribute '" + this.getName() + "' was not a Data.Collection subclass" );
		}
		
		return value;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'collection', Data.attribute.Collection );

/**
 * @class Data.attribute.Date
 * @extends Data.attribute.Object
 * 
 * Attribute definition class for an Attribute that takes a JavaScript Date object.
 */
/*global _, Data */
Data.attribute.Date = Data.attribute.Object.extend( {
		
	/**
	 * Converts the provided data value into a Date object. If the value provided is not a Date, or cannot be parsed
	 * into a Date, will return null.
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Boolean} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		if( !newValue ) {
			return null;
		}
		if( _.isDate( newValue ) ) {
			return newValue;
		}
		
		var parsed = Date.parse( newValue );
		return ( parsed ) ? new Date( parsed ) : null;
	}
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'date', Data.attribute.Date );

/**
 * @class Data.attribute.Float
 * @extends Data.attribute.Number
 * 
 * Attribute definition class for an Attribute that takes a float (i.e. decimal, or "real") number data value.
 */
/*global Data */
Data.attribute.Float = Data.attribute.Number.extend( {
	
	/**
	 * Converts the provided data value into a float. If {@link #useNull} is true, undefined/null/empty string 
	 * values will return null, or else will otherwise be converted to 0. If the number is simply not parsable, will 
	 * return NaN.
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Boolean} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		var defaultValue = ( this.useNull ) ? null : 0;
		return ( newValue !== undefined && newValue !== null && newValue !== '' ) ? parseFloat( String( newValue ).replace( this.stripCharsRegex, '' ), 10 ) : defaultValue;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'float', Data.attribute.Float );
Data.attribute.Attribute.registerType( 'number', Data.attribute.Float );

/**
 * @class Data.attribute.Integer
 * @extends Data.attribute.Number
 * 
 * Attribute definition class for an Attribute that takes an integer data value. If a decimal
 * number is provided (i.e. a "float"), the decimal will be ignored, and only the integer value used.
 */
/*global Data */
Data.attribute.Integer = Data.attribute.Number.extend( {
	
	/**
	 * Converts the provided data value into an integer. If {@link #useNull} is true, undefined/null/empty string 
	 * values will return null, or else will otherwise be converted to 0. If the number is simply not parsable, will 
	 * return NaN. 
	 * 
	 * This method will strip off any decimal value from a provided number.
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Boolean} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		var defaultValue = ( this.useNull ) ? null : 0;
		return ( newValue !== undefined && newValue !== null && newValue !== '' ) ? parseInt( String( newValue ).replace( this.stripCharsRegex, '' ), 10 ) : defaultValue;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'int', Data.attribute.Integer );
Data.attribute.Attribute.registerType( 'integer', Data.attribute.Integer );

/**
 * @class Data.attribute.Mixed
 * @extends Data.attribute.Attribute
 * 
 * Attribute definition class for an Attribute that takes any data value.
 */
/*global Data */
Data.attribute.Mixed = Data.attribute.Attribute.extend( {
		
	// No specific implementation at this time. All handled by the base class Attribute.
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'mixed', Data.attribute.Mixed );

/**
 * @class Data.attribute.Model
 * @extends Data.attribute.DataComponent
 * 
 * Attribute definition class for an Attribute that allows for a nested {@link Data.Model} value.
 * 
 * This class enforces that the Attribute hold a {@link Data.Model Model} value, or null. However, it will
 * automatically convert an anonymous data object into the appropriate {@link Data.Model Model} subclass, using
 * the Model provided to the {@link #modelClass} config. 
 * 
 * Otherwise, you must either provide a {@link Data.Model} subclass as the value, or use a custom {@link #cfg-set} 
 * function to convert any anonymous object to a Model in the appropriate way. 
 */
/*global window, Class, Data */
Data.attribute.Model = Data.attribute.DataComponent.extend( {
	
	/**
	 * @cfg {Data.Model/String/Function} modelClass
	 * The specific {@link Data.Model} subclass that will be used in the Model. This config can be provided
	 * to perform automatic conversion of anonymous data objects into the approperiate Model subclass.
	 * 
	 * This config may be provided as:
	 * 
	 * - A direct reference to a Model (ex: `myApp.models.MyModel`),
	 * - A String which specifies the object path to the Model (which must be able to be referenced from the global scope, 
	 *   ex: 'myApp.models.MyModel'), 
	 * - Or a function, which will return a reference to the Model that should be used. 
	 * 
	 * The reason that this config may be specified as a String or a Function is to allow for late binding to the Model class 
	 * that is used, where the Model class that is to be used does not have to exist in the source code until a value is 
	 * actually set to the Attribute. This allows for the handling of circular dependencies as well.
	 */
	
	/**
	 * @cfg {Boolean} embedded
	 * Setting this config to true has the parent {@link Data.Model Model} treat the child {@link Data.Model Model} as if it is a part of itself. 
	 * Normally, a child Model that is not embedded is treated as a "relation", where it is considered as independent from the parent Model.
	 * 
	 * What this means is that, when true:
	 * 
	 * - The parent Model is considered as "changed" when an attribute in the child Model is changed. This Attribute (the attribute that holds the child
	 *   model) is the "change".
	 * - The parent Model's {@link Data.Model#change change} event is fired when an attribute on the child Model has changed.
	 * - The child Model's data is persisted with the parent Model's data, unless the {@link #persistIdOnly} config is set to true,
	 *   in which case just the child Model's {@link Data.Model#idAttribute id} is persisted with the parent Model.
	 */
	embedded : false,
	
	/**
	 * @cfg {Boolean} persistIdOnly
	 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link Data.Model#idAttribute id} of the embedded 
	 * model be persisted, rather than all of the Model data. Normally, when {@link #embedded} is false (the default), the child {@link Data.Model Model}
	 * is treated as a relation, and only its {@link Data.Model#idAttribute id} is persisted.
	 */
	persistIdOnly : false,
	
	
	// -------------------------------
	
	
	constructor : function() {
		this._super( arguments );
		
		// Check if the user provided a modelClass, but the value is undefined. This means that they specified
		// a class that either doesn't exist, or doesn't exist yet, and we should give them a warning.
		if( 'modelClass' in this && this.modelClass === undefined ) {
			throw new Error( "The 'modelClass' config provided to an Attribute with the name '" + this.getName() + "' either doesn't exist, or doesn't " +
			                 "exist just yet. Consider using the String or Function form of the modelClass config for late binding, if needed" );
		}
	},
	
	
	/**
	 * Overridden method used to determine if two models are equal.
	 * @inheritdoc
	 * 
	 * @override
	 * @method valuesAreEqual
	 * @param {Mixed} oldValue
	 * @param {Mixed} newValue
	 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
	 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
	 */
	valuesAreEqual : function( oldValue, newValue ) {
		// We can't instantiate two different Models with the same id that have different references, so if the references are the same, they are equal
		return oldValue === newValue;
	},
	
	
	/**
	 * Overridden `beforeSet` method used to convert any anonymous objects into the specified {@link #modelClass}. The anonymous object
	 * will be provided to the {@link #modelClass modelClass's} constructor.
	 * 
	 * @override
	 * @method beforeSet
	 * @inheritdoc
	 */
	beforeSet : function( model, newValue, oldValue ) {
		// Now, normalize the newValue to an object, or null
		newValue = this._super( arguments );
		
		if( newValue !== null ) {
			var modelClass = this.modelClass;
			
			// Normalize the modelClass
			if( typeof modelClass === 'string' ) {
				modelClass = this.resolveGlobalPath( modelClass );  // changes the string "a.b.c" into the value at `window.a.b.c`
				
				if( !modelClass ) {
					throw new Error( "The string value 'modelClass' config did not resolve to a Model class for attribute '" + this.getName() + "'" );
				}
			} else if( typeof modelClass === 'function' && !Class.isSubclassOf( modelClass, Data.Model ) ) {  // it's not a Data.Model subclass, so it must be an anonymous function. Run it, so it returns the Model reference we need
				this.modelClass = modelClass = modelClass();
				if( !modelClass ) {
					throw new Error( "The function value 'modelClass' config did not resolve to a Model class for attribute '" + this.getName() + "'" );
				}
			}
			
			if( newValue && typeof modelClass === 'function' && !( newValue instanceof modelClass ) ) {
				newValue = new modelClass( newValue );
			}
		}
		
		return newValue;
	},
	
	
	/**
	 * Overridden `afterSet` method used to subscribe to change events on a set child {@link Data.Model Model}.
	 * 
	 * @override
	 * @method afterSet
	 * @inheritdoc
	 */
	afterSet : function( model, value ) {
		// Enforce that the value is either null, or a Data.Model
		if( value !== null && !( value instanceof Data.Model ) ) {
			throw new Error( "A value set to the attribute '" + this.getName() + "' was not a Data.Model subclass" );
		}
		
		return value;
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'model', Data.attribute.Model );

/**
 * @class Data.attribute.String
 * @extends Data.attribute.Primitive
 * 
 * Attribute definition class for an Attribute that takes a string data value.
 */
/*global Data */
Data.attribute.String = Data.attribute.Primitive.extend( {
	
	/**
	 * @cfg {Mixed/Function} defaultValue
	 * @inheritdoc
	 * 
	 * The String Attribute defaults to `""` (empty string), unless the {@link #useNull} config is 
	 * set to `true`, in which case it defaults to `null` (to denote the Attribute being "unset").
	 */
	defaultValue: function( attribute ) {
		return attribute.useNull ? null : "";
	},
	
	
	/**
	 * @cfg {Boolean} useNull
	 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
	 * Attribute is "unset", and it shouldn't take an actual default value).
	 * 
	 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
	 * cannot be "easily" parsed into a String (i.e. if it's undefined, or null), `null` will be used 
	 * instead of converting to an empty string.
	 */
	
	
	/**
	 * Converts the provided data value into a Boolean. If {@link #useNull} is true, "unparsable" values
	 * will return null. 
	 * 
	 * @method beforeSet
	 * @param {Data.Model} model The Model instance that is providing the value. This is normally not used,
	 *   but is provided in case any model processing is needed.
	 * @param {Mixed} newValue The new value provided to the {@link Data.Model#set} method.
	 * @param {Mixed} oldValue The old (previous) value that the model held (if any).
	 * @return {Boolean} The converted value.
	 */
	beforeSet : function( model, newValue, oldValue ) {
		var defaultValue = ( this.useNull ) ? null : "";
		return ( newValue === undefined || newValue === null ) ? defaultValue : String( newValue );
	}
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'string', Data.attribute.String );

/**
 * @private
 * @class Data.data.NativeObjectConverter
 * @singleton
 * 
 * NativeObjectConverter allows for the conversion of {@link Data.Collection Collection} / {@link Data.Model Models}
 * to their native Array / Object representations, while dealing with circular dependencies.
 */
/*global _, Data */
Data.data.NativeObjectConverter = {
	
	/**
	 * Converts a {@link Data.Collection Collection} or {@link Data.Model} to its native Array/Object representation,
	 * while dealing with circular dependencies.
	 * 
	 * @method convert
	 * 
	 * @param {Data.Collection/Data.Model} A Collection or Model to convert to its native Array/Object representation.
	 * @param {Object} [options] An object (hashmap) of options to change the behavior of this method. This may include:
	 * @param {String[]} [options.attributeNames] In the case that a {@link Data.Model Model} is provided to this method, this
	 *   may be an array of the attribute names that should be returned in the output object.  Other attributes will not be processed.
	 *   (Note: only affects the Model passed to this method, and not nested models.)
	 * @param {Boolean} [options.persistedOnly] True to have the method only return data for the persisted attributes on
	 *   Models (i.e. attributes with the {@link Data.attribute.Attribute#persist persist} config set to true, which is the default).
	 * @param {Boolean} [options.raw] True to have the method only return the raw data for the attributes, by way of the {@link Data.Model#raw} method. 
	 *   This is used for persistence, where the raw data values go to the server rather than higher-level objects, or where some kind of serialization
	 *   to a string must take place before persistence (such as for Date objects). 
	 *   
	 *   As a hack (unfortunately, due to limited time), if passing the 'raw' option as true, and a nested {@link Data.Collection Collection} is in a 
	 *   {@link Data.attribute.Collection} that is *not* {@link Data.attribute.Collection#embedded}, then only an array of the 
	 *   {@link Data.Model#idAttribute ID attribute} values is returned for that collection. The final data for a related (i.e. non-embedded) nested
	 *   Collection may look something like this:
	 *     
	 *     myRelatedCollection : [
	 *         { id: 1 },
	 *         { id: 2 }
	 *     ]
	 * 
	 * 
	 * @return {Object[]/Object} An array of objects (for the case of a Collection}, or an Object (for the case of a Model)
	 *   with the internal attributes converted to their native equivalent.
	 */
	convert : function( dataComponent, options ) {
		options = options || {};
		var cache = {},  // keyed by models' clientId, and used for handling circular dependencies
		    persistedOnly = !!options.persistedOnly,
		    raw = !!options.raw,
		    data = ( dataComponent instanceof Data.Collection ) ? [] : {};  // Collection is an Array, Model is an Object
		
		// Prime the cache with the Model/Collection provided to this method, so that if a circular reference points back to this
		// model, the data object is not duplicated as an internal object (i.e. it should refer right back to the converted
		// Model's/Collection's data object)
		cache[ dataComponent.getClientId() ] = data;
		
		// Recursively goes through the data structure, and convert models to objects, and collections to arrays
		_.assign( data, (function convert( dataComponent, attribute ) {  // attribute is only used when processing models, and a nested collection is come across, where the Data.attribute.Attribute is passed along for processing when 'raw' is provided as true. See doc for 'raw' option about this hack..
			var clientId, 
			    cachedDataComponent,
			    data,
			    i, len;
			
			if( dataComponent instanceof Data.Model ) {
				// Handle Models
				var attributes = dataComponent.getAttributes(),
				    attributeNames = options.attributeNames || _.keys( attributes ),
				    attributeName, currentValue;
				
				data = {};  // data is an object for a Model
				
				// Slight hack, but delete options.attributeNames now, so that it is not used again for inner Models (should only affect the first 
				// Model that gets converted, i.e. the Model provided to this method)
				delete options.attributeNames;
				
				for( i = 0, len = attributeNames.length; i < len; i++ ) {
					attributeName = attributeNames[ i ];
					if( !persistedOnly || attributes[ attributeName ].isPersisted() === true ) {
						currentValue = data[ attributeName ] = ( raw ) ? dataComponent.raw( attributeName ) : dataComponent.get( attributeName );
						
						// Process Nested DataComponents
						if( currentValue instanceof Data.DataComponent ) {
							clientId = currentValue.getClientId();
							
							if( ( cachedDataComponent = cache[ clientId ] ) ) {
								data[ attributeName ] = cachedDataComponent;
							} else {
								// first, set up an array/object for the cache (so it exists when checking for it in the next call to convert()), 
								// and set that array/object to the return data as well
								cache[ clientId ] = data[ attributeName ] = ( currentValue instanceof Data.Collection ) ? [] : {};  // Collection is an Array, Model is an Object
								
								// now, populate that object with the properties of the inner object
								_.assign( cache[ clientId ], convert( currentValue, attributes[ attributeName ] ) );
							}
						}
					}
				}
				
			} else if( dataComponent instanceof Data.Collection ) {
				// Handle Collections
				var models = dataComponent.getModels(),
				    model, idAttributeName;
				
				data = [];  // data is an array for a Container
				
				// If the 'attribute' argument to the inner function was provided (coming from a Model that is being converted), and the 'raw' option is true,
				// AND the collection is *not* an embedded collection (i.e. it is a "related" collection), then we only want the ID's of the models for the conversion.
				// See note about this hack in the doc comment for the method for the 'raw' option.
				if( options.raw && attribute && !attribute.isEmbedded() ) {
					for( i = 0, len = models.length; i < len; i++ ) {
						model = models[ i ];
						idAttributeName = model.getIdAttributeName();
						
						data[ i ] = {};
						data[ i ][ idAttributeName ] = model.get( idAttributeName );
					}
					
				} else { 
					// Otherwise, provide the models themselves
					for( i = 0, len = models.length; i < len; i++ ) {
						model = models[ i ];
						clientId = model.getClientId();
						
						data[ i ] = cache[ clientId ] || convert( model );
					}
				}
			}
			
			return data;
		})( dataComponent ) );
		
		return data;
	}
	
};

/**
 * @private
 * @class Data.ModelCache
 * @singleton
 * 
 * Singleton class which caches models by their type (subclass type), and id. This is used
 * to retrieve models, and not duplicate them when instantiating the same model type with the
 * same instance id. 
 * 
 * This is a class used internally by Data, and should not be used directly.
 */
/*global Data */
Data.ModelCache = {
	
	/**
	 * The hashmap of model references stored in the cache. This hashmap is a two-level hashmap, first keyed by the
	 * {@link Data.Model Model's} assigned `__Data_modelTypeId`, and then its instance id.
	 * 
	 * @private
	 * @property {Object} models
	 */
	models : {},
	
	
	/**
	 * Returns a Model that is in the cache with the same model type (model subclass) and instance id, if one exists
	 * that matches the type of the provided `model`, and the provided instance `id`. If a Model does not already exist, 
	 * the provided `model` is simply returned.
	 * 
	 * @method get
	 * @param {Data.Model} model
	 * @param {String} [id]
	 * @return {Data.Model}
	 */
	get : function( model, id ) {
		var modelClass = model.constructor,
		    modelTypeId = modelClass.__Data_modelTypeId,  // the current modelTypeId, defined when the Model is extended
		    cachedModel;
		
		// If there is not a cache for this modelTypeId, create one now
		if( !this.models[ modelTypeId ] ) {
			this.models[ modelTypeId ] = {};
		}
		
		// If the model has an id provided with it, pull the cached model with that id (if it exists), or otherwise cache it
		if( typeof id !== 'undefined' ) {
			cachedModel = this.models[ modelTypeId ][ id ];
			if( !cachedModel ) {
				this.models[ modelTypeId ][ id ] = model;
			}
		}
		
		return cachedModel || model;
	}

};

/**
 * @class Data.persistence.RestProxy
 * @extends Data.persistence.Proxy
 * 
 * RestProxy is responsible for performing CRUD operations in a RESTful manner for a given Model on the server.
 * 
 * @constructor Creates a new RestProxy instance.
 * @param {Object} config The configuration options for this class, specified in an object (hash).
 */
/*global window, jQuery, _ Class, Data */
Data.persistence.RestProxy = Class.extend( Data.persistence.Proxy, {
	
	/**
	 * @cfg {String} urlRoot
	 * The url to use in a RESTful manner to perform CRUD operations. Ex: `/tasks`.
	 * 
	 * The {@link Data.Model#idAttribute id} of the {@link Data.Model} being read/updated/deleted
	 * will automatically be appended to this url. Ex: `/tasks/12`
	 */
	urlRoot : "",
	
	/**
	 * @cfg {Boolean} incremental
	 * True to have the RestProxy only provide data that has changed to the server when
	 * updating a model. By using this, it isn't exactly following REST per se, but can
	 * optimize requests by only providing a subset of the full model data. Only enable
	 * this if your server supports this.
	*/
	incremental : false,
	
	/**
	 * @cfg {String} rootProperty
	 * If the server requires the data to be wrapped in a property of its own, use this config
	 * to specify it. For example, if PUT'ing a Task's data needs to look like this, use this config:
	 * 
	 *     {
	 *         "task" : {
	 *             "text" : "Do Something",
	 *             "isDone" : false
	 *         }
	 *     }
	 * 
	 * This config should be set to "task" in this case.
	 */
	rootProperty : "",
	
	/**
	 * @cfg {Object} actionMethods
	 * A mapping of the HTTP method to use for each action. This may be overridden for custom
	 * server implementations.
	 */
	actionMethods : {
		create  : 'POST',
		read    : 'GET',
		update  : 'PUT',
		destroy : 'DELETE'
	},
	
	/**
	 * @private
	 * @property {Function} ajax
	 * A reference to the AJAX function to use for persistence. This is normally left as jQuery.ajax,
	 * but is changed for the unit tests.
	 */
	ajax : jQuery.ajax,
	
	
	
	/**
	 * Accessor to set the {@link #rootProperty} after instantiation.
	 * 
	 * @method setRootProperty
	 * @param {String} rootProperty The new {@link #rootProperty} value. This can be set to an empty string 
	 *   to remove the {@link #rootProperty}.
	 */
	setRootProperty : function( rootProperty ) {
		this.rootProperty = rootProperty;
	},
	
	
	/**
	 * Creates the Model on the server. Any response data that is provided from the request is
	 * then {@link Data.Model#set} to the Model.
	 * 
	 * @method create
	 * @param {Data.Model} The Model instance to create on the server.
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the delete is successful.
	 * @param {Function} [options.error] Function to call if the delete fails.
	 * @param {Function} [options.complete] Function to call regardless of if the delete is successful or fails.
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in.
	 * @return {jqXHR} The jQuery XMLHttpRequest superset object for the request.
	 */
	create : function( model, options ) {
		options = options || {};
		
		// Set the data to persist
		var dataToPersist = model.getData( { persistedOnly: true, raw: true } );
		
		// Handle needing a different "root" wrapper object for the data
		if( this.rootProperty ) {
			var dataWrap = {};
			dataWrap[ this.rootProperty ] = dataToPersist;
			dataToPersist = dataWrap;
		}
		
		
		var successCallback = function( data ) {
			if( data ) {
				model.set( data );
				model.commit();
			}
			
			if( typeof options.success === 'function' ) {
				options.success.call( options.scope || window );
			}
		};
		
		return this.ajax( {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,  // async defaults to true.
			
			url      : this.buildUrl( model, 'create' ),
			type     : this.getMethod( 'create' ),
			dataType : 'json',
			data     : JSON.stringify( dataToPersist ),
			contentType : 'application/json',
			
			success  : successCallback,  // note: currently called in the scope of options.scope
			error    : options.error    || Data.emptyFn,
			complete : options.complete || Data.emptyFn,
			context  : options.scope    || window
		} );
	},
	
	
	/**
	 * Reads the Model from the server.
	 * 
	 * @method read
	 * @param {Data.Model} The Model instance to read from the server.
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the delete is successful.
	 * @param {Function} [options.error] Function to call if the delete fails.
	 * @param {Function} [options.complete] Function to call regardless of if the delete is successful or fails.
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in.
	 * @return {jqXHR} The jQuery XMLHttpRequest superset object for the request.
	 */
	read : function( model, options ) {
		options = options || {};
		
		var successCallback = function( data ) {
			model.set( data );
			model.commit();
			
			if( typeof options.success === 'function' ) {
				options.success.call( options.scope || window );
			}
		};
		
		return this.ajax( {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,  // async defaults to true.
			
			url      : this.buildUrl( model, 'read' ),
			type     : this.getMethod( 'read' ),
			dataType : 'json',
			
			success  : successCallback,
			error    : options.error    || Data.emptyFn,
			complete : options.complete || Data.emptyFn,
			context  : options.scope    || window
		} );
	},
	
	
	/**
	 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
	 * are persisted.
	 * 
	 * @method update
	 * @param {Data.Model} model The model to persist to the server. 
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the update is successful.
	 * @param {Function} [options.error] Function to call if the update fails.
	 * @param {Function} [options.complete] Function to call regardless of if the update is successful or fails.
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in. 
	 *   This may also be provided as `context` if you prefer.
	 * @return {jqXHR} The jQuery XMLHttpRequest superset object for the request, *or `null` if no request is made
	 *   because the model contained no changes*.
	 */
	update : function( model, options ) {
		options = options || {};
		var scope = options.scope || options.context || window;
		
		var changedData = model.getChanges( { persistedOnly: true, raw: true } );
		
		// Short Circuit: If there is no changed data in any of the attributes that are to be persisted, there is no need to make a 
		// request. Run the success callback and return out.
		if( _.isEmpty( changedData ) ) {
			if( typeof options.success === 'function' ) {
				options.success.call( scope );
			}
			if( typeof options.complete === 'function' ) {
				options.complete.call( scope );
			}
			return null;
		}
		
		
		// Set the data to persist, based on if the persistence proxy is set to do incremental updates or not
		var dataToPersist;
		if( this.incremental ) {
			dataToPersist = changedData;   // uses incremental updates, we can just send it the changes
		} else {
			dataToPersist = model.getData( { persistedOnly: true, raw: true } );  // non-incremental updates, provide all persisted data
		}
		
		
		// Handle needing a different "root" wrapper object for the data
		if( this.rootProperty ) {
			var dataWrap = {};
			dataWrap[ this.rootProperty ] = dataToPersist;
			dataToPersist = dataWrap;
		}
		
		
		// Finally, persist to the server
		return this.ajax( {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,  // async defaults to true.
			
			url      : this.buildUrl( model, 'update' ),
			type     : this.getMethod( 'update' ),
			dataType : 'json',
			data     : JSON.stringify( dataToPersist ),
			contentType : 'application/json',
			
			success  : options.success  || Data.emptyFn,
			error    : options.error    || Data.emptyFn,
			complete : options.complete || Data.emptyFn,
			context  : scope
		} );
	},
	
	
	/**
	 * Destroys (deletes) the Model on the server.
	 * 
	 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
	 * 
	 * @method destroy
	 * @param {Data.Model} The Model instance to delete on the server.
	 * @param {Object} [options] An object which may contain the following properties:
	 * @param {Boolean} [options.async=true] True to make the request asynchronous, false to make it synchronous.
	 * @param {Function} [options.success] Function to call if the delete is successful.
	 * @param {Function} [options.error] Function to call if the delete fails.
	 * @param {Function} [options.complete] Function to call regardless of if the delete is successful or fails.
	 * @param {Object} [options.scope=window] The object to call the `success`, `error`, and `complete` callbacks in.
	 * @return {jqXHR} The jQuery XMLHttpRequest superset object for the request.
	 */
	destroy : function( model, options ) {
		options = options || {};
	
		return this.ajax( {
			async    : ( typeof options.async === 'undefined' ) ? true : options.async,  // async defaults to true.
			
			url      : this.buildUrl( model, 'destroy' ),
			type     : this.getMethod( 'destroy' ),
			dataType : 'text', // in case the server returns nothing. Otherwise, jQuery might make a guess as to the wrong data type (such as JSON), and try to parse it, causing the `error` callback to be executed instead of `success`
			
			success  : options.success  || Data.emptyFn,
			error    : options.error    || Data.emptyFn,
			complete : options.complete || Data.emptyFn,
			context  : options.scope    || window
		} );
	},
	
	
	// -------------------
	
	
	/**
	 * Builds the URL to use to do CRUD operations.
	 * 
	 * @protected
	 * @method buildUrl
	 * @param {Data.Model} model The model that a url is being built for.
	 * @param {String} [action] The action being taken. This will be one of: 'create', 'read', 'update', or 'destroy'.
	 * @return {String} The url to use.
	 */
	buildUrl : function( model, action ) {
		var url = this.urlRoot;
		
		// Use the model's ID to set the url if we're not creating
		if( action !== 'create' ) {
			if( !url.match( /\/$/ ) ) {
				url += '/';  // append trailing slash if it's not there
			}
			
			url += encodeURIComponent( model.getId() );
		}
		
		return url;
	},
	
	
	/**
	 * Retrieves the HTTP method that should be used for a given action. This is, by default, done via 
	 * a lookup to the {@link #actionMethods} config object.
	 * 
	 * @protected
	 * @method getMethod
	 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
	 * @return {String} The HTTP method that should be used.
	 */
	getMethod : function( action ) {
		return this.actionMethods[ action ];
	}
	
} );

// Register the persistence proxy so that it can be created by an object literal with a `type` property
Data.persistence.Proxy.register( 'rest', Data.persistence.RestProxy );

