/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.operation.Operation
	 * 
	 * Represents an operation for a {@link Data.persistence.Proxy} to carry out. This class basically represents 
	 * any CRUD operation to be performed, passes along any options needed for that operation, and accepts any data/state
	 * as a result of that operation. 
	 * 
	 * Operation's subclasses are split into two distinct implementations:
	 * 
	 * - {@link Data.persistence.operation.ReadOperation}: Represents an Operation to read (load) data from persistence storage.
	 * - {@link Data.persistence.operation.WriteOperation}: Represents an Operation to write (store) data to persistence storage.
	 *   This includes destroying (deleting) models as well.
	 * 
	 * This class is used internally by the framework when making requests to {@link Data.persistence.Proxy Proxies},
	 * but is provided to client callbacks for when {@link Data.Model Model}/{@link Data.Collection Collection} operations 
	 * complete.
	 */
	var Operation = Class.extend( Object, {
		
		/**
		 * @cfg {Object} params
		 * 
		 * Any parameters to pass along for the Operation.
		 */
		
		
		/**
		 * @protected
		 * @property {Object[]} data
		 * 
		 * Any data read by the Operation. This is set by a {@link Data.persistence.Proxy} when
		 * it finishes its routine, and can be retrieved via {@link #getData}.
		 * 
		 * - For cases of read operations, this will be the data that is read by the operation.
		 * - For cases of write operations, this will be any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model (say, with some computed attributes, or a generated id attribute),
		 *   then this property will be populated with that data. 
		 */
		
		
		/**
		 * @private
		 * @property {Boolean} success
		 * 
		 * Property which is set to true upon successful completion of the Operation. Read
		 * this value with {@link #wasSuccessful}.
		 */
		success : false,
		
		/**
		 * @private
		 * @property {Boolean} error
		 * 
		 * Property which is set to true upon failure to complete the Operation. Read this value
		 * with {@link #hasErrored}.
		 */
		error : false,
		
		
		/**
		 * @private
		 * @property {String/Object} exception
		 * 
		 * An object or string describing the exception that occurred. Set when {@link #setException}
		 * is called.
		 */
		exception : null,
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #params} for this Operation. Returns an empty
		 * object if no params were provided.
		 * 
		 * @return {Object}
		 */
		getParams : function() {
			return ( this.params || (this.params = {}) );
		},
		
		
		/**
		 * Accessor for a Proxy to set the data that is has read, once the operation completes.
		 * Calling this marks the Operation as {@link #wasSuccessful successful}.
		 * 
		 * @param {Object/Object[]} The data read by the Proxy. If a single object is provided,
		 *   it will be normalized to a one element array.
		 */
		setData : function( data ) {
			this.data = [].concat( data );
		},
		
		
		/**
		 * Any data read by the Operation. This is set by a {@link Data.persistence.Proxy} when
		 * it finishes its routine.
		 * 
		 * - For cases of read operations, this will be the data that is read by the operation.
		 * - For cases of write operations, this will be any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model (say, with some computed attributes, or a generated id attribute),
		 *   then this property will be populated with that data.
		 * 
		 * If a single object is read, it will be normalized to a one element array.
		 * 
		 * @return {Object[]} The data read by the Proxy. Will be an empty array if no data
		 *   has been set.
		 */
		getData : function() {
			return this.data || [];
		},
		
		
		/**
		 * Marks the Operation as successful.
		 */
		setSuccess : function() {
			this.success = true;
		},
		
		
		/**
		 * Determines if the Operation completed successfully.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return this.success;
		},
		
		
		/**
		 * Marks the Operation as having errored, and sets an exception object that describes the exception
		 * that has occurred.
		 * 
		 * @param {String/Object} exception An object or string describing the exception that occurred.
		 */
		setException : function( exception ) {
			this.error = true;
			this.exception = exception;
		},
		
		
		/**
		 * Retrieves any exception object attached for an errored Operation.
		 * 
		 * @return {String/Object} The {@link #exception} object or string which describes
		 *   the exception that occurred for an errored Operation.
		 */
		getException : function() {
			return this.exception;
		},
		
		
		/**
		 * Determines if the Operation failed to complete successfully.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return this.error;
		}
		
	} );
	
	return Operation;
	
} );