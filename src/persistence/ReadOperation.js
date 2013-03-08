/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class Data.persistence.ReadOperation
	 * @extends Data.persistence.Operation
	 * 
	 * Represents a read operation from a persistent storage mechanism. 
	 * 
	 * This class is used internally by the framework when making requests to {@link Data.persistence.Proxy Proxies},
	 * but is provided to client callbacks for when {@link Data.Model Model}/{@link Data.Collection Collection} operations 
	 * complete.
	 */
	var ReadOperation = Class.extend( Object, {
		
		/**
		 * @cfg {Number} start
		 * 
		 * The start index of where to load models from. Used for when loading paged data.
		 */
		start : 0,
		
		/**
		 * @cfg {Number} limit
		 * 
		 * The number of models to load. Used in conjunction with the {@link #start} config,
		 * when loading paged data.
		 * 
		 * Defaults to 0, for "no limit"
		 */
		limit : 0,
		
		
		/**
		 * Sets the {@link #models} that the Operation read.
		 * 
		 * @param {Data.Model[]} models The models to set to the Operation.
		 */
		setModels : function( models ) {
			this.models = models;
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