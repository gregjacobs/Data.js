/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/operation/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class Data.persistence.operation.ReadOperation
	 * @extends Data.persistence.operation.Operation
	 * 
	 * Represents a read operation from a persistent storage mechanism. 
	 * 
	 * This class is used internally by the framework when making requests to {@link Data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link Data.Model Model}/{@link Data.Collection Collection} operations 
	 * complete.
	 */
	var ReadOperation = Class.extend( Operation, {
		
		/**
		 * @cfg {Number/String} modelId
		 * 
		 * A single ID to load. This is used for loading a single {@link Data.Model Model}.
		 * This value will be converted to a String when retrieved by {@link #getModelId}.
		 * If this value is not provided, it will be assumed to load a collection of models.
		 */
		
		/**
		 * @cfg {Number} start
		 * 
		 * The start index of where to load models from. Used for when loading paged sets of data
		 * in a {@link Data.Collection Collection}.
		 */
		start : 0,
		
		/**
		 * @cfg {Number} limit
		 * 
		 * The number of models to load. Used in conjunction with the {@link #start} config,
		 * when loading paged sets of data in a {@link Data.Collection Collection}.
		 * 
		 * Defaults to 0, for "no limit"
		 */
		limit : 0,
		
		
		/**
		 * Retrieves the value of the {@link #modelId} config, if it was provided.
		 * If it was not provided, returns null.
		 * 
		 * @return {String} The {@link #modelId} provided as a config (converted to a string, if the config was provided
		 *   as a number), or null if the config was not provided.
		 */
		getModelId : function() {
			return ( this.modelId !== undefined ) ? this.modelId + "" : null;
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
	
	return ReadOperation;
	
} );