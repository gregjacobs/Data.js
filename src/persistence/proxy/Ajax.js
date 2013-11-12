/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/persistence/proxy/Proxy'
], function( jQuery, _, Class, Data, Proxy ) {
	
	/**
	 * @class data.persistence.proxy.Ajax
	 * @extends data.persistence.proxy.Proxy
	 * 
	 * Ajax proxy is responsible for performing CRUD requests through standard AJAX, using the url(s) configured,
	 * and providing any parameters and such which are required for the backend service.
	 * 
	 * The Ajax proxy must be configured with the appropriate parameter names in order for it to automatically supply
	 * those parameters as part of its requests. For example, the {@link #pageParam} must be configured for the Ajax
	 * proxy to automatically add a page number parameter to the request URL.
	 */
	var AjaxProxy = Class.extend( Proxy, {
		
		/**
		 * @cfg {String} url
		 * 
		 * The URL of where to request data from. This URL can be overridden for any particular CRUD (create,
		 * read, update, destroy) method by using the {@link #api} config.
		 */
		
		/**
		 * @cfg {Object} api
		 * 
		 * Specific URLs to use for each CRUD (create, read, update, destroy) method. Defaults to:
		 * 
		 *     api : {
		 *         create  : undefined,
		 *         read    : undefined,
		 *         update  : undefined,
		 *         destroy : undefined
		 *     }
		 *     
		 * The URL that is used depends on the method being executed ({@link #create}, {@link #read}, 
		 * {@link #update}, or {@link #destroy}). 
		 * 
		 * An example configuration may be:
		 * 
		 *     api : {
		 *         create  : '/users/new',
		 *         read    : '/users/load',
		 *         update  : '/users/update',
		 *         destroy : '/users/delete
		 *     }
		 *     
		 * If a URL does not exist in the api map for the method being executed, the {@link #url} config 
		 * will be used instead. This allows the {@link #url} config to be used for all api methods.
		 */
		
		/**
		 * @cfg {Object} defaultParams
		 * 
		 * An Object (map) of any default parameters to include with every request. `params` provided to individual
		 * requests will override default parameters of the same name.
		 * 
		 * Ex:
		 * 
		 *     defaultParams : {
		 *         returnType : 'json'
		 *     }
		 *     
		 * Note that the values of these parameters will be URL encoded, if the default behavior of serializing the
		 * parameters as a query string is not overridden by a new {@link #serializeParams} implementation.
		 */
		
		/**
		 * @cfg {String} createMethod
		 * 
		 * The HTTP method to use to when creating a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		createMethod : 'POST',
		
		/**
		 * @cfg {String} readMethod
		 * 
		 * The HTTP method to use to when reading a {@link data.Model Model} or {@link data.Collection} 
		 * from the server. This may be overridden for custom implementations.
		 */
		readMethod : 'GET',
		
		/**
		 * @cfg {String} updateMethod
		 * 
		 * The HTTP method to use to when updating a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		updateMethod : 'POST',
		
		/**
		 * @cfg {String} destroyMethod
		 * 
		 * The HTTP method to use to when destroying a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		destroyMethod : 'POST',
		
		/**
		 * @cfg {String} idParam
		 * 
		 * The name of the parameter to pass the id of a particular model that is being operated on. For example,
		 * when loading a single {@link data.Model Model}, a request may be generated as: `/users/load?id=42`
		 */
		idParam : 'id',
		
		/**
		 * @cfg {String} pageParam
		 * 
		 * The name of the parameter to pass the page number when loading a paged data set. If this config is not provided,
		 * no page number parameter will be included in requests.
		 * 
		 * For example, if this config is set to 'page', and a page 10 of data is being loaded (via {@link data.Collection#loadPage}), 
		 * a request may be generated as: `/posts/load?page=10`
		 * 
		 * (A `pageParam` config must be provided if loading pages of data in this manner.) 
		 */
		
		/**
		 * @cfg {String} pageSizeParam
		 * 
		 * The name of the parameter to pass the page size when loading a paged data set. If this config is not provided,
		 * no page size parameter will be included in requests.
		 * 
		 * For example, if this config is set to 'pageSize', and a page of data is being loaded (via {@link data.Collection#loadPage}), 
		 * a request may be generated as: `/posts/load?pageSize=50`
		 */
		
		
		/**
		 * @protected
		 * @property {Function} ajax
		 * 
		 * A reference to the AJAX function to use for persistence. This is normally left as jQuery.ajax,
		 * but is changed for unit tests.
		 */
		ajax : jQuery.ajax,
		
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			this._super( arguments );
			
			this.api = this.api || {};
			this.defaultParams = this.defaultParams || {};
		},
		
		
		
		/**
		 * Creates the Model on the server.
		 * 
		 * @param {data.persistence.request.Create} request The CreateRequest instance that holds the model(s) 
		 *   to be created on the server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		create : function( request ) {
			throw new Error( "create() not yet implemented" );
		},
		
		
		/**
		 * Reads one or more {@link data.Model Models} from the server.
		 * 
		 * @param {data.persistence.request.Read} request The ReadRequest instance that describes the 
		 *   model(s) to be read from the server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : function( request ) {
			var me = this,  // for closures
			    paramsObj = this.buildParams( request ),
			    deferred = new jQuery.Deferred();
			
			this.ajax( {
				url      : this.buildUrl( request ),
				type     : this.getHttpMethod( 'read' ),
				data     : this.serializeParams( paramsObj, 'read', request ),  // params will be appended to URL on 'GET' requests, or put into the request body on 'POST' requests (dependent on `readMethod` config)
				dataType : 'text'
			} ).then(
				function( data, textStatus, jqXHR ) {
					request.setResultSet( me.reader.read( data ) );
					request.setSuccess();
					deferred.resolve( request );
				},
				function( jqXHR, textStatus, errorThrown ) {
					request.setError( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( request );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance that holds the model(s) 
		 *   to be updated on the server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function( request ) {
			throw new Error( "update() not yet implemented" );
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance that holds the model(s) 
		 *   to be destroyed on the server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( request ) {
			throw new Error( "destroy() not yet implemented" );
		},
		
		
		// -----------------------------------
		
		// Note: No setDefaultParams() method so that the Proxy is immutable, and can be shared between many Model
		//       and Collection instances.
		
		
		/**
		 * Builds the full URL that will be used for any given CRUD (create, read, update, destroy) request. This will
		 * be the base url provided by either the {@link #api} or {@link #url} configs, plus any parameters that need
		 * to be added based on the `request` provided.
		 * 
		 * @protected
		 * @param {data.persistence.request.Request} request The Request being made.
		 * @return {String} The full URL, with all parameters.
		 */
		buildUrl : function( request ) {
			var action = request.getAction(),  // The CRUD action name. Ex: 'create', 'read', 'update', or 'destroy'
			    url = this.getUrl( action );
			
			// Only add params explicitly to the URL when doing a create/update/destroy request. For a 'read' 
			// request, params will be added conditionally to either the url or the post body based on the http 
			// method being used ('GET' or 'POST', handled in the read() method itself). 
			if( action !== 'read' ) {
				var params = this.buildParams( request );
				
				url = this.urlAppend( url, this.serializeParams( params, action, request ) );
			}
			return url;
		},
		
		
		/**
		 * Builds the parameters for a given `request`. By default, the `request`'s params are combined
		 * with the Proxy's {@link #defaultParams}, and then any additional parameters for paging and such are
		 * added.
		 * 
		 * @protected
		 * @param {data.persistence.request.Request} request The request which holds the
		 *   {@link data.persistence.request.Request#getAction action} (create/read/update/destroy), and the
		 *   {@link data.persistence.request.Request#getParams parameters} for the request.
		 * @return {Object} An Object (map) of the parameters, where the keys are the parameter names,
		 *   and the values are the parameter values.
		 */
		buildParams : function( request ) {
			var action = request.getAction(),  // The CRUD action name. Ex: 'create', 'read', 'update', or 'destroy'
			    params = _.assign( {}, this.defaultParams, request.getParams() || {} );   // build the params map
			
			// Add the model's `id` and the paging parameters for 'read' requests only
			if( action === 'read' ) {
				var modelId = request.getModelId(),
				    idParam = this.idParam,
				    page = request.getPage(),
				    pageSize = request.getPageSize(),
				    pageParam = this.pageParam,
				    pageSizeParam = this.pageSizeParam;
				
				if( modelId !== undefined && idParam ) 
					params[ idParam ] = modelId;
				
				if( page > 0 && pageParam ) {   // an actual page was requested, and there is a pageParam config defined
					params[ pageParam ] = page;
				}
				if( pageSize > 0 && pageSizeParam ) {
					params[ pageSizeParam ] = pageSize;
				}
			}
			
			return params;
		},
		
		
		/**
		 * Serializes the parameters for an request. The default implementation of this method is to serialize
		 * them into a query string, but may be overridden to support other formats.
		 * 
		 * @protected
		 * @param {Object} params The Object (map) of parameters to serialize. The keys of this map are the parameter names,
		 *   and the values are the parameter values.
		 * @param {String} action The action that is being taken. One of: 'create', 'read', 'update', or 'destroy'.
		 * @param {data.persistence.request.Read/data.persistence.request.Write} request
		 * @return {String} The serialized string of parameters.
		 */
		serializeParams : function( params, action, request ) {
			return this.objToQueryString( params );
		},
		
		
		/**
		 * Retrieves the URL to use for the given CRUD (create, read, update, destroy) request. This is based on 
		 * either the {@link #api} (if there is a URL defined for the given `action`), or otherwise, the {@link #url} config.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @return {String} The URL to use for the given `action`.
		 */
		getUrl : function( action ) {
			var url = this.api[ action ] || this.url;
			
			// <debug>
			if( !url ) 
				throw new Error( "No url found for action method '" + action + "'. Need to configure ajax proxy with `url` and/or `api` configs" );
			// </debug>
			
			return url;
		},
		
		
		/**
		 * Retrieves the HTTP method that should be used for a given action ('create', 'read', 'update', or 'destroy'). 
		 * The return value is dependent on the values of the {@link #createMethod}, {@link #readMethod}, 
		 * {@link #updateMethod}, and {@link #destroyMethod} configs.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @return {String} The HTTP method that should be used, based on the appropriate config (see above).
		 */
		getHttpMethod : function( action ) {
			return this[ action + 'Method' ];  // ex: this.createMethod, this.readMethod, this.updateMethod, or this.destroyMethod
		},
		
		
		// -------------------------------------
		
		
		/**
		 * Utility method which appends a query string of arguments to an existing url. Will append with the
		 * '&' character if there is already a query string separator in the url ('?'), or otherwise will append
		 * with the query string separator.
		 * 
		 * Ex:
		 *     
		 *     this.urlAppend( 'http://www.yahoo.com/', 'x=1&y=2' );
		 *     // <- http://www.yahoo.com/?x=1&y=2
		 *     
		 *     this.urlAppend( 'http://www.yahoo.com/?x=1', 'y=2&z=3' );
		 *     // <- http://www.yahoo.com/?x=1&y=2&z=3
		 *     
		 * @param {String} url The url string to append to.
		 * @param {String} queryString The query string to append.
		 * @return The `url` + `queryString`, with the correct separator character.
		 */
		urlAppend : function( url, queryString ) {
			if( queryString ) {
				var indexOfQuestionMark = url.indexOf( '?' ),
				    separatorChar = '';
				
				if( indexOfQuestionMark === -1 ) {
					separatorChar = '?';
				} else if( indexOfQuestionMark < url.length - 1 ) {
					// Only adding the '&' separator char if the the '?' is in the string, but is *not* the last char (i.e. there is 
					// no query string value yet, but the url already has the correct '?' separator char)
					separatorChar = '&';
				}
				
				url += separatorChar + queryString;
			}
			
			return url;
		},
		
		
		/**
		 * Converts an Object (map) of properties and values into a query string.
		 * 
		 * @protected
		 * @param {Object} obj
		 * @return {String} The keys/values of the `obj` in the format "key=value&key2=value2".
		 */
		objToQueryString : function( obj ) {
			// Map the object to an array of query string params
			var arr = _.map( obj, function( value, prop ) {
				return prop + '=' + encodeURIComponent( value );
			} );
			return arr.join( '&' );
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'ajax', AjaxProxy );
	
	return AjaxProxy;
	
} );