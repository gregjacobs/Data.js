/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @class data.persistence.request.Batch
	 * 
	 * Represents one or more {@link data.persistence.request.Request Requests} which were executed in a logical
	 * group.
	 * 
	 * The Batch object provides access to each internal {@link data.persistence.request.Request Request}, and provides
	 * methods for determining the overall success or failure (error) state of the Requests within it. 
	 */
	var RequestBatch = Class.extend( Object, {
		
		/**
		 * @cfg {data.persistence.request.Request/data.persistence.request.Request[]} requests
		 * 
		 * One or more Request(s) that make up the Batch.
		 */
		
		
		/**
		 * @private
		 * @property {Number} id
		 * 
		 * The RequestBatch's ID. This is a unique number for each RequestBatch that is created, and its value
		 * is ever-increasing. This means that an RequestBatch object created after another RequestBatch
		 * will have a higher ID value than the first RequestBatch. 
		 * 
		 * This property of the ID value is used to determine when an older request has completed after a newer one.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			this.id = +_.uniqueId();
			
			// normalize the `requests` config to an array
			this.requests = ( this.requests ) ? [].concat( this.requests ) : [];
		},
		
		
		/**
		 * Retrieves the RequestBatch's {@link #id}.
		 * 
		 * @return {Number}
		 */
		getId : function() {
			return this.id;
		},
		
		
		/**
		 * Retrieves all of the {@link #requests} for this Batch. 
		 * 
		 * @return {data.persistence.request.Request[]}
		 */
		getRequests : function() {
			return this.requests;
		},
		
		
		/**
		 * Retrieves all of the {@link data.persistence.request.Create Create} requests in the Batch.
		 * 
		 * @return {data.persistence.request.Create[]}
		 */
		getCreateRequests : function() {
			return _.filter( this.requests, function( req ) { return req.getAction() === 'create'; } );
		},
		
		
		/**
		 * Retrieves all of the {@link data.persistence.request.Update Update} requests in the Batch.
		 * 
		 * @return {data.persistence.request.Update[]}
		 */
		getUpdateRequests : function() {
			return _.filter( this.requests, function( req ) { return req.getAction() === 'update'; } );
		},
		
		
		/**
		 * Retrieves all of the {@link data.persistence.request.Destroy Destroy} requests in the Batch.
		 * 
		 * @return {data.persistence.request.Destroy[]}
		 */
		getDestroyRequests : function() {
			return _.filter( this.requests, function( req ) { return req.getAction() === 'destroy'; } );
		},
		
		
		// -----------------------------------
		
		// Completion Methods
		
		
		/**
		 * Determines if the Batch of {@link #requests} completed successfully. All {@link #requests}
		 * must have completed successfully for the Batch to be considered successful.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return _.all( this.requests, function( req ) { return req.wasSuccessful(); } );
		},
		
		
		/**
		 * Determines if the Batch failed to complete successfully. If any of the {@link #requests}
		 * has errored, this method returns true.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return !this.wasSuccessful();
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.request.Request Request} object that has completed
		 * successfully.
		 * 
		 * @return {data.persistence.request.Request[]} An array of the Requests which have completed
		 *   successfully.
		 */
		getSuccessfulRequests : function() {
			return _.filter( this.requests, function( req ) { return req.wasSuccessful(); } );
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.request.Request Request} object that has errored.
		 * 
		 * @return {data.persistence.request.Request[]} An array of the Requests which have errored.
		 */
		getErroredRequests : function() {
			return _.filter( this.requests, function( req ) { return req.hasErrored(); } );
		},
		
		
		/**
		 * Determines if all {@link data.persistence.request.Request Requests} in the batch are complete.
		 * 
		 * @return {Boolean} `true` if all Requests are complete, `false` if any are not yet complete.
		 */
		isComplete : function() {
			return _.all( this.requests, function( req ) { return req.isComplete(); } );
		}
		
	} );
	
	return RequestBatch;
	
} );