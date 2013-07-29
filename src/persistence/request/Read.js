/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/request/Request'
], function( _, Class, Request ) {
	
	/**
	 * @class data.persistence.request.Read
	 * @extends data.persistence.request.Request
	 * 
	 * Represents a "read" CRUD request to a persistent storage mechanism. 
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} requests 
	 * complete.
	 */
	var ReadRequest = Class.extend( Request, {
		
		/**
		 * @cfg {Number/String} modelId
		 * 
		 * A single model ID to load. This is only used for loading a single {@link data.Model Model}.
		 * If this value is not provided, it will be assumed to load a collection of models.
		 */
		
		/**
		 * @cfg {Number} page
		 * 
		 * When loading a page of a paged data set, this is the 1-based page number to load.
		 */
		
		/**
		 * @cfg {Number} pageSize
		 * 
		 * When loading a page of a paged data set, this is size of the page. Used in conjunction
		 * with the {@link #page} config.
		 */
		
		/**
		 * @cfg {Number} start
		 * 
		 * The start index of where to load models from. Used for when loading paged sets of data
		 * in a {@link data.Collection Collection}.
		 */
		start : 0,
		
		/**
		 * @cfg {Number} limit
		 * 
		 * The number of models to load. Used in conjunction with the {@link #start} config.
		 * 
		 * Defaults to 0, for "no limit"
		 */
		limit : 0,
		
		
		/**
		 * Implementation of abstract method to return the {@link data.persistence.proxy.Proxy Proxy}
		 * CRUD action name for the Request.
		 * 
		 * @protected
		 * @return {String} Always returns 'read' for the ReadRequest.
		 */
		getAction : function() {
			return 'read';
		},
		
		
		/**
		 * Retrieves the value of the {@link #modelId} config, if it was provided.
		 * If it was not provided, returns `null`.
		 * 
		 * @return {Number/String} The {@link #modelId} provided as a config, or `null` if the config 
		 *   was not provided.
		 */
		getModelId : function() {
			return ( this.modelId !== undefined ) ? this.modelId : null;
		},
		
		
		/**
		 * Retrieves the value of the {@link #page} config. Will return `undefined` if no {@link #page}
		 * config has been provided.
		 * 
		 * @return {Number}
		 */
		getPage : function() {
			return this.page;
		},
		
		
		/**
		 * Retrieves the value of the {@link #pageSize} config. Will return `undefined` if no {@link #pageSize}
		 * config has been provided.
		 * 
		 * @return {Number}
		 */
		getPageSize : function() {
			return this.pageSize;
		},
		
		
		/**
		 * Retrieves the value of the {@link #start} config.
		 * 
		 * @return {Number}
		 */
		getStart : function() {
			return this.start;
		},
		
		
		/**
		 * Retrieves the value of the {@link #limit} config.
		 * 
		 * @return {Number}
		 */
		getLimit : function() {
			return this.limit;
		}
		
	} );
	
	return ReadRequest;
	
} );