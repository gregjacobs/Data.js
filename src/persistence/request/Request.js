/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class data.persistence.request.Request
	 * 
	 * Represents a request for a {@link data.persistence.proxy.Proxy} to carry out. This class represents any CRUD request 
	 * to be performed, passes along any options needed for that request, and accepts any data/state as a result of the 
	 * request from the proxy. 
	 * 
	 * Note: This class does not (necessarily) represent an HTTP request. It represents a request to a 
	 * {@link data.persistence.proxy.Proxy Proxy}, which will in turn create/read/update/destroy the data wherever the 
	 * Proxy is written/configured to do so. This may be a server, local storage, etc.
	 * 
	 * ## Subclasses
	 * 
	 * Request's subclasses are split into two distinct implementations:
	 * 
	 * - {@link data.persistence.request.Read}: Represents an Request to read (load) data from persistence storage.
	 * - {@link data.persistence.request.Write}: Represents an Request to write (store) data to persistence storage.
	 *   This includes destroying (deleting) models as well.
	 * 
	 * This class is mainly used internally by the framework for making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} requests 
	 * complete, so information can be obtained about the request that took place. The request(s) are available from the 
	 * {@link data.persistence.operation.Operation Operation} object that represents a high level load/save operation
	 * for a {@link data.Model Model}/{@link data.Collection Collection}.
	 */
	var Request = Class.create( {
		abstractClass : true,
		
		
		/**
		 * @cfg {Object} params
		 * 
		 * A map of any parameters to pass along for the Request. These parameters will be interpreted by the
		 * particular {@link data.persistence.proxy.Proxy} that is being used. For example, the 
		 * {@link data.persistence.proxy.Ajax Ajax} proxy appends them as URL parameters for the request.
		 * 
		 * Example:
		 * 
		 *     params : {
		 *         param1: "value1",
		 *         param2: "value2
		 *     }
		 */
		
		
		/**
		 * @private
		 * @property {String} uuid
		 * 
		 * The unique identifier for this Request. This is created lazily upon request. Retrieve with 
		 * {@link #getUuid}.
		 */
		
		/**
		 * @protected
		 * @property {data.persistence.ResultSet} resultSet
		 * 
		 * A ResultSet object which contains any data read by the Request. This object contains any 
		 * returned data, as well as any metadata (such as the total number of records in a paged data set).
		 * This object is set by a {@link data.persistence.proxy.Proxy} when it finishes its routine, and can be 
		 * retrieved via {@link #getResultSet}. Some notes:
		 * 
		 * - For cases of read requests, this object will contain the data that is read by the request.
		 * - For cases of write requests, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain that data.
		 */
		
		/**
		 * @private
		 * @property {Boolean} success
		 * 
		 * Property which is set to true upon successful completion of the Request. Read
		 * this value with {@link #wasSuccessful}.
		 */
		success : false,
		
		/**
		 * @private
		 * @property {Boolean} errored
		 * 
		 * Property which is set to true upon failure to complete the Request. Read this value
		 * with {@link #hasErrored}.
		 */
		errored : false,
		
		/**
		 * @private
		 * @property {String/Object} error
		 * 
		 * An object or string describing the error that occurred. Set when {@link #setError}
		 * is called.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #uuid unique identifier} for this Request.
		 * 
		 * @return {String} The unique identifier for this Request.
		 */
		getUuid : function() {
			return this.uuid || ( this.uuid = _.uniqueId() );  // Create the uuid lazily if one has not yet been created
		},
		
		
		/**
		 * Retrieves the {@link #params} for this Request. Returns an empty
		 * object if no params were provided.
		 * 
		 * @return {Object}
		 */
		getParams : function() {
			return ( this.params || (this.params = {}) );
		},
		
		
		/**
		 * Retrieves the CRUD action name for the Request.
		 * 
		 * @protected
		 * @abstract
		 * @return {String} One of: 'create', 'read', 'update', 'destroy'
		 */
		getAction : Class.abstractMethod,
		
		
		/**
		 * Accessor for a Proxy to set a ResultSet which contains the data that is has read, 
		 * once the request completes.
		 * 
		 * @param {data.persistence.ResultSet} resultSet A ResultSet which contains the data and any metadata read by 
		 *   the Proxy.
		 */
		setResultSet : function( resultSet ) {
			this.resultSet = resultSet;
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.ResultSet} containing any data and metadata read by the 
		 * Request. This is set by a {@link data.persistence.proxy.Proxy} when it finishes its routine.  
		 * 
		 * - For cases of read requests, this object will contain the data that is read by the request.
		 * - For cases of write requests, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain that data.
		 * 
		 * @return {data.persistence.ResultSet} The ResultSet read by the Proxy, or null if one has not been set.
		 */
		getResultSet : function() {
			return this.resultSet;
		},
		
		
		/**
		 * Marks the Request as successful.
		 */
		setSuccess : function() {
			this.success = true;
		},
		
		
		/**
		 * Determines if the Request completed successfully.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return this.success;
		},
		
		
		/**
		 * Marks the Request as having errored, and optionally sets an `error` object that describes the 
		 * error that has occurred.
		 * 
		 * @param {String/Object} [error] An object or string describing the error that occurred.
		 */
		setError : function( error ) {
			this.errored = true;
			this.error = error;
		},
		
		
		/**
		 * Determines if the Request failed to complete successfully.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return this.errored;
		},
		
		
		/**
		 * Retrieves any {@link #error} object attached for an errored Request (via 
		 * {@link #setError}).
		 * 
		 * @return {String/Object} The {@link #error} object or string which describes
		 *   the error that occurred for an errored Request. Returns `undefined` if no error
		 *   object has been set.
		 */
		getError : function() {
			return this.error;
		},
		
		
		/**
		 * Determines if the Request is complete.
		 * 
		 * @return {Boolean}
		 */
		isComplete : function() {
			return this.success || this.errored;
		}
		
	} );
	
	return Request;
	
} );