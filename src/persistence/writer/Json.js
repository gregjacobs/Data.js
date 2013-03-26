/*global define */
define( [
	'Class',
	'data/persistence/write/Writer'
], function( Class, Writer ) {
	
	/**
	 * @class data.persistence.writer.Json
	 * @extends data.persistence.writer.Writer
	 * 
	 * JSON flavor writer which converts {@link data.Model Model} data into a JSON string.
	 * 
	 * See {@link data.persistence.writer.Writer} for more information on writers.
	 */
	var JsonWriter = Class.extend( Writer, {
		
		// TODO: implement configs for wrapping the entire JSON set in a property, and wrapping
		//       each individual model in a property.
		
		
		/**
		 * Implementation of abstract method to write an array of {@link data.Model Models} in JSON form.
		 * 
		 * @protected
		 * @param {Object[]} records The models which have been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {String} The JSON string that represents the `records`.
		 */
		writeRecords : function( records ) {
			return JSON.stringify( records );
		},
		
		
		/**
		 * Implementation of abstract method to write a single {@link data.Model Model} in JSON form.
		 * 
		 * @protected
		 * @param {Object} record The model which has been processed into plain JavaScript Object form, in preparation
		 *   for serialization.
		 * @return {String} The JSON string that represents the `record`.
		 */
		writeRecord : function( record ) {
			return JSON.stringify( record );
		}
		
	} );
	
	return JsonWriter;
	
} );