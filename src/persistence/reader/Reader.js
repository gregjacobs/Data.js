/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.reader.Reader
	 * @extends Object
	 * 
	 * The intention of a Reader is to read raw data read in by a {@link Data.persistence.Proxy}, and convert
	 * it into a form which can be directly consumed by a {@link Data.Model Model} or {@link Data.Collection Collection}.
	 */
	var Reader = Class.extend( Object, {
		abstractClass : true,
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Reads the raw data, and returns a {@link Data.persistence.ResultSet} object which holds the data
		 * in JavaScript object form, along with any metadata present.
		 * 
		 * @param {Mixed} rawData The raw data to transform.
		 * @return {Data.persistence.ResultSet} A ResultSet object which holds the data in JavaScript object form,
		 *   and any associated metadata that was present in the `rawData`.
		 */
		read : function() {
			
		}
		
	} );
	
	return Reader;
	
} );