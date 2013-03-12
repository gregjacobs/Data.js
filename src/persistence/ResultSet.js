/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.ResultSet
	 * @extends Object
	 * 
	 * Simple wrapper which holds the data returned by any {@link Data.persistence.Proxy Proxy} 
	 * operation, along with any metadata such as the total number of data records in a windowed 
	 * data set.
	 */
	var Reader = Class.extend( Object, {
		
		/**
		 * @cfg {Object/Object[]} records
		 * 
		 * One or more data records that have been returned by a {@link Data.persistence.Proxy Proxy}, 
		 * after they have been converted to plain JavaScript objects by a 
		 * {@link Data.persistence.reader.Reader Reader}.
		 */
		
		/**
		 * @cfg {Number} totalCount
		 * 
		 * Metadata for the total number of records in the data set. This is used for windowed (paged) 
		 * data sets, and will be the total number of records available on the storage medium (ex: a 
		 * server database).
		 * 
		 * To find the number of records in this particular ResultSet, use {@link #getRecords} method 
		 * and check the `length` property.
		 */
		totalCount : 0,
		
		/**
		 * @cfg {String} message
		 * 
		 * Any message metadata for the ResultSet.
		 */
		message : "",
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #records} in this ResultSet.
		 * 
		 * @return {Object[]}
		 */
		getRecords : function() {
			var records = this.records;
			
			// Convert a single object into an array
			if( records && !_.isArray( records ) ) {
				this.records = records = [ records ];
			}
			return records || (this.records = []);   // no records provided, return empty array
		},
		
		
		/**
		 * Retrieves the {@link #totalCount}.
		 * 
		 * @return {Number}
		 */
		getTotalCount : function() {
			return this.totalCount;
		},
		
		
		/**
		 * Retrieves the {@link #message}, if there is any.
		 * 
		 * @return {String}
		 */
		getMessage : function() {
			return this.message;
		}
		
	} );
	
	return Reader;
	
} );