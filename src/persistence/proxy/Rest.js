/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/persistence/proxy/Proxy'
], function( jQuery, _, Class, Proxy ) {
	
	/**
	 * @class Data.persistence.proxy.Rest
	 * @extends Data.persistence.proxy.Proxy
	 * 
	 * RestProxy is responsible for performing CRUD operations in a RESTful manner for a given Model on the server.
	 */
	var RestProxy = Class.extend( Proxy, {
		
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
		 * Creates the Model on the server.
		 * 
		 * @method create
		 * @param {Data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be created on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		create : function( operation ) {
			var me = this,  // for closures
			    deferred = new jQuery.Deferred(),
			    model = operation.getModels()[ 0 ],
			    dataToPersist = model.getData( { persistedOnly: true, raw: true } );
			
			// Handle needing a different "root" wrapper object for the data
			if( this.rootProperty ) {
				var dataWrap = {};
				dataWrap[ this.rootProperty ] = dataToPersist;
				dataToPersist = dataWrap;
			}
			
			this.ajax( {
				url         : this.buildUrl( 'create', model.getId() ),
				type        : this.getMethod( 'create' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					if( data ) {  // data may or may not be returned by a server on a 'create' request
						operation.setResultSet( me.reader.read( data ) );
					}
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Reads the Model from the server.
		 * 
		 * @method read
		 * @param {Data.persistence.operation.Read} operation The ReadOperation instance that holds the model(s) 
		 *   to be read from the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		read : function( operation ) {
			var me = this,  // for closures
			    deferred = new jQuery.Deferred();
			
			this.ajax( {
				url      : this.buildUrl( 'read', operation.getModelId() ),
				type     : this.getMethod( 'read' ),
				dataType : 'json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					operation.setResultSet( me.reader.read( data ) );
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @method update
		 * @param {Data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be updated on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		update : function( operation, options ) {
			options = options || {};
			var me = this,  // for closures
			    scope = options.scope || options.context || window,
			    model = operation.getModels()[ 0 ],
			    changedData = model.getChanges( { persistedOnly: true, raw: true } ),
			    deferred = new jQuery.Deferred();
			
			// Short Circuit: If there is no changed data in any of the attributes that are to be persisted, there is no need to make a 
			// request. Resolves the deferred and return out.
			if( _.isEmpty( changedData ) ) {
				deferred.resolve( operation );
				return deferred.promise();
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
			this.ajax( {
				url         : this.buildUrl( 'update', model.getId() ),
				type        : this.getMethod( 'update' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					if( data ) {  // data may or may not be returned by a server on an 'update' request
						operation.setResultSet( me.reader.read( data ) );
					}
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @method destroy
		 * @param {Data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be destroyed on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( operation ) {
			var deferred = new jQuery.Deferred(),
			    model = operation.getModels()[ 0 ];
			
			this.ajax( {
				url      : this.buildUrl( 'destroy', model.getId() ),
				type     : this.getMethod( 'destroy' ),
				dataType : 'text'  // in case the server returns nothing. Otherwise, jQuery might make a guess as to the wrong data type (such as JSON), and try to parse it, causing the `error` callback to be executed instead of `success`
			} ).then(
				function( data, textStatus, jqXHR ) {
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		// -------------------
		
		
		/**
		 * Builds the URL to use to do CRUD operations.
		 * 
		 * @protected
		 * @method buildUrl
		 * @param {String} action The action being taken. Must be one of: 'create', 'read', 'update', or 'destroy'.
		 * @param {String} modelId The ID for the model that a url is being built for.
		 * @return {String} The url to use.
		 */
		buildUrl : function( action, modelId ) {
			var url = this.urlRoot;
			
			// Use the model's ID to set the url if we're not creating.
			// In the read case where there is no particular model to load (i.e. loading a collection),
			// then we skip this as well, as we want to load *all* (or at least a range of) models of the 
			// particular resource.
			if( action !== 'create' && modelId ) {
				if( !url.match( /\/$/ ) ) {
					url += '/';  // append trailing slash if it's not there
				}
				
				url += encodeURIComponent( modelId );
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
	Proxy.register( 'rest', RestProxy );
	
	return RestProxy;
	
} );