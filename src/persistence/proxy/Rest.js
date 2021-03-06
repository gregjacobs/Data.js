/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/persistence/proxy/Proxy',
	'data/persistence/proxy/Ajax'
], function( jQuery, _, Class, Proxy, AjaxProxy ) {
	
	/**
	 * @class data.persistence.proxy.Rest
	 * @extends data.persistence.proxy.Ajax
	 * 
	 * RestProxy is responsible for performing CRUD requests in a RESTful manner for a given Model on the server.
	 */
	var RestProxy = Class.extend( AjaxProxy, {
		
		/**
		 * @cfg {String} urlRoot
		 * 
		 * The url to use in a RESTful manner to perform CRUD requests. Ex: `/tasks`.
		 * 
		 * The {@link data.Model#idAttribute id} of the {@link data.Model} being read/updated/deleted
		 * will automatically be appended to this url. Ex: `/tasks/12`
		 */
		urlRoot : "",
		
		/**
		 * @cfg {Boolean} incremental
		 * 
		 * True to have the RestProxy only provide data that has changed to the server when
		 * updating a model. By using this, it isn't exactly following REST per se, but can
		 * optimize requests by only providing a subset of the full model data. Only enable
		 * this if your server supports this.
		*/
		incremental : false,
		
		/**
		 * @cfg {String} rootProperty
		 * 
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
		 * @cfg
		 * @inheritdoc
		 */
		createMethod : 'POST',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		readMethod : 'GET',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		updateMethod : 'PUT',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		destroyMethod : 'DELETE',
		
		
		/**
		 * Accessor to set the {@link #rootProperty} after instantiation.
		 * 
		 * @param {String} rootProperty The new {@link #rootProperty} value. This can be set to an empty string 
		 *   to remove the {@link #rootProperty}.
		 */
		setRootProperty : function( rootProperty ) {
			this.rootProperty = rootProperty;
		},
		
		
		/**
		 * Creates the Model on the server.
		 * 
		 * @param {data.persistence.request.Create} request The CreateRequest instance that holds the model(s) 
		 *   to be created on the REST server.
		 */
		create : function( request ) {
			var me = this,  // for closures
			    model = request.getModels()[ 0 ],
			    dataToPersist = model.getData( { persistedOnly: true, raw: true } );
			
			// Handle needing a different "root" wrapper object for the data
			if( this.rootProperty ) {
				var dataWrap = {};
				dataWrap[ this.rootProperty ] = dataToPersist;
				dataToPersist = dataWrap;
			}
			
			this.ajax( {
				url         : this.buildUrl( 'create', model.getId() ),
				type        : this.getHttpMethod( 'create' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					var resultSet;
					if( data ) {  // data may or may not be returned by a server on a 'create' request
						resultSet = me.reader.read( data );
					}
					
					request.resolve( resultSet );
				},
				function( jqXHR, textStatus, errorThrown ) {
					request.reject( { textStatus: textStatus, errorThrown: errorThrown } );
				}
			);
		},
		
		
		/**
		 * Reads the Model from the server.
		 * 
		 * @param {data.persistence.request.Read} request The ReadRequest instance that holds the model(s) 
		 *   to be read from the REST server.
		 */
		read : function( request ) {
			var me = this;  // for closures
			
			this.ajax( {
				url      : this.buildUrl( 'read', request.getModelId() ),
				type     : this.getHttpMethod( 'read' ),
				dataType : 'json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					var resultSet = me.reader.read( data );
					request.resolve( resultSet );
				},
				function( jqXHR, textStatus, errorThrown ) {
					request.reject( { textStatus: textStatus, errorThrown: errorThrown } );
				}
			);
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance that holds the model(s) 
		 *   to be updated on the REST server.
		 */
		update : function( request ) {
			var me = this,  // for closures
			    model = request.getModels()[ 0 ],
			    changedData = model.getChanges( { persistedOnly: true, raw: true } );
			
			// Short Circuit: If there is no changed data in any of the attributes that are to be persisted, there is no need to make a 
			// request. Resolves the deferred and return out.
			if( _.isEmpty( changedData ) ) {
				request.resolve();
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
				type        : this.getHttpMethod( 'update' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					var resultSet;
					if( data ) {  // data may or may not be returned by a server on an 'update' request
						resultSet = me.reader.read( data );
					}
					request.resolve( resultSet );
				},
				function( jqXHR, textStatus, errorThrown ) {
					request.reject( { textStatus: textStatus, errorThrown: errorThrown } );
				}
			);
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance that holds the model(s) 
		 *   to be destroyed on the REST server.
		 */
		destroy : function( request ) {
			var model = request.getModels()[ 0 ];
			
			this.ajax( {
				url      : this.buildUrl( 'destroy', model.getId() ),
				type     : this.getHttpMethod( 'destroy' ),
				dataType : 'text'  // in case the server returns nothing. Otherwise, jQuery might make a guess as to the wrong data type (such as JSON), and try to parse it, causing the `error` callback to be executed instead of `success`
			} ).then(
				function( data, textStatus, jqXHR ) {
					request.resolve();
				},
				function( jqXHR, textStatus, errorThrown ) {
					request.reject( { textStatus: textStatus, errorThrown: errorThrown } );
				}
			);
		},
		
		
		// -------------------
		
		
		/**
		 * Builds the URL to use to do CRUD requests.
		 * 
		 * @protected
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
			if( action !== 'create' && modelId !== undefined ) {
				if( !url.match( /\/$/ ) ) {
					url += '/';  // append trailing slash if it's not there
				}
				
				url += encodeURIComponent( modelId );
			}
			
			return url;
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'rest', RestProxy );
	
	return RestProxy;
	
} );