/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @class data.persistence.Record
	 * @extends Object
	 * 
	 * Represents a single record of {@link data.Model Model} data. 
	 * 
	 * A record of data includes a {@link #version} number (which relates to a Model's {@link data.Model#version version}), 
	 * and the Model's underlying data stored in anonymous Object form.
	 */
	var Record = Class.create( {
		
		/**
		 * @cfg {Object} data (required)
		 * 
		 * The underlying data object which represents a {@link data.Model Model}.
		 */
		
		/**
		 * @cfg {Number} version
		 * 
		 * The version number for the Record's {@link #data} (if any). This is usually derived directly
		 * from a {@link data.Model Model} when being stored, and is filled in from the stored data when
		 * going in the other direction (i.e. populating a model).
		 * 
		 * This is used for versioning of stored data, such as data stored using a 
		 * {@link data.persistence.proxy.WebStorage WebStorage Proxy}. If the data stored was from
		 * version 1 of the Model, but the Model has been changed to version 2, then a migration method
		 * will be executed to convert the data to version 2 of the Model's attributes.
		 * 
		 * Record data stored on a server (using say, the {@link data.persistence.proxy.Ajax Ajax Proxy}) is 
		 * usually not versioned. The server data format and the client Model is usually updated in sync, and 
		 * there is no reason for a client-side migration method in this case.
		 * 
		 * 
		 * TODO: Document a link to the migration method
		 */
		
		
		
		/**
		 * @constructor
		 * @param {Object} [config] The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( config ) {
			_.assign( this, config );
		},
		
		
		/**
		 * Retrieves the {@link #version} number for the {@link #data} that this Record holds. If there
		 * is no associated version number, returns `undefined`.
		 * 
		 * @return {Number}
		 */
		getVersion : function() {
			return this.version;
		},
		
		
		/**
		 * Retrieves the {@link #data} that this Record holds. Returns `null` if there is no data.
		 * 
		 * @return {Object}
		 */
		getData : function() {
			return this.data || null;
		}
		
	} );
	
	
	return Record;
	
} );