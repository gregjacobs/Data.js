/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/write/Writer'
], function( _, Class, Writer ) {
	
	/**
	 * @class data.persistence.writer.Xml
	 * @extends data.persistence.writer.Writer
	 * 
	 * XML flavor writer which converts {@link data.Model Model} data into an XML string.
	 * 
	 * See {@link data.persistence.writer.Writer} for more information on writers.
	 */
	var XmlWriter = Class.extend( Writer, {		
		
		/**
		 * Implementation of abstract method to write an array of {@link data.Model Models} in XML form.
		 * 
		 * @protected
		 * @param {Object[]} records The models which have been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {String} The XML string that represents the `records`.
		 */
		writeRecords : function( records ) {
			throw new Error( "not yet implemented" );
		},
		
		
		/**
		 * Implementation of abstract method to write a single {@link data.Model Model} in XML form.
		 * 
		 * @protected
		 * @param {Object} record The model which has been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {String} The XML string that represents the `record`.
		 */
		writeRecord : function( record ) {
			throw new Error( "not yet implemented" );
		}
		
	} );
	
	return XmlWriter;
	
} );