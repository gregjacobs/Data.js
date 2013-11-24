/*global define */
define( [
	'lodash',
	'Class',
	'Observable',
	
	'data/persistence/proxy/Proxy'
], function( _, Class, Observable, Proxy ) {

	/**
	 * @private
	 * @abstract
	 * @class data.DataComponent
	 * @extends Observable
	 * 
	 * Base class for data-holding classes ({@link data.Model} and {@link data.Collection}), that abstracts out some
	 * of the commonalities between them.
	 * 
	 * This class is used internally by the framework, and shouldn't be used directly.
	 */
	var DataComponent = Observable.extend( {
		abstractClass : true,
		
		
		statics : {
			
			/**
			 * Utility method used to normalize the `options` parameter for the options that are common to each of the "persistence" 
			 * methods of DataComponent subclasses. This includes:
			 * 
			 * - {@link data.Model#load}
			 * - {@link data.Model#save}
			 * - {@link data.Model#destroy}
			 * - {@link data.Collection#method-load}
			 * - {@link data.Collection#loadRange}
			 * - {@link data.Collection#loadPage}
			 * - {@link data.Collection#loadPageRange}
			 * - {@link data.Collection#sync}
			 * 
			 * This method only operates on the properties listed below. It provides a default empty function for each of the 
			 * `success`, `error`, `cancel`, `progress`, and `complete` functions, and binds them to the `scope` (or `context`). 
			 * All other properties that exist on the `options` object will remain unchanged. 
			 * 
			 * @protected
			 * @static
			 * @param {Object} [options] The options object provided to any of the "persistence" methods. If `undefined` or `null` is
			 *   provided, a normalized options object will still be returned, simply with defaults filled out.
			 * @param {Function} [options.success] Function to call if the persistence method is successful. Will be defaulted to an
			 *   empty function as part of this method's normalization process.
			 * @param {Function} [options.error] Function to call if the persistence method fails. Will be defaulted to an
			 *   empty function as part of this method's normalization process.
			 * @param {Function} [options.cancel] Function to call if the persistence method has been canceled, by the returned
			 *   Operation being {@link data.persistence.operation.Operation#abort aborted}.
			 * @param {Function} [options.progress] Function to call when progress has been made on the persistence Operation. This 
			 *   is called when an individual request has completed, or when the {@link #proxy} reports progress otherwise.
			 * @param {Function} [options.complete] Function to call when the persistence operation is complete, regardless
			 *   of success or failure. Will be defaulted to an empty function as part of this method's normalization process.
			 * @param {Object} [options.scope] The object to call the `success`, `error`, `cancel`, `progress` and `complete` callbacks 
			 *   in. This may also be provided as the property `context`. Defaults to this DataComponent. This method binds each of
			 *   the callbacks to this object.
			 * @return {Object} The normalized `options` object.
			 */
			normalizePersistenceOptions : function( options ) {
				options = options || {};
				
				var emptyFn = function() {},
				    scope   = options.scope || options.context || this;
				
				options.success  = _.bind( options.success  || emptyFn, scope );
				options.error    = _.bind( options.error    || emptyFn, scope );
				options.cancel   = _.bind( options.cancel   || emptyFn, scope );
				options.progress = _.bind( options.progress || emptyFn, scope );
				options.complete = _.bind( options.complete || emptyFn, scope );
				
				return options;
			}
			
		},
		
		inheritedStatics : {
			
			/**
			 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for the DataComponent class. To retrieve
			 * a proxy that may belong to a particular DataComponent instance, use the instance level {@link #method-getProxy}.
			 * 
			 * @inheritable
			 * @static
			 * @return {data.persistence.proxy.Proxy} The Proxy configured with the Model, or null.
			 */
			getProxy : function() {
				return this.prototype.proxy || null;
			},
			
			
			/**
			 * Subclass-specific setup. This method instantiates any anonymous proxy configuration object
			 * set to the prototype of the class into a {@link data.persistence.proxy.Proxy} instance.
			 * 
			 * @ignore
			 */
			onClassCreated : function( newDataComponentClass ) {
				var proto = newDataComponentClass.prototype;
				
				// Instantiate an anonymous proxy configuration object on the class's prototype into a Proxy instance
				if( proto.hasOwnProperty( 'proxy' ) && proto.proxy && !( proto.proxy instanceof Proxy ) ) {
					proto.proxy = Proxy.create( proto.proxy );
				}
			}
			
		},
		
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the DataComponent's data to/from persistent
		 * storage. If this is not specified, the DataComponent may not save or load its data to/from an external
		 * source. (Note that the way that the DataComponent loads/saves its data is dependent on the particular
		 * implementation.)
		 */
		
		
		/**
		 * @protected
		 * @property {String} clientId (readonly)
		 * 
		 * A unique ID for the Model on the client side. This is used to uniquely identify each Model instance.
		 * Retrieve with {@link #getClientId}.
		 */
		
		
		/**
		 * @constructor
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
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link data.attribute.Attribute Attribute} values.
		 */
		getData : Class.abstractMethod,
		
		
		/**
		 * Determines if the DataComponent has any modifications.
		 * 
		 * @abstract
		 * @method isModified
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method.  Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link data.attribute.Attribute#persist persisted} 
		 *   attribute of a Model is modified within the DataComponent.
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
		rollback : Class.abstractMethod,
		
			
		/**
		 * Sets a {@link data.persistence.proxy.Proxy} to this particular DataComponent instance. Setting a 
		 * proxy with this method will only affect this particular DataComponent instance, not any others.
		 * 
		 * To configure a proxy that will be shared between all instances of the DataComponent, set one in a DataComponent 
		 * subclass. Example of doing this:
		 * 
		 *     define( [
		 *         'data/Model',
		 *         'data/persistence/proxy/Ajax'
		 *     ], function( Model, AjaxProxy ) {
		 *         
		 *         var UserModel = Model.extend( {
		 *             attributes : [ 'id', 'firstName', 'lastName' ],
		 *         
		 *             proxy : new AjaxProxy( {
		 *                 url : '/users'
		 *             } )
		 *         } );
		 *         
		 *         return UserModel;
		 *         
		 *     } );
		 * 
		 * @param {data.persistence.proxy.Proxy/Object} The Proxy to set to this DataComponent instance. May also be an
		 *   anonymous Proxy configuration object, which must have a `type` property. Ex: `{ type: 'ajax', url: '...' }`.
		 */
		setProxy : function( proxy ) {
			this.proxy = proxy;
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.proxy.Proxy Proxy} that is configured for this DataComponent. This will be
		 * any Proxy set to the DataComponent instance itself using {@link #setProxy}, or otherwise will be the Proxy set to
		 * the DataComponent's prototype. (See example of how to set up a proxy on the prototype in {@link #setProxy}.) 
		 * 
		 * Note: To retrieve the proxy that belongs to the DataComponent class (or subclass) itself, use the static 
		 * {@link #static-method-getProxy} method.
		 * 
		 * @return {data.persistence.proxy.Proxy} The Proxy configured for the DataComponent, or `null`.
		 */
		getProxy : function() {
			var proxy = this.proxy;
			
			// Lazily instantiate an anonymous config object into a Proxy instance, if that is what exists
			if( proxy && !( proxy instanceof Proxy ) ) {
				this.proxy = proxy = Proxy.create( proxy );
			}
			
			return proxy || null;
		}
		
	} );
	
	return DataComponent;
	
} );